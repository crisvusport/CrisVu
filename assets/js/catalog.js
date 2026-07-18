/* ==========================================================
   CRIS VŨ — catalog.js  (chỉ dùng cho trang catalog.html)
   Load sau i18n.js và app.js
   ========================================================== */

const STATE = {
  category: "all",   // all | clb | doi-tuyen | retro
  team: null,        // đội bóng cụ thể (sổ ra khi chọn danh mục)
  q: "",
  loai: null,
  kit: null,
  version: null,
  special: null,
  season: null
};

function matchProduct(p){
  if(STATE.category !== "all" && p.category !== STATE.category) return false;
  if(STATE.team && p.team !== STATE.team) return false;
  if(STATE.loai && p.loai !== STATE.loai) return false;
  if(STATE.kit && p.kit !== STATE.kit) return false;
  if(STATE.version && p.version !== STATE.version) return false;
  if(STATE.season){
    if(!String(p.season).toLowerCase().includes(STATE.season.toLowerCase())) return false;
  }
  if(STATE.special && !(p.special||[]).includes(STATE.special)) return false;
  if(STATE.q){
    const hay = (p.team + " " + p.season + " " + productName(p)).toLowerCase();
    if(!hay.includes(STATE.q.toLowerCase())) return false;
  }
  return true;
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
  const teams = [...new Set(PRODUCTS.filter(p => p.category === STATE.category).map(p => p.team))].sort();
  if(teams.length === 0){ row.innerHTML = ""; row.classList.remove("show"); return; }
  row.classList.add("show");
  row.innerHTML = teams.map(tm =>
    `<button class="team-chip ${STATE.team===tm?'active':''}" data-team="${tm}">${tm}</button>`
  ).join("");
  row.querySelectorAll(".team-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.team = (STATE.team === btn.dataset.team) ? null : btn.dataset.team;
      renderTeamRow();
      renderCatalog();
    });
  });
}

/* Xây các nút lọc động từ dữ liệu thực tế */
function buildFilters(){
  const uniq = (key) => [...new Set(PRODUCTS.map(p=>p[key]).filter(Boolean))];
  const uniqSpecial = [...new Set(PRODUCTS.flatMap(p=>p.special||[]))];

  fillFilterGroup("f-loai", uniq("loai"), "loai", "loai");
  fillFilterGroup("f-kit", uniq("kit"), "kit", "kit");
  fillFilterGroup("f-version", uniq("version"), "version", "version");
  fillFilterGroup("f-special", uniqSpecial, "special", "special");
  buildSeasonSelect();
}

/* Mùa giải: ô gõ tìm + gợi ý (gõ "2025" gợi ý "2025/26") — bao nhiêu mùa cũng gọn */
function buildSeasonSelect(){
  const input = document.getElementById("f-season-input");
  const dl = document.getElementById("season-list");
  if(!input || !dl) return;
  const seasons = [...new Set(PRODUCTS.map(p=>p.season).filter(Boolean))].sort().reverse();
  dl.innerHTML = seasons.map(s => `<option value="${s}"></option>`).join("");
  input.value = STATE.season || "";
  input.oninput = () => {
    STATE.season = input.value.trim() || null;
    updateFilterCount();
    renderCatalog();
  };
}

function fillFilterGroup(containerId, values, stateKey, i18nPrefix){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = values.map(v => {
    const label = i18nPrefix ? t(i18nPrefix + "." + v) : v;
    return `<button class="fopt" data-key="${stateKey}" data-val="${v}">${label}</button>`;
  }).join("");
  el.querySelectorAll(".fopt").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const val = btn.dataset.val;
      if(STATE[stateKey] === val){ STATE[stateKey] = null; btn.classList.remove("active"); }
      else{
        el.querySelectorAll(".fopt").forEach(b=>b.classList.remove("active"));
        STATE[stateKey] = val; btn.classList.add("active");
      }
      updateFilterCount();
      renderCatalog();
    });
  });
}

function activeFilterCount(){
  return ["loai","kit","version","special","season"].filter(k=>STATE[k]).length;
}
function updateFilterCount(){
  const n = activeFilterCount();
  const badge = document.getElementById("filter-count");
  if(badge){ badge.textContent = n; badge.style.display = n? "inline-block":"none"; }
}

function clearFilters(){
  ["loai","kit","version","special","season"].forEach(k=>STATE[k]=null);
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
      STATE.team = null;          // đổi danh mục thì bỏ chọn đội cũ
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
