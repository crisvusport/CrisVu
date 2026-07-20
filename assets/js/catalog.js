/* ==========================================================
   CRIS VŨ — catalog.js  (chỉ dùng cho trang catalog.html)
   Load sau i18n.js và app.js
   ========================================================== */

/* Danh sách lựa chọn cố định cho bộ lọc (luôn hiện đủ, không phụ thuộc dữ liệu) */
const FILTER_VALUES = {
  loai:    ["ao", "ao-khoac", "quan", "bo-quan-ao", "bo-tre-em"],
  kit:     ["home", "away", "third", "ao-tap"],
  version: ["fan", "player", "ao-gio", "ao-ni"],
  special: ["retro", "dai-tay", "crop-top", "special-edition"]
};

const STATE = {
  category: "all",   // all | clb | doi-tuyen | retro (tab đơn)
  team: [],          // nhiều đội cùng lúc
  q: "",
  loai: [],          // nhiều lựa chọn
  kit: [],
  version: [],
  special: [],
  season: null
};

/* Bỏ dấu tiếng Việt để tìm kiếm dễ (gõ "dai tay" ra "Dài tay") */
function noAccent(s){
  return (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function matchProduct(p){
  if(STATE.category === "retro"){
    if(!(p.special||[]).includes("retro")) return false;
  } else if(STATE.category !== "all" && p.category !== STATE.category){
    return false;
  }
  if(STATE.team.length && !STATE.team.includes(p.team)) return false;
  if(STATE.loai.length && !STATE.loai.includes(p.loai)) return false;
  if(STATE.kit.length && !STATE.kit.includes(p.kit)) return false;
  if(STATE.version.length && !STATE.version.includes(p.version)) return false;
  if(STATE.special.length && !STATE.special.some(s => (p.special||[]).includes(s))) return false;
  if(STATE.season){
    if(!noAccent(p.season).includes(noAccent(STATE.season))) return false;
  }
  if(STATE.q){
    const terms = noAccent(STATE.q).split(/\s+/).filter(Boolean);
    const hay = searchHaystack(p);
    if(!terms.every(term => hay.includes(term))) return false;
  }
  return true;
}

/* Gom TẤT CẢ chữ có thể tìm của 1 sản phẩm: đội, mùa, và nhãn loại/mẫu áo/phiên bản/kiểu đặc biệt
   — cả tiếng Việt (có dấu & không dấu) lẫn tiếng Anh — để người Việt gõ kiểu gì cũng ra. */
function searchHaystack(p){
  const bits = [p.team, p.season, p.loai, p.kit, p.version];
  (p.special || []).forEach(s => bits.push(s));
  const addLabel = (kind, val) => {
    if(!val) return;
    const k = kind + "." + val;
    if(I18N.vi && I18N.vi[k]) bits.push(I18N.vi[k]);
    if(I18N.en && I18N.en[k]) bits.push(I18N.en[k]);
  };
  addLabel("loai", p.loai);
  addLabel("kit", p.kit);
  addLabel("version", p.version);
  (p.special || []).forEach(s => addLabel("special", s));
  return noAccent(bits.filter(Boolean).join(" "));
}

function renderCatalog(){
  const grid = document.getElementById("grid");
  const items = PRODUCTS.filter(matchProduct);
  const countEl = document.getElementById("result-count");
  if(countEl) countEl.textContent = items.length + " " + t("filter.results");

  if(items.length === 0){
    grid.innerHTML = `<div class="empty">${t("filter.none")}</div>`;
    return;
  }
  grid.innerHTML = items.map(cardHTML).join("");
  bindCards(grid);
}

/* Sổ ra danh sách đội bóng theo danh mục đang chọn */
function renderTeamRow(){
  const row = document.getElementById("team-row");
  if(!row) return;
  if(STATE.category === "all"){ row.innerHTML = ""; row.classList.remove("show"); return; }
  const pool = STATE.category === "retro"
    ? PRODUCTS.filter(p => (p.special||[]).includes("retro"))
    : PRODUCTS.filter(p => p.category === STATE.category);
  const teams = [...new Set(pool.map(p => p.team))].sort();
  if(teams.length === 0){ row.innerHTML = ""; row.classList.remove("show"); return; }
  row.classList.add("show");
  row.innerHTML = teams.map(tm =>
    `<button class="team-chip ${STATE.team.includes(tm)?'active':''}" data-team="${tm}">${tm}</button>`
  ).join("");
  row.querySelectorAll(".team-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const tm = btn.dataset.team;
      const i = STATE.team.indexOf(tm);
      if(i>=0){ STATE.team.splice(i,1); btn.classList.remove("active"); }
      else { STATE.team.push(tm); btn.classList.add("active"); }
      renderCatalog();
    });
  });
}

/* Xây các nút lọc — danh sách cố định, cho phép chọn nhiều */
function buildFilters(){
  fillFilterGroup("f-loai", FILTER_VALUES.loai, "loai", "loai");
  fillFilterGroup("f-kit", FILTER_VALUES.kit, "kit", "kit");
  fillFilterGroup("f-version", FILTER_VALUES.version, "version", "version");
  fillFilterGroup("f-special", FILTER_VALUES.special, "special", "special");
  buildSeasonSelect();
}

/* Mùa giải: ô gõ tìm + dropdown gợi ý bấm chọn — hoạt động tốt cả điện thoại */
function buildSeasonSelect(){
  const input = document.getElementById("f-season-input");
  const menu = document.getElementById("season-menu");
  if(!input || !menu) return;
  const seasons = [...new Set(PRODUCTS.map(p => p.season).filter(Boolean))].sort().reverse();
  input.value = STATE.season || "";

  function renderMenu(filter){
    const f = noAccent(filter || "");
    const list = seasons.filter(s => !f || noAccent(s).includes(f));
    let html = `<div class="season-item" data-val="">Tất cả mùa</div>`;
    html += list.map(s => `<div class="season-item" data-val="${s}">${s}</div>`).join("");
    if(!list.length && f) html += `<div class="season-item is-hint">Không có mùa này — vẫn lọc theo "${filter}"</div>`;
    menu.innerHTML = html;
  }
  const open = () => { renderMenu(input.value); menu.classList.add("open"); };
  const close = () => menu.classList.remove("open");

  input.addEventListener("focus", open);
  input.addEventListener("input", () => {
    STATE.season = input.value.trim() || null;
    renderMenu(input.value); menu.classList.add("open");
    updateFilterCount(); renderCatalog();
  });
  input.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); close(); } });
  menu.addEventListener("click", e => {
    const item = e.target.closest(".season-item");
    if(!item || item.classList.contains("is-hint")) return;
    const val = item.dataset.val;
    input.value = val;
    STATE.season = val || null;
    close(); updateFilterCount(); renderCatalog();
  });
  if(!buildSeasonSelect._bound){
    document.addEventListener("click", e => { if(!e.target.closest(".season-box")) close(); });
    buildSeasonSelect._bound = true;
  }
}

function fillFilterGroup(containerId, values, stateKey, i18nPrefix){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = values.map(v => {
    const label = i18nPrefix ? t(i18nPrefix + "." + v) : v;
    const active = STATE[stateKey].includes(v) ? " active" : "";
    return `<button class="fopt${active}" data-key="${stateKey}" data-val="${v}">${label}</button>`;
  }).join("");
  el.querySelectorAll(".fopt").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const val = btn.dataset.val;
      const arr = STATE[stateKey];
      const i = arr.indexOf(val);
      if(i>=0){ arr.splice(i,1); btn.classList.remove("active"); }
      else { arr.push(val); btn.classList.add("active"); }
      updateFilterCount();
      renderCatalog();
    });
  });
}

function activeFilterCount(){
  return STATE.loai.length + STATE.kit.length + STATE.version.length
       + STATE.special.length + (STATE.season ? 1 : 0);
}
function updateFilterCount(){
  const n = activeFilterCount();
  const badge = document.getElementById("filter-count");
  if(badge){ badge.textContent = n; badge.style.display = n? "inline-block":"none"; }
}

function clearFilters(){
  STATE.loai = []; STATE.kit = []; STATE.version = []; STATE.special = []; STATE.season = null;
  document.querySelectorAll(".fopt").forEach(b=>b.classList.remove("active"));
  const inp = document.getElementById("f-season-input");
  if(inp) inp.value = "";
  updateFilterCount();
  renderCatalog();
}

function initCatalog(){
  // tabs danh mục
  const params = new URLSearchParams(location.search);
  if(params.get("cat")) STATE.category = params.get("cat");

  document.querySelectorAll(".tab").forEach(tab=>{
    if(tab.dataset.cat === STATE.category) tab.classList.add("active"); else tab.classList.remove("active");
    tab.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      STATE.category = tab.dataset.cat;
      STATE.team = [];            // đổi danh mục thì bỏ chọn đội cũ
      renderTeamRow();
      renderCatalog();
    });
  });

  // ô tìm kiếm
  const search = document.getElementById("search-input");
  if(search){
    search.addEventListener("input", ()=>{ STATE.q = search.value.trim(); renderCatalog(); });
  }

  // bật/tắt bảng lọc
  const ft = document.getElementById("filter-toggle");
  const panel = document.getElementById("filters");
  if(ft && panel) ft.addEventListener("click", ()=> panel.classList.toggle("open"));

  const clr = document.getElementById("clear-filters");
  if(clr) clr.addEventListener("click", clearFilters);

  buildFilters();
  renderTeamRow();
  updateFilterCount();
  renderCatalog();
}
