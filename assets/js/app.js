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

/* Nhãn ảnh: hỗ trợ nhiều ảnh chi tiết (detail, detail-2, ...) */
function imgLabel(key){
  if(key === "front") return t("img.front");
  if(key === "back") return t("img.back");
  if(String(key).startsWith("detail")) return t("img.detail");
  return key;
}

/* Ưu tiên ảnh thật images/{id}-{key}.jpg; nếu không có -> placeholder */
function mediaHTML(p, key){
  const label = imgLabel(key);
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

  gal.scrollLeft = 0;
  gal.onscroll = () => {
    const i = Math.round(gal.scrollLeft / gal.clientWidth);
    dots.querySelectorAll(".lb-dot").forEach((d,idx)=>d.classList.toggle("active", idx===i));
  };

  // nút chuyển ảnh chỉ hiện khi có nhiều hơn 1 ảnh
  const multi = p.images.length > 1;
  const prevB = document.getElementById("lb-prev");
  const nextB = document.getElementById("lb-next");
  if(prevB) prevB.classList.toggle("show", multi);
  if(nextB) nextB.classList.toggle("show", multi);
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

/* ---------- 4 nút liên hệ trong khung chi tiết sản phẩm ---------- */
function initLightboxContacts(){
  const z = document.getElementById("lbc-zalo");   if(z) z.href = "https://zalo.me/"+CONTACT.zalo;
  const ph = document.getElementById("lbc-phone");  if(ph) ph.href = "tel:"+CONTACT.phone;
  const fb = document.getElementById("lbc-fb");     if(fb) fb.href = CONTACT.facebook;
  const ig = document.getElementById("lbc-ig");     if(ig) ig.href = CONTACT.instagram;
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
  const gal = document.getElementById("lb-gallery");
  if(close) close.addEventListener("click", closeLightbox);
  if(lb) lb.addEventListener("click", e => { if(e.target.id==="lb") closeLightbox(); });
  document.addEventListener("keydown", e => { if(e.key==="Escape") closeLightbox(); });

  // nút chuyển ảnh (máy tính)
  const prevB = document.getElementById("lb-prev");
  const nextB = document.getElementById("lb-next");
  if(gal && prevB) prevB.addEventListener("click", e => { e.stopPropagation(); gal.scrollBy({left:-gal.clientWidth, behavior:"smooth"}); });
  if(gal && nextB) nextB.addEventListener("click", e => { e.stopPropagation(); gal.scrollBy({left: gal.clientWidth, behavior:"smooth"}); });
  // phím mũi tên trái/phải
  document.addEventListener("keydown", e => {
    if(!lb.classList.contains("open")) return;
    if(e.key==="ArrowLeft" && gal) gal.scrollBy({left:-gal.clientWidth, behavior:"smooth"});
    if(e.key==="ArrowRight" && gal) gal.scrollBy({left: gal.clientWidth, behavior:"smooth"});
  });

  // chạm/bấm vào ảnh -> mở khung phóng to (chỉ với ảnh thật)
  if(gal) gal.addEventListener("click", e => {
    if(e.target.closest(".lb-nav")) return;
    const im = e.target.closest(".media-wrap img");
    if(im && im.getAttribute("src")) openZoom(im.src);
  });
}

/* ==========================================================
   ZOOM ẢNH: nền tối, ảnh giữa màn hình, phóng to & kéo
   - Điện thoại: chụm 2 ngón / nhấp đúp để phóng to, kéo để di chuyển
   - Máy tính: lăn chuột / nhấp đúp để phóng to, kéo để di chuyển
   ========================================================== */
function initZoom(){
  const zoom = document.getElementById("zoom");
  if(!zoom) return;
  const stage = document.getElementById("zoom-stage");
  const img = document.getElementById("zoom-img");
  const closeBtn = document.getElementById("zoom-close");
  const hint = document.getElementById("zoom-hint");

  let scale = 1, tx = 0, ty = 0;
  let baseW = 0, baseH = 0;
  const MIN = 1, MAX = 5;
  const pointers = new Map();
  let startDist = 0, startScale = 1;
  let panStart = null;
  let lastTap = 0;

  function apply(){ img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; }
  function measure(){
    const r = img.getBoundingClientRect();
    baseW = r.width / scale; baseH = r.height / scale;
  }
  function clampPan(){
    const maxX = Math.max(0, (baseW * scale - window.innerWidth) / 2 + 30);
    const maxY = Math.max(0, (baseH * scale - window.innerHeight) / 2 + 30);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }
  function setScale(s){
    scale = Math.min(MAX, Math.max(MIN, s));
    if(scale === 1){ tx = 0; ty = 0; }
    clampPan(); apply();
  }

  window.openZoom = (src) => {
    img.src = src;
    scale = 1; tx = 0; ty = 0; apply();
    if(hint) hint.textContent = t("zoom.hint");
    zoom.classList.add("open");
    img.onload = () => { measure(); };
  };
  function closeZoom(){ zoom.classList.remove("open"); img.src = ""; scale = 1; tx = 0; ty = 0; }

  closeBtn.addEventListener("click", closeZoom);
  zoom.addEventListener("click", e => { if(e.target === zoom || e.target === stage){ if(scale === 1) closeZoom(); } });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && zoom.classList.contains("open")) closeZoom(); });

  // lăn chuột để phóng to (máy tính)
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    setScale(scale * (e.deltaY < 0 ? 1.15 : 1/1.15));
  }, { passive:false });

  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

  let lastPointerType = "mouse";
  stage.addEventListener("pointerdown", e => {
    lastPointerType = e.pointerType || "mouse";
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pointers.size === 1){
      panStart = { x:e.clientX - tx, y:e.clientY - ty };
      if(e.pointerType === "touch"){   // điện thoại: chạm 2 lần để phóng to
        const now = Date.now();
        if(now - lastTap < 300){ setScale(scale > 1 ? 1 : 2.5); lastTap = 0; }
        else lastTap = now;
      }
    } else if(pointers.size === 2){
      const p = [...pointers.values()];
      startDist = dist(p[0], p[1]);
      startScale = scale;
    }
  });
  // máy tính: nhấp đúp để phóng to / thu nhỏ
  stage.addEventListener("dblclick", () => {
    if(lastPointerType === "touch") return;
    setScale(scale > 1 ? 1 : 2.5);
  });
  window.addEventListener("pointermove", e => {
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const p = [...pointers.values()];
    if(pointers.size === 2){
      setScale(startScale * dist(p[0], p[1]) / startDist);
    } else if(pointers.size === 1 && scale > 1 && panStart){
      tx = e.clientX - panStart.x;
      ty = e.clientY - panStart.y;
      clampPan(); apply();
    }
  });
  function up(e){
    if(!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if(pointers.size === 1){ const p = [...pointers.values()][0]; panStart = { x:p.x - tx, y:p.y - ty }; }
    if(scale <= 1){ tx = 0; ty = 0; apply(); }
  }
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}
