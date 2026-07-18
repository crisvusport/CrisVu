/* ==========================================================
   CRIS VŨ — app.js  (dùng chung cho trang chủ + catalog)
   Cần load sau i18n.js
   ========================================================== */

let PRODUCTS = [];

/* ---------- Ảnh placeholder áo đấu (khi chưa có ảnh thật) ---------- */
function jerseySVG(accent, label){
  const c = (accent || "#C9A24B").replace("#","");
  return `<svg viewBox="0 0 300 375" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
    <defs><linearGradient id="g${c}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#${c}" stop-opacity=".5"/>
      <stop offset="1" stop-color="#${c}" stop-opacity=".12"/>
    </linearGradient></defs>
    <rect width="300" height="375" fill="#0A0B0E"/>
    <path d="M96 42 L120 22 L150 38 L180 22 L204 42 L244 78 L214 118 L196 102 L196 340 L104 340 L104 102 L86 118 L56 78 Z"
      fill="url(#g${c})" stroke="#${c}" stroke-width="2" stroke-opacity=".55"/>
    <text x="150" y="205" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="58" fill="#${c}" opacity=".82">CV</text>
    <text x="150" y="362" text-anchor="middle" font-family="monospace" font-size="10" letter-spacing="2" fill="#878A94">${(label||'').toUpperCase()}</text>
  </svg>`;
}

/* Ưu tiên ảnh thật images/{id}-{key}.jpg; nếu không có -> placeholder */
function mediaHTML(p, key){
  const label = t("img." + key);
  const tid = `ph_${p.id}_${key}`.replace(/[^a-z0-9_]/gi,"_");
  return `<span class="media-wrap">
    <img src="images/${p.id}-${key}.jpg" alt="${label}" loading="lazy"
         onerror="this.replaceWith(document.getElementById('${tid}').content.cloneNode(true).firstElementChild)">
    <template id="${tid}">${jerseySVG(p.accent, label)}</template>
  </span>`;
}

/* ---------- Thẻ sản phẩm ---------- */
function cardHTML(p){
  const chips = [];
  chips.push(`<span class="chip">${t("kit."+p.kit)}</span>`);
  if(p.version) chips.push(`<span class="chip gold">${t("version."+p.version)}</span>`);
  (p.special||[]).forEach(s => chips.push(`<span class="chip">${t("special."+s)}</span>`));
  return `<button class="card" data-id="${p.id}" aria-label="${productName(p)}">
    <div class="card-media">
      <span class="card-accent" style="background:${p.accent}"></span>
      <span class="card-tag">${p.season}</span>
      ${mediaHTML(p, p.images[0])}
    </div>
    <div class="card-body">
      <div class="card-team">${t("cat."+p.category)} · ${p.team}</div>
      <div class="card-name">${productName(p)}</div>
      <div class="card-meta">${chips.join("")}</div>
    </div>
  </button>`;
}

function bindCards(container){
  container.querySelectorAll(".card").forEach(c =>
    c.addEventListener("click", () => openLightbox(c.dataset.id)));
}

/* ---------- Lightbox ---------- */
function openLightbox(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  const lb = document.getElementById("lb");
  const gal = document.getElementById("lb-gallery");
  const dots = document.getElementById("lb-dots");

  gal.innerHTML = p.images.map(k => `<div class="lb-slide">${mediaHTML(p,k)}</div>`).join("");
  dots.innerHTML = p.images.map((_,i)=>`<span class="lb-dot ${i===0?'active':''}"></span>`).join("");
  document.getElementById("lb-team").textContent = t("cat."+p.category) + " · " + p.team;
  document.getElementById("lb-name").textContent = productName(p);
  document.getElementById("lb-sizes").innerHTML = p.sizes.map(s=>`<span class="chip">${s}</span>`).join("");

  const zalo = document.getElementById("lb-order");
  zalo.href = "https://zalo.me/" + CONTACT.zalo;

  gal.scrollLeft = 0;
  gal.onscroll = () => {
    const i = Math.round(gal.scrollLeft / gal.clientWidth);
    dots.querySelectorAll(".lb-dot").forEach((d,idx)=>d.classList.toggle("active", idx===i));
  };
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  document.getElementById("lb").classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- Nút liên hệ nổi ---------- */
function initFab(){
  const z = document.getElementById("fab-zalo");   if(z) z.href = "https://zalo.me/"+CONTACT.zalo;
  const ph = document.getElementById("fab-phone");  if(ph) ph.href = "tel:"+CONTACT.phone;
  const fb = document.getElementById("fab-fb");     if(fb) fb.href = CONTACT.facebook;
  const ig = document.getElementById("fab-ig");     if(ig) ig.href = CONTACT.instagram;
  const tgl = document.getElementById("fab-toggle");
  const menu = document.getElementById("fab-menu");
  if(tgl && menu) tgl.addEventListener("click", ()=> menu.classList.toggle("open"));
}

/* ---------- Nút chuyển ngôn ngữ ---------- */
function initLang(){
  const btn = document.getElementById("lang-btn");
  if(btn){
    btn.textContent = t("lang.switch");
    btn.href = toggleLangUrl();
  }
}

/* ---------- Load dữ liệu ---------- */
async function loadProducts(){
  try{
    const res = await fetch("data/products.json", {cache:"no-store"});
    PRODUCTS = await res.json();
  }catch(e){ console.error("Không đọc được products.json", e); PRODUCTS = []; }
}

/* ---------- Khởi tạo lightbox chung ---------- */
function initLightbox(){
  const close = document.getElementById("lb-close");
  const lb = document.getElementById("lb");
  if(close) close.addEventListener("click", closeLightbox);
  if(lb) lb.addEventListener("click", e => { if(e.target.id==="lb") closeLightbox(); });
  document.addEventListener("keydown", e => { if(e.key==="Escape") closeLightbox(); });
}
