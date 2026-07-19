/* ==========================================================
   CRIS VŨ — admin.js  (Trang quản trị)
   Thêm / sửa / xoá sản phẩm + tải ảnh, lưu thẳng vào GitHub.
   Không lưu token lâu dài: chỉ giữ trong phiên làm việc (đóng tab là mất).
   ========================================================== */

/* Thông tin repo — nếu sau này đổi tên repo thì sửa ở đây */
const REPO = { owner: "crisvusport", name: "CrisVu", branch: "main" };
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;

/* ---- Danh mục lựa chọn (khớp với website) ---- */
const OPT = {
  loai: [["ao","Áo"],["quan","Quần"],["bo-tre-em","Bộ trẻ em"]],
  category: [["clb","CLB"],["doi-tuyen","Đội tuyển"],["retro","Retro"]],
  kit: [["home","Sân nhà"],["away","Sân khách"],["third","Third"],["ao-tap","Áo tập"]],
  version: [["fan","Fan"],["player","Player"]],
  special: [["retro","Retro"],["dai-tay","Dài tay"],["crop-top","Crop top"]]
};

let PRODUCTS = [];
let productsSha = null;
let editingId = null;   // null = đang thêm mới; có giá trị = đang sửa

/* Ảnh đang chọn (chưa lưu) — cho phép xem trước và bỏ từng ảnh */
let pendingFront = null;
let pendingBack = null;
let pendingDetails = [];
function resetPendings(){ pendingFront = null; pendingBack = null; pendingDetails = []; }

/* Vẽ ảnh xem trước cho 1 ô (front/back) */
function slotPreviewHTML(kind){
  const p = editingId ? PRODUCTS.find(x=>x.id===editingId) : null;
  const pending = kind === "front" ? pendingFront : pendingBack;
  if(pending){
    const url = URL.createObjectURL(pending);
    return `<span class="pv"><img src="${url}"><button type="button" class="pv-x" data-clear="${kind}">✕</button></span><span class="cur-ok">ảnh mới</span>`;
  }
  if(p && (p.images||[]).includes(kind)){
    return `<img class="thumb" src="images/${p.id}-${kind}.jpg" onerror="this.style.display='none'"><span class="cur-ok">ảnh hiện tại</span>`;
  }
  return "";
}
/* Vẽ ảnh xem trước cho ô chi tiết (nhiều ảnh) */
function detailPreviewHTML(){
  const p = editingId ? PRODUCTS.find(x=>x.id===editingId) : null;
  if(pendingDetails.length){
    return pendingDetails.map((f,i)=>{
      const url = URL.createObjectURL(f);
      return `<span class="pv"><img src="${url}"><button type="button" class="pv-x" data-cleardetail="${i}">✕</button></span>`;
    }).join("") + `<span class="cur-ok">${pendingDetails.length} ảnh mới</span>`;
  }
  if(p){
    const details = (p.images||[]).filter(k=>k.startsWith("detail"));
    if(details.length){
      return details.map(k=>`<img class="thumb" src="images/${p.id}-${k}.jpg" onerror="this.style.display='none'">`).join("")
             + `<span class="cur-ok">${details.length} ảnh hiện tại</span>`;
    }
  }
  return "";
}
function renderImagePreviews(){
  document.getElementById("cur-front").innerHTML = slotPreviewHTML("front");
  document.getElementById("cur-back").innerHTML = slotPreviewHTML("back");
  document.getElementById("cur-detail").innerHTML = detailPreviewHTML();
  document.querySelectorAll("[data-clear]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.clear;
    if(k === "front"){ pendingFront = null; document.getElementById("in-front").value = ""; }
    if(k === "back"){ pendingBack = null; document.getElementById("in-back").value = ""; }
    renderImagePreviews();
  }));
  document.querySelectorAll("[data-cleardetail]").forEach(b => b.addEventListener("click", () => {
    pendingDetails.splice(Number(b.dataset.cleardetail), 1);
    renderImagePreviews();
  }));
}

/* ---------- Token (chỉ trong phiên) ---------- */
const tok = {
  get: () => sessionStorage.getItem("cv_token") || "",
  set: (t) => sessionStorage.setItem("cv_token", t),
  clear: () => sessionStorage.removeItem("cv_token")
};

/* ---------- Base64 an toàn cho tiếng Việt ---------- */
function utf8ToB64(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64ToUtf8(b64){ return decodeURIComponent(escape(atob(String(b64).replace(/\n/g,"")))); }

/* ---------- Gọi GitHub API ---------- */
async function ghGet(path){
  const res = await fetch(`${API}/contents/${path}?ref=${REPO.branch}`, {
    headers: { Authorization:`Bearer ${tok.get()}`, Accept:"application/vnd.github+json" }
  });
  if(res.status === 404) return null;
  if(!res.ok) throw new Error(`Đọc ${path} lỗi (${res.status})`);
  return res.json();
}
async function ghPut(path, contentB64, message, sha){
  const body = { message, content: contentB64, branch: REPO.branch };
  if(sha) body.sha = sha;
  const res = await fetch(`${API}/contents/${path}`, {
    method:"PUT",
    headers:{ Authorization:`Bearer ${tok.get()}`, Accept:"application/vnd.github+json", "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  if(!res.ok){ const e = await res.text(); throw new Error(`Lưu ${path} lỗi (${res.status}): ${e}`); }
  return res.json();
}
async function ghDelete(path, message, sha){
  const res = await fetch(`${API}/contents/${path}`, {
    method:"DELETE",
    headers:{ Authorization:`Bearer ${tok.get()}`, Accept:"application/vnd.github+json", "Content-Type":"application/json" },
    body: JSON.stringify({ message, sha, branch: REPO.branch })
  });
  if(!res.ok) throw new Error(`Xoá ${path} lỗi (${res.status})`);
  return res.json();
}

/* ---------- Nén ảnh -> JPEG base64 (nhẹ, load nhanh) ---------- */
function fileToJpegB64(file, maxW=1200, quality=0.85){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if(w > maxW){ h = Math.round(h * maxW / w); w = maxW; }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0A0B0E"; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Ảnh không hợp lệ")); };
    img.src = url;
  });
}
async function uploadImage(id, key, file){
  const b64 = await fileToJpegB64(file);
  const path = `images/${id}-${key}.jpg`;
  const existing = await ghGet(path);
  await ghPut(path, b64, `Ảnh ${path}`, existing ? existing.sha : null);
}

/* ---------- Slug + tạo mã sản phẩm ---------- */
function slugify(s){
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/đ/g,"d")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function makeId(team, kit, season, version){
  let base = [slugify(team), kit, slugify(season), version].filter(Boolean).join("-") || "sp";
  let id = base, n = 2;
  while(PRODUCTS.some(p => p.id === id)){ id = base + "-" + n; n++; }
  return id;
}

/* ---------- Đăng nhập ---------- */
async function tryLogin(token){
  tok.set(token);
  const res = await fetch(API, { headers:{ Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json" }});
  if(res.status === 401) throw new Error("Token không đúng hoặc đã hết hạn.");
  if(res.status === 404) throw new Error("Không truy cập được repo. Kiểm tra token có quyền với repo CrisVu chưa.");
  if(!res.ok) throw new Error("Đăng nhập lỗi ("+res.status+").");
  return true;
}

async function loadProductsAdmin(){
  const data = await ghGet("data/products.json");
  if(!data){ PRODUCTS = []; productsSha = null; return; }
  productsSha = data.sha;
  PRODUCTS = JSON.parse(b64ToUtf8(data.content));
}
async function saveProductsJson(message){
  const json = JSON.stringify(PRODUCTS, null, 2);
  const res = await ghPut("data/products.json", utf8ToB64(json), message, productsSha);
  productsSha = res.content.sha;
}

/* ==========================================================
   Giao diện
   ========================================================== */
function show(id){ document.getElementById(id).style.display = "block"; }
function hide(id){ document.getElementById(id).style.display = "none"; }
function setStatus(msg, type){
  document.querySelectorAll(".status").forEach(el => {
    el.textContent = msg || "";
    el.className = "status" + (type ? " "+type : "");
  });
}

function fillSelect(sel, options){
  sel.innerHTML = options.map(([v,l]) => `<option value="${v}">${l}</option>`).join("");
}
function label(kind, val){
  const found = (OPT[kind]||[]).find(o => o[0] === val);
  return found ? found[1] : val;
}

/* Danh sách sản phẩm hiện có */
function renderList(){
  const list = document.getElementById("prod-list");
  document.getElementById("prod-count").textContent = PRODUCTS.length;
  if(PRODUCTS.length === 0){ list.innerHTML = `<p class="muted">Chưa có sản phẩm nào.</p>`; return; }
  list.innerHTML = PRODUCTS.map(p => {
    const name = [label("loai",p.loai), p.team, p.season, label("kit",p.kit),
                  label("version",p.version), ...(p.special||[]).map(s=>label("special",s))]
                  .filter(Boolean).join(" · ");
    return `<div class="prow">
      <div class="prow-color" style="background:${p.accent||'#C9A24B'}"></div>
      <div class="prow-main">
        <div class="prow-name">${name} ${p.featured?'<span class="star">★</span>':''}</div>
        <div class="prow-meta">${label("category",p.category)} · ${(p.sizes||[]).join(", ")} · ${(p.images||[]).length} ảnh</div>
      </div>
      <div class="prow-actions">
        <button class="btn-sm" data-edit="${p.id}">Sửa</button>
        <button class="btn-sm danger" data-del="${p.id}">Xoá</button>
      </div>
    </div>`;
  }).join("");
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", ()=>openForm(b.dataset.edit)));
  list.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", ()=>deleteProduct(b.dataset.del)));
}

/* Mở form thêm/sửa */
function openForm(id){
  editingId = id || null;
  const f = document.forms["prod-form"];
  f.reset();
  resetPendings();
  document.getElementById("in-front").value = "";
  document.getElementById("in-back").value = "";
  document.getElementById("in-detail").value = "";
  document.getElementById("form-title").textContent = id ? "Sửa sản phẩm" : "Thêm sản phẩm mới";

  if(id){
    const p = PRODUCTS.find(x=>x.id===id);
    f.loai.value = p.loai; f.category.value = p.category; f.team.value = p.team;
    f.season.value = p.season; f.kit.value = p.kit; f.version.value = p.version;
    f.accent.value = p.accent || "#C9A24B";
    f.sizes.value = (p.sizes||[]).join(", ");
    f.featured.checked = !!p.featured;
    document.querySelectorAll("input[name='special']").forEach(cb => cb.checked = (p.special||[]).includes(cb.value));
  }
  renderImagePreviews();
  hide("dash-main"); show("form-screen");
  window.scrollTo(0,0);
}
function closeForm(){ show("dash-main"); hide("form-screen"); setStatus(""); }

/* Lưu sản phẩm (thêm hoặc sửa) */
async function submitForm(e){
  e.preventDefault();
  const f = e.target;
  const team = f.team.value.trim();
  if(!team){ setStatus("Chưa nhập tên đội bóng.", "err"); return; }

  const saveBtn = document.getElementById("save-btn");
  saveBtn.disabled = true;
  let newId = null;

  try{
    const special = [...document.querySelectorAll("input[name='special']:checked")].map(c=>c.value);
    const sizes = f.sizes.value.split(",").map(s=>s.trim()).filter(Boolean);
    const base = {
      loai: f.loai.value, category: f.category.value, team,
      season: f.season.value.trim(), kit: f.kit.value, version: f.version.value,
      special, accent: f.accent.value, sizes, featured: f.featured.checked
    };

    let product, id;
    if(editingId){
      product = PRODUCTS.find(p=>p.id===editingId);
      id = editingId;
      Object.assign(product, base);
    }else{
      id = makeId(team, base.kit, base.season, base.version);
      product = { id, ...base, images: [] };
      PRODUCTS.push(product);
    }
    newId = editingId ? null : id;

    // ẢNH (lấy từ danh sách đang chọn, đã cho phép xem trước/bỏ)
    let images = editingId ? [...(product.images||[])] : [];
    const frontFile = pendingFront;
    const backFile = pendingBack;
    const detailFiles = pendingDetails;

    if(!editingId && !frontFile){ throw new Error("Cần ít nhất ảnh mặt trước cho sản phẩm mới."); }

    if(frontFile){ setStatus("Đang tải ảnh mặt trước...","info"); await uploadImage(id,"front",frontFile); if(!images.includes("front")) images.unshift("front"); }
    if(backFile){ setStatus("Đang tải ảnh mặt sau...","info"); await uploadImage(id,"back",backFile); if(!images.includes("back")) images.push("back"); }
    if(detailFiles.length){
      setStatus("Đang tải ảnh chi tiết...","info");
      images = images.filter(k=>!k.startsWith("detail")); // thay toàn bộ ảnh chi tiết
      for(let i=0;i<detailFiles.length;i++){
        const key = i===0 ? "detail" : `detail-${i+1}`;
        await uploadImage(id, key, detailFiles[i]);
        images.push(key);
      }
    }
    // sắp xếp: front, back, details
    const order = k => k==="front"?0 : k==="back"?1 : 2;
    product.images = images.sort((a,b)=>order(a)-order(b));

    setStatus("Đang lưu danh sách sản phẩm...","info");
    await saveProductsJson(editingId ? `Sửa ${id}` : `Thêm ${id}`);

    setStatus("Đã lưu! Web sẽ cập nhật sau khoảng 1 phút.","ok");
    resetPendings();
    renderList();
    setTimeout(closeForm, 1200);
  }catch(err){
    setStatus(err.message, "err");
    // nếu thêm mới bị lỗi, gỡ sản phẩm vừa thêm để không kẹt
    if(newId){ PRODUCTS = PRODUCTS.filter(p=>p.id!==newId); }
  }finally{
    saveBtn.disabled = false;
  }
}

/* Xoá sản phẩm */
async function deleteProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  if(!confirm(`Xoá sản phẩm "${p.team} · ${p.season}"?\nẢnh của sản phẩm cũng sẽ bị xoá. Không thể hoàn tác.`)) return;
  setStatus("Đang xoá...","info");
  try{
    // xoá ảnh (không chặn nếu lỗi)
    for(const key of (p.images||[])){
      try{ const ip = `images/${id}-${key}.jpg`; const info = await ghGet(ip); if(info) await ghDelete(ip, `Xoá ${ip}`, info.sha); }catch(e){}
    }
    PRODUCTS = PRODUCTS.filter(x=>x.id!==id);
    await saveProductsJson(`Xoá ${id}`);
    setStatus("Đã xoá.","ok");
    renderList();
  }catch(err){ setStatus(err.message,"err"); }
}

/* ---------- Khởi động ---------- */
async function enterDashboard(){
  hide("login-screen");
  show("dash-screen");
  document.getElementById("logout-btn").style.display = "inline-block";
  setStatus("Đang tải sản phẩm...","info");
  try{
    await loadProductsAdmin();
    renderList();
    setStatus("");
  }catch(err){ setStatus(err.message,"err"); }
}

function initForm(){
  fillSelect(document.forms["prod-form"].loai, OPT.loai);
  fillSelect(document.forms["prod-form"].category, OPT.category);
  fillSelect(document.forms["prod-form"].kit, OPT.kit);
  fillSelect(document.forms["prod-form"].version, OPT.version);
  document.getElementById("special-boxes").innerHTML = OPT.special.map(([v,l])=>
    `<label class="cbox"><input type="checkbox" name="special" value="${v}"> ${l}</label>`
  ).join("");
  document.forms["prod-form"].addEventListener("submit", submitForm);
  document.getElementById("cancel-btn").addEventListener("click", closeForm);
  document.getElementById("add-btn").addEventListener("click", ()=>openForm(null));

  // chọn ảnh -> lưu tạm + xem trước
  document.getElementById("in-front").addEventListener("change", e => {
    pendingFront = e.target.files[0] || null; renderImagePreviews();
  });
  document.getElementById("in-back").addEventListener("change", e => {
    pendingBack = e.target.files[0] || null; renderImagePreviews();
  });
  document.getElementById("in-detail").addEventListener("change", e => {
    pendingDetails.push(...e.target.files); e.target.value = ""; renderImagePreviews();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initForm();

  document.getElementById("login-btn").addEventListener("click", async () => {
    const token = document.getElementById("token-input").value.trim();
    if(!token){ setStatus("Chưa dán token.","err"); return; }
    setStatus("Đang đăng nhập...","info");
    try{ await tryLogin(token); await enterDashboard(); }
    catch(err){ tok.clear(); setStatus(err.message,"err"); }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    tok.clear(); location.reload();
  });

  // đã có token trong phiên -> vào thẳng
  if(tok.get()){
    tryLogin(tok.get()).then(enterDashboard).catch(()=>{ tok.clear(); });
  }
});
