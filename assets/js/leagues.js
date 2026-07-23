/* =========================================================
   PHÂN NHÓM ĐỘI BÓNG
   - CLB  -> theo giải đấu (Ngoại hạng Anh, La Liga, Serie A, ...)
   - Đội tuyển -> theo châu lục
   Tự nhận diện từ TÊN ĐỘI nên không cần sửa lại sản phẩm cũ.
   ========================================================= */

/* Bỏ dấu + bỏ các tiền/hậu tố hay gặp để so khớp tên đội */
function teamKey(name){
  return (name || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/\b(fc|cf|sc|ac|as|ss|sl|scp|afc|cd|rc|club|calcio|футбол)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/* Nhãn nhóm — song ngữ */
const GROUP_LABELS = {
  "epl":        { vi: "Ngoại hạng Anh",   en: "Premier League" },
  "laliga":     { vi: "La Liga (TBN)",    en: "La Liga" },
  "seriea":     { vi: "Serie A (Ý)",      en: "Serie A" },
  "bundesliga": { vi: "Bundesliga (Đức)", en: "Bundesliga" },
  "ligue1":     { vi: "Ligue 1 (Pháp)",   en: "Ligue 1" },
  "portugal":   { vi: "Bồ Đào Nha",       en: "Primeira Liga" },
  "eredivisie": { vi: "Hà Lan",           en: "Eredivisie" },
  "khac-clb":   { vi: "CLB khác",         en: "Other clubs" },

  "chau-au":    { vi: "Châu Âu",          en: "Europe" },
  "nam-my":     { vi: "Nam Mỹ",           en: "South America" },
  "chau-a":     { vi: "Châu Á",           en: "Asia" },
  "chau-phi":   { vi: "Châu Phi",         en: "Africa" },
  "bac-my":     { vi: "Bắc & Trung Mỹ",   en: "North & Central America" },
  "khac-dt":    { vi: "Đội tuyển khác",   en: "Other nations" }
};

/* Thứ tự hiển thị các nhóm */
const GROUP_ORDER = ["epl","laliga","seriea","bundesliga","ligue1","portugal","eredivisie","khac-clb",
                     "chau-au","nam-my","chau-a","chau-phi","bac-my","khac-dt"];

/* CLB -> giải đấu */
const CLUB_LEAGUE = {};
(function(){
  const add = (league, names) => names.forEach(n => { CLUB_LEAGUE[teamKey(n)] = league; });
  add("epl", ["Manchester United","Manchester City","Liverpool","Chelsea","Arsenal","Tottenham Hotspur",
              "Newcastle United","Aston Villa","West Ham United","Everton","Leeds United","Nottingham Forest",
              "Brighton","Crystal Palace","Fulham","Wolverhampton","Brentford","Bournemouth","Leicester City",
              "Southampton","Sunderland"]);
  add("laliga", ["Real Madrid","Barcelona","Atletico Madrid","Atlético de Madrid","Sevilla","Valencia",
                 "Athletic Bilbao","Real Sociedad","Real Betis","Villarreal","Celta de Vigo","Girona","Espanyol"]);
  add("seriea", ["AC Milan","Inter Milan","Internazionale","Juventus","Napoli","AS Roma","Lazio","Fiorentina",
                 "Atalanta","Bologna","Torino","Parma","Udinese","Genoa","Sampdoria"]);
  add("bundesliga", ["Bayern Munich","Bayern München","Borussia Dortmund","Bayer Leverkusen","RB Leipzig",
                     "Schalke 04","Eintracht Frankfurt","Frankfurt","Werder Bremen","Hamburger SV","Koln","Köln",
                     "St Pauli","Stuttgart","Borussia Monchengladbach"]);
  add("ligue1", ["PSG","Paris Saint-Germain","Monaco","Olympique de Marseille","Marseille","Olympique Lyonnais",
                 "Lyon","Lille","AS Saint-Etienne","Nice","RC Lens","Nantes","Rennes","Paris FC","Auxerre"]);
  add("portugal", ["Benfica","FC Porto","Porto","Sporting CP","Sporting Lisbon","Braga","Vitoria SC","Alverca"]);
  add("eredivisie", ["Ajax","PSV Eindhoven","PSV","Feyenoord","AZ Alkmaar"]);
})();

/* Đội tuyển -> châu lục */
const NATION_REGION = {};
(function(){
  const add = (region, names) => names.forEach(n => { NATION_REGION[teamKey(n)] = region; });
  add("chau-au", ["Portugal","Spain","France","England","Germany","Italy","Netherlands","Belgium","Croatia",
                  "Turkey","Turkiye","Poland","Denmark","Sweden","Switzerland","Scotland","Serbia","Austria",
                  "Bo Dao Nha","Tay Ban Nha","Phap","Anh","Duc","Y","Ha Lan","Bi","Tho Nhi Ky"]);
  add("nam-my", ["Argentina","Brazil","Brasil","Uruguay","Colombia","Chile","Peru","Ecuador","Paraguay","Bolivia","Venezuela"]);
  add("chau-a", ["Japan","Korea","South Korea","Vietnam","Viet Nam","Saudi Arabia","Iran","Qatar","Australia",
                 "China","Thailand","Indonesia","Uzbekistan","Nhat Ban","Han Quoc","Trung Quoc","Thai Lan"]);
  add("chau-phi", ["Morocco","Senegal","Nigeria","Ghana","Cameroon","Egypt","Algeria","Tunisia","Ivory Coast",
                   "Cote d'Ivoire","Cape Verde","Cabo Verde","South Africa","Mali"]);
  add("bac-my", ["Mexico","USA","United States","Canada","Costa Rica","Jamaica","Honduras","Panama"]);
})();

/* Nhóm của 1 sản phẩm. Ưu tiên giá trị người dùng tự đặt (p.league) nếu có. */
function groupOf(p){
  if(p && p.league && GROUP_LABELS[p.league]) return p.league;
  const k = teamKey(p && p.team);
  if(p && p.category === "doi-tuyen") return NATION_REGION[k] || "khac-dt";
  if(CLUB_LEAGUE[k]) return CLUB_LEAGUE[k];
  if(NATION_REGION[k]) return NATION_REGION[k];   // retro của đội tuyển
  return "khac-clb";
}

function groupLabel(key){
  const g = GROUP_LABELS[key];
  if(!g) return key;
  return (typeof getLang === "function" && getLang() === "en") ? g.en : g.vi;
}

/* Gom danh sách sản phẩm thành [{key, label, teams:[...]}] theo thứ tự đẹp */
function groupTeams(products){
  const map = {};
  products.forEach(p => {
    if(!p.team) return;
    const g = groupOf(p);
    (map[g] = map[g] || new Set()).add(p.team);
  });
  return GROUP_ORDER.filter(k => map[k])
    .map(k => ({ key:k, label:groupLabel(k), teams:[...map[k]].sort((a,b)=>a.localeCompare(b,"vi")) }));
}
