/**
 * 历史批量模板生成器（已废弃覆盖能力）。
 * 当前 apps/* 为按场景手工定制的落地页，默认禁止覆盖。
 * 仅导出 APP_PLATFORM_BY_SLUG 供对齐数据库形态。
 * 若确需强制重写模板壳：node scripts/generate-real-apps.mjs --force
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_ROOT = path.join(__dirname, "..", "apps");
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

/** slug -> 应用形态，供 DB / seed 对齐 */
export const APP_PLATFORM_BY_SLUG = {
  "shitang-pintuan": "h5",
  "shushi-radar": "pc",
  landa: "h5",
  "zhaoling-radar": "h5",
  fandazi: "h5",
  bensha: "h5",
  liuchong: "h5",
  "jiuwu-juanzeng": "pc",
  "zhiyuan-shichang": "h5",
  "liulang-zhuyang": "pc",
  "sijiao-pinda": "h5",
  reliang: "h5",
  paoxian: "pc",
  tubo: "pc",
  "luying-zhuangbei": "pc",
  qixing: "pc",
};

function shell({
  title,
  accent,
  accent2,
  heroBg,
  emoji,
  tagline,
  tabs,
  body,
  script,
  platform = "h5",
}) {
  const isPc = platform === "pc";
  const navHtml = isPc
    ? `<nav class="top-nav">${tabs
        .map(
          (t, i) =>
            `<button type="button" data-nav="${t.id}" class="${i === 0 ? "active" : ""}">${t.icon} ${t.label}</button>`,
        )
        .join("")}</nav>`
    : "";
  const bottomNav = isPc
    ? ""
    : `<nav class="nav">${tabs
        .map(
          (t, i) =>
            `<button type="button" data-nav="${t.id}" class="${i === 0 ? "active" : ""}">${t.icon}<br>${t.label}</button>`,
        )
        .join("")}</nav>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${title}</title>
<style>
:root{
  --accent:${accent};--accent2:${accent2};--ink:#1d1d1f;--muted:#6e6e73;--line:rgba(0,0,0,.07);
  --card:#fff;--bg:#f5f5f7;--radius:16px;--shadow:0 8px 28px rgba(0,0,0,.08);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif;background:${isPc ? "#eef0f4" : "#e8e8ed"};color:var(--ink);display:flex;justify-content:center;font-size:15px;line-height:1.5;${isPc ? "padding:20px 16px 40px;" : ""}}
#app{width:100%;max-width:${isPc ? "1100px" : "430px"};min-height:${isPc ? "calc(100vh - 60px)" : "100vh"};background:linear-gradient(180deg,${heroBg} 0%,#f5f5f7 ${isPc ? "220px" : "280px"});display:flex;flex-direction:column;position:relative;${isPc ? "border-radius:20px;box-shadow:0 16px 50px rgba(20,24,40,.08);overflow:hidden;border:1px solid rgba(0,0,0,.04);" : ""}}
header{position:sticky;top:0;z-index:40;padding:${isPc ? "16px 24px" : "14px 16px 10px"};background:rgba(255,255,255,.78);backdrop-filter:saturate(180%) blur(18px);border-bottom:1px solid var(--line);${isPc ? "display:flex;align-items:center;justify-content:space-between;gap:16px;" : ""}}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:17px;box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 40%,transparent)}
.brand h1{font-size:${isPc ? "18px" : "17px"};font-weight:750;letter-spacing:-.2px}
.brand p{font-size:11px;color:var(--muted);margin-top:1px}
.platform-tag{font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--accent);flex:none}
.top-nav{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.top-nav button{border:none;background:rgba(0,0,0,.05);color:var(--muted);padding:8px 14px;border-radius:999px;font-size:13px;font-weight:650;cursor:pointer}
.top-nav button.active{background:var(--accent);color:#fff}
main{flex:1;padding:${isPc ? "20px 24px 28px" : "14px 14px 96px"};overflow:auto}
.hero{border-radius:18px;padding:${isPc ? "22px 24px" : "18px"};color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 10px 28px color-mix(in srgb,var(--accent) 35%,transparent);margin-bottom:14px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-30px;top:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.14)}
.hero h2{font-size:${isPc ? "24px" : "20px"};font-weight:800;position:relative}
.hero p{font-size:12.5px;opacity:.92;margin-top:4px;position:relative}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.stat{background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:14px;padding:12px 8px;text-align:center}
.stat b{display:block;font-size:18px;font-weight:800}
.stat span{font-size:11px;color:var(--muted)}
.tabs{display:flex;gap:6px;margin-bottom:12px;overflow:auto}
.tab{flex:0 0 auto;border:none;background:rgba(0,0,0,.05);color:var(--muted);padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer}
.tab.active{background:var(--accent);color:#fff}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:14px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.03)}
.card h3{font-size:15px;font-weight:700;margin-bottom:4px}
.meta{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}
.row{display:flex;gap:10px;align-items:flex-start}
.avatar{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;display:grid;place-items:center;font-weight:700;flex:none}
.btn{border:none;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:700;cursor:pointer;background:var(--accent);color:#fff}
.btn.ghost{background:rgba(0,0,0,.05);color:var(--ink)}
.btn.block{width:100%}
.btn:disabled{opacity:.5;cursor:not-allowed}
.actions{display:flex;gap:8px;margin-top:8px}
.chip{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--accent);font-size:11px;font-weight:650}
.field{margin-bottom:10px}
.field label{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}
.field input,.field select,.field textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;background:#fff}
.toast{position:fixed;left:50%;bottom:${isPc ? "32px" : "88px"};transform:translateX(-50%) translateY(20px);background:rgba(29,29,31,.92);color:#fff;padding:10px 14px;border-radius:12px;font-size:13px;opacity:0;pointer-events:none;transition:.25s;z-index:99;max-width:min(360px,90vw);text-align:center}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.nav{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:min(430px,100%);display:grid;grid-template-columns:repeat(${tabs.length},1fr);gap:4px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-top:1px solid var(--line)}
.nav button{border:none;background:transparent;padding:8px 4px;border-radius:12px;font-size:11px;color:var(--muted);cursor:pointer;font-weight:650}
.nav button.active{background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--accent)}
.view{display:none}.view.active{display:block}
.empty{text-align:center;color:var(--muted);padding:28px 12px;font-size:13px}
.progress{height:8px;background:rgba(0,0,0,.06);border-radius:99px;overflow:hidden;margin:8px 0}
.progress>i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:99px}
.list-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.list-item:last-child{border-bottom:none}
.check{width:22px;height:22px;border-radius:6px;border:2px solid var(--line);display:grid;place-items:center;flex:none;cursor:pointer}
.check.on{background:var(--accent);border-color:var(--accent);color:#fff;font-size:12px}
.card-grid{display:grid;grid-template-columns:1fr;gap:0}
${
  isPc
    ? `.card-grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.card-grid .card{margin-bottom:0;height:100%}
.pc-split{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;align-items:start}
@media (max-width:860px){.pc-split{grid-template-columns:1fr}header{flex-wrap:wrap}.top-nav{width:100%;justify-content:flex-start}}`
    : ""
}
</style>
</head>
<body>
<div id="app" class="${isPc ? "pc" : "h5"}" data-platform="${platform}">
  <header>
    <div class="brand">
      <div class="logo">${emoji}</div>
      <div>
        <h1>${title.split("·")[0].trim()}</h1>
        <p>${tagline}</p>
      </div>
      <span class="platform-tag">${isPc ? "PC" : "H5"}</span>
    </div>
    ${navHtml}
  </header>
  <main>${body}</main>
  ${bottomNav}
  <div class="toast" id="toast"></div>
</div>
<script>
${script}
(function(){
  const toastEl=document.getElementById('toast');
  window.toast=function(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(window.__tt);window.__tt=setTimeout(()=>toastEl.classList.remove('show'),1800)};
  document.querySelectorAll('[data-nav]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-nav]').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('[data-nav="'+btn.dataset.nav+'"]').forEach(b=>b.classList.add('active'));
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      const view=document.getElementById('view-'+btn.dataset.nav);
      if(view) view.classList.add('active');
    });
  });
})();
</script>
</body>
</html>`;
}

const APPS = [
  {
    slug: "shushi-radar",
    skip: false,
    build() {
      const books = [
        { id: 1, title: "深入理解计算机系统", author: "CSAPP", price: 68, campus: "东区图书馆", dist: "120m", cond: "九成新" },
        { id: 2, title: "高等数学·同济七版", author: "同济", price: 25, campus: "一食堂门口", dist: "260m", cond: "有笔记" },
        { id: 3, title: "JavaScript 高级程序设计", author: "红宝书", price: 45, campus: "计院楼下", dist: "480m", cond: "几乎全新" },
        { id: 4, title: "线性代数", author: "清华", price: 18, campus: "西区宿舍", dist: "700m", cond: "八成新" },
        { id: 5, title: "人类简史", author: "赫拉利", price: 32, campus: "南门书吧", dist: "1.1km", cond: "九成新" },
      ];
      return shell({
        platform: "pc",
        title: "书市雷达 · 校园二手书",
        accent: "#5C6BC0",
        accent2: "#3949AB",
        heroBg: "#eef0fb",
        emoji: "📚",
        tagline: "下课就能当面交易",
        tabs: [
          { id: "home", label: "附近", icon: "📍" },
          { id: "sell", label: "出书", icon: "➕" },
          { id: "mine", label: "我的", icon: "👤" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>附近可当面交易的书</h2><p>按距离排序 · 支持当面验书</p></div>
  <div class="stats"><div class="stat"><b>${books.length}</b><span>在售</span></div><div class="stat"><b>3</b><span>今日新挂</span></div><div class="stat"><b>12</b><span>本周成交</span></div></div>
  <div class="tabs" id="filters"><button class="tab active" data-f="all">全部</button><button class="tab" data-f="near">500m内</button><button class="tab" data-f="cheap">≤30元</button></div>
  <div class="card-grid" id="book-list"></div>
</div>
<div class="view" id="view-sell">
  <div class="card">
    <h3>挂出二手书</h3>
    <div class="field"><label>书名</label><input id="b-title" placeholder="例如：高等数学"></div>
    <div class="field"><label>价格（元）</label><input id="b-price" type="number" placeholder="25"></div>
    <div class="field"><label>交易地点</label><input id="b-place" placeholder="一食堂门口"></div>
    <button class="btn block" id="b-submit">发布到书市</button>
  </div>
</div>
<div class="view" id="view-mine">
  <div class="card"><h3>我的收藏 / 预约</h3><div id="mine-list" class="empty">还没有预约，去附近逛逛吧</div></div>
</div>`,
        script: `
const BOOKS=${JSON.stringify(books)};
let filter='all';
const reserved=JSON.parse(localStorage.getItem('shushi-reserved')||'[]');
function render(){
  const list=document.getElementById('book-list');
  const rows=BOOKS.filter(b=>{
    if(filter==='near') return parseFloat(b.dist)<500 || b.dist.includes('m') && !b.dist.includes('km') && parseFloat(b.dist)<=500;
    if(filter==='cheap') return b.price<=30;
    return true;
  }).filter(b=>{
    if(filter!=='near') return true;
    const n=parseFloat(b.dist); return b.dist.includes('km')?false:n<=500;
  });
  list.innerHTML=rows.map(b=>\`<div class="card"><div class="row"><div class="avatar">书</div><div style="flex:1"><h3>\${b.title}</h3><div class="meta"><span>\${b.author}</span><span>\${b.cond}</span><span>\${b.campus} · \${b.dist}</span></div><span class="chip">¥\${b.price}</span><div class="actions"><button class="btn" data-reserve="\${b.id}">预约当面看</button></div></div></div></div>\`).join('')||'<div class="empty">没有符合筛选的书</div>';
  renderMine();
}
function renderMine(){
  const el=document.getElementById('mine-list');
  const items=BOOKS.filter(b=>reserved.includes(b.id));
  el.innerHTML=items.length?items.map(b=>\`<div class="list-item"><div><b>\${b.title}</b><div class="meta">\${b.campus}</div></div><span class="chip">已预约</span></div>\`).join(''):'<div class="empty">还没有预约，去附近逛逛吧</div>';
}
document.getElementById('filters').addEventListener('click',e=>{
  const t=e.target.closest('[data-f]'); if(!t) return;
  filter=t.dataset.f; [...e.currentTarget.children].forEach(c=>c.classList.toggle('active',c===t)); render();
});
document.getElementById('book-list').addEventListener('click',e=>{
  const btn=e.target.closest('[data-reserve]'); if(!btn) return;
  const id=+btn.dataset.reserve; if(!reserved.includes(id)) reserved.push(id);
  localStorage.setItem('shushi-reserved',JSON.stringify(reserved));
  toast('已预约，卖家会收到提醒'); renderMine();
});
document.getElementById('b-submit').onclick=()=>{
  const title=document.getElementById('b-title').value.trim();
  const price=+document.getElementById('b-price').value||0;
  const place=document.getElementById('b-place').value.trim()||'校内';
  if(!title) return toast('请填写书名');
  BOOKS.unshift({id:Date.now(),title,author:'我发布的',price,campus:place,dist:'50m',cond:'自用'});
  toast('已挂出，附近同学可以看到');
  document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "landa",
    build() {
      const games = [
        { id: 1, court: "东区风雨球场", time: "今天 18:30", need: 3, total: 10, level: "娱乐局", joined: false },
        { id: 2, court: "西区室外场 3号", time: "明天 09:00", need: 2, total: 8, level: "半场对抗", joined: false },
        { id: 3, court: "体育馆 A 馆", time: "周六 15:00", need: 5, total: 12, level: "训练赛", joined: false },
        { id: 4, court: "南门社区球场", time: "周日 10:30", need: 1, total: 6, level: "轻松投篮", joined: false },
      ];
      return shell({
        platform: "h5",
        title: "篮搭一下 · 校园约球",
        accent: "#FF7043",
        accent2: "#F4511E",
        heroBg: "#fff1ec",
        emoji: "🏀",
        tagline: "约球凑人订场地",
        tabs: [
          { id: "home", label: "局", icon: "🏀" },
          { id: "create", label: "开局", icon: "➕" },
          { id: "mine", label: "我的", icon: "✅" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>今晚缺人？马上补位</h2><p>同校球友 · 一键加入</p></div>
  <div id="game-list"></div>
</div>
<div class="view" id="view-create">
  <div class="card">
    <h3>发起一场球</h3>
    <div class="field"><label>场地</label><input id="g-court" placeholder="东区风雨球场"></div>
    <div class="field"><label>时间</label><input id="g-time" placeholder="今天 19:00"></div>
    <div class="field"><label>还差几人</label><input id="g-need" type="number" value="4"></div>
    <button class="btn block" id="g-submit">发布约球</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我加入的局</h3><div id="mine-games"></div></div></div>`,
        script: `
let GAMES=${JSON.stringify(games)};
const joined=new Set(JSON.parse(localStorage.getItem('landa-joined')||'[]'));
function render(){
  document.getElementById('game-list').innerHTML=GAMES.map(g=>{
    const on=joined.has(g.id);
    return \`<div class="card"><h3>\${g.court}</h3><div class="meta"><span>\${g.time}</span><span>\${g.level}</span><span>缺 \${g.need} 人 / 共 \${g.total}</span></div><div class="progress"><i style="width:\${Math.round((1-g.need/g.total)*100)}%"></i></div><div class="actions"><button class="btn \${on?'ghost':''}" data-join="\${g.id}">\${on?'已加入':'加入此局'}</button></div></div>\`;
  }).join('');
  const mine=GAMES.filter(g=>joined.has(g.id));
  document.getElementById('mine-games').innerHTML=mine.length?mine.map(g=>\`<div class="list-item"><div><b>\${g.court}</b><div class="meta">\${g.time}</div></div><span class="chip">已报名</span></div>\`).join(''):'<div class="empty">还没加入任何局</div>';
}
document.getElementById('game-list').addEventListener('click',e=>{
  const btn=e.target.closest('[data-join]'); if(!btn) return;
  const id=+btn.dataset.join; const g=GAMES.find(x=>x.id===id); if(!g) return;
  if(joined.has(id)){toast('你已在局中');return;}
  joined.add(id); g.need=Math.max(0,g.need-1);
  localStorage.setItem('landa-joined',JSON.stringify([...joined]));
  toast('加入成功，球场见'); render();
});
document.getElementById('g-submit').onclick=()=>{
  const court=document.getElementById('g-court').value.trim()||'校园球场';
  const time=document.getElementById('g-time').value.trim()||'待定';
  const need=+document.getElementById('g-need').value||4;
  const id=Date.now();
  GAMES.unshift({id,court,time,need,total:need+2,level:'自建局'});
  joined.add(id); localStorage.setItem('landa-joined',JSON.stringify([...joined]));
  toast('约球已发布'); document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "zhaoling-radar",
    build() {
      const items = [
        { id: 1, type: "招领", name: "黑色空气荚", place: "三教 201", time: "今天 10:20", tip: "充电盒有贴纸" },
        { id: 2, type: "寻物", name: "一卡通", place: "一食堂", time: "昨天 18:00", tip: "卡套蓝色" },
        { id: 3, type: "招领", name: "银色保温杯", place: "图书馆二楼", time: "今天 14:10", tip: "杯身有刻字" },
        { id: 4, type: "寻物", name: "灰色双肩包", place: "体育馆", time: "前天", tip: "内有课本" },
        { id: 5, type: "招领", name: "钥匙串", place: "南门快递柜", time: "今天 09:00", tip: "带小熊挂件" },
      ];
      return shell({
        platform: "h5",
        title: "招领雷达 · 校园失物",
        accent: "#26A69A",
        accent2: "#00897B",
        heroBg: "#e8f7f5",
        emoji: "📡",
        tagline: "附近捡到的先看到",
        tabs: [
          { id: "home", label: "雷达", icon: "📡" },
          { id: "post", label: "发布", icon: "✍️" },
          { id: "mine", label: "跟进", icon: "🔔" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>校园失物招领雷达</h2><p>按地点聚合 · 附近优先</p></div>
  <div class="tabs" id="zl-f"><button class="tab active" data-f="全部">全部</button><button class="tab" data-f="招领">招领</button><button class="tab" data-f="寻物">寻物</button></div>
  <div id="zl-list"></div>
</div>
<div class="view" id="view-post">
  <div class="card">
    <h3>发布信息</h3>
    <div class="field"><label>类型</label><select id="zl-type"><option>招领</option><option>寻物</option></select></div>
    <div class="field"><label>物品</label><input id="zl-name" placeholder="黑色雨伞"></div>
    <div class="field"><label>地点</label><input id="zl-place" placeholder="二教门口"></div>
    <div class="field"><label>备注</label><textarea id="zl-tip" rows="2" placeholder="特征描述"></textarea></div>
    <button class="btn block" id="zl-submit">发布到雷达</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我跟进的线索</h3><div id="zl-mine"></div></div></div>`,
        script: `
let ITEMS=${JSON.stringify(items)};
let f='全部';
const follow=new Set(JSON.parse(localStorage.getItem('zl-follow')||'[]'));
function render(){
  const rows=ITEMS.filter(x=>f==='全部'||x.type===f);
  document.getElementById('zl-list').innerHTML=rows.map(x=>\`<div class="card"><div class="row"><div class="avatar">\${x.type==='招领'?'拾':'寻'}</div><div style="flex:1"><h3>\${x.name}</h3><div class="meta"><span class="chip">\${x.type}</span><span>\${x.place}</span><span>\${x.time}</span></div><p style="font-size:13px;color:var(--muted)">\${x.tip||''}</p><div class="actions"><button class="btn" data-follow="\${x.id}">\${follow.has(x.id)?'已跟进':'我要跟进'}</button></div></div></div></div>\`).join('');
  const mine=ITEMS.filter(x=>follow.has(x.id));
  document.getElementById('zl-mine').innerHTML=mine.length?mine.map(x=>\`<div class="list-item"><div><b>\${x.name}</b><div class="meta">\${x.place} · \${x.type}</div></div><span class="chip">跟进中</span></div>\`).join(''):'<div class="empty">暂无跟进</div>';
}
document.getElementById('zl-f').addEventListener('click',e=>{const t=e.target.closest('[data-f]');if(!t)return;f=t.dataset.f;[...e.currentTarget.children].forEach(c=>c.classList.toggle('active',c===t));render();});
document.getElementById('zl-list').addEventListener('click',e=>{const b=e.target.closest('[data-follow]');if(!b)return;follow.add(+b.dataset.follow);localStorage.setItem('zl-follow',JSON.stringify([...follow]));toast('已加入跟进');render();});
document.getElementById('zl-submit').onclick=()=>{
  const name=document.getElementById('zl-name').value.trim(); if(!name) return toast('请填写物品');
  ITEMS.unshift({id:Date.now(),type:document.getElementById('zl-type').value,name,place:document.getElementById('zl-place').value.trim()||'校内',time:'刚刚',tip:document.getElementById('zl-tip').value.trim()});
  toast('已发布到雷达'); document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "fandazi",
    build() {
      const people = [
        { id: 1, name: "小林", taste: "川菜 / 麻辣", dist: "0.8km", time: "周六中午", bio: "不吃香菜，可 AA" },
        { id: 2, name: "阿哲", taste: "日料 / 清淡", dist: "1.2km", time: "周六晚上", bio: "想试新店" },
        { id: 3, name: "Mia", taste: "火锅", dist: "2.0km", time: "周日中午", bio: "三人局刚好" },
        { id: 4, name: "老周", taste: "粤菜 / 茶点", dist: "1.5km", time: "周日下午", bio: "慢食聊天" },
      ];
      return shell({
        platform: "h5",
        title: "饭搭子计划 · 同城拼饭",
        accent: "#EC407A",
        accent2: "#D81B60",
        heroBg: "#fff0f5",
        emoji: "🍜",
        tagline: "按口味与距离匹配",
        tabs: [
          { id: "home", label: "匹配", icon: "✨" },
          { id: "pref", label: "口味", icon: "🌶️" },
          { id: "mine", label: "局", icon: "📅" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>周末一起吃饭？</h2><p>已按你的口味排序</p></div>
  <div id="fd-list"></div>
</div>
<div class="view" id="view-pref">
  <div class="card">
    <h3>我的口味偏好</h3>
    <div class="field"><label>喜欢的菜系</label><input id="fd-taste" placeholder="火锅、川菜、日料"></div>
    <div class="field"><label>可出行距离</label><select id="fd-dist"><option>3km 内</option><option>5km 内</option><option>不限</option></select></div>
    <button class="btn block" id="fd-save">保存偏好</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>已约饭局</h3><div id="fd-mine"></div></div></div>`,
        script: `
const PEOPLE=${JSON.stringify(people)};
const matched=new Set(JSON.parse(localStorage.getItem('fd-matched')||'[]'));
function render(){
  document.getElementById('fd-list').innerHTML=PEOPLE.map(p=>\`<div class="card"><div class="row"><div class="avatar">\${p.name[0]}</div><div style="flex:1"><h3>\${p.name}</h3><div class="meta"><span>\${p.taste}</span><span>\${p.dist}</span><span>\${p.time}</span></div><p style="font-size:13px;color:var(--muted)">\${p.bio}</p><div class="actions"><button class="btn" data-m="\${p.id}">\${matched.has(p.id)?'已匹配':'邀约拼饭'}</button></div></div></div></div>\`).join('');
  const mine=PEOPLE.filter(p=>matched.has(p.id));
  document.getElementById('fd-mine').innerHTML=mine.length?mine.map(p=>\`<div class="list-item"><div><b>与 \${p.name}</b><div class="meta">\${p.time} · \${p.taste}</div></div><span class="chip">待确认</span></div>\`).join(''):'<div class="empty">还没有约饭</div>';
}
document.getElementById('fd-list').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;matched.add(+b.dataset.m);localStorage.setItem('fd-matched',JSON.stringify([...matched]));toast('邀约已发送');render();});
document.getElementById('fd-save').onclick=()=>{localStorage.setItem('fd-pref',JSON.stringify({taste:document.getElementById('fd-taste').value,dist:document.getElementById('fd-dist').value}));toast('偏好已保存，匹配更准了');};
const pref=JSON.parse(localStorage.getItem('fd-pref')||'{}');
if(pref.taste) document.getElementById('fd-taste').value=pref.taste;
render();`,
      });
    },
  },
  {
    slug: "bensha",
    build() {
      const rooms = [
        { id: 1, title: "《孤岛惊魂》本", type: "剧本杀", need: 2, total: 6, place: "万象城剧本馆", time: "今晚 19:30" },
        { id: 2, title: "狼人杀进阶局", type: "狼人杀", need: 3, total: 12, place: "线上语音", time: "今晚 21:00" },
        { id: 3, title: "欢乐本《同学录》", type: "剧本杀", need: 1, total: 5, place: "大学城店", time: "周六 14:00" },
        { id: 4, title: "新手友好狼局", type: "狼人杀", need: 4, total: 9, place: "咖啡厅包间", time: "周日 15:00" },
      ];
      return shell({
        platform: "h5",
        title: "本杀开黑台 · 组局",
        accent: "#7E57C2",
        accent2: "#5E35B1",
        heroBg: "#f3eefc",
        emoji: "🎭",
        tagline: "缺人就来补",
        tabs: [
          { id: "home", label: "大厅", icon: "🎲" },
          { id: "create", label: "开黑", icon: "➕" },
          { id: "mine", label: "我的", icon: "🎫" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>今晚开黑大厅</h2><p>剧本杀 / 狼人杀一键补位</p></div>
  <div class="tabs" id="bs-f"><button class="tab active" data-f="全部">全部</button><button class="tab" data-f="剧本杀">剧本杀</button><button class="tab" data-f="狼人杀">狼人杀</button></div>
  <div id="bs-list"></div>
</div>
<div class="view" id="view-create">
  <div class="card">
    <h3>发起组局</h3>
    <div class="field"><label>类型</label><select id="bs-type"><option>剧本杀</option><option>狼人杀</option></select></div>
    <div class="field"><label>标题</label><input id="bs-title" placeholder="本子名或局名"></div>
    <div class="field"><label>地点</label><input id="bs-place" placeholder="门店 / 线上"></div>
    <div class="field"><label>缺几人</label><input id="bs-need" type="number" value="2"></div>
    <button class="btn block" id="bs-submit">发布组局</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我报名的局</h3><div id="bs-mine"></div></div></div>`,
        script: `
let ROOMS=${JSON.stringify(rooms)}; let f='全部';
const joined=new Set(JSON.parse(localStorage.getItem('bs-joined')||'[]'));
function render(){
  const rows=ROOMS.filter(r=>f==='全部'||r.type===f);
  document.getElementById('bs-list').innerHTML=rows.map(r=>\`<div class="card"><h3>\${r.title}</h3><div class="meta"><span class="chip">\${r.type}</span><span>\${r.place}</span><span>\${r.time}</span><span>缺\${r.need}/\${r.total}</span></div><div class="progress"><i style="width:\${Math.round((1-r.need/r.total)*100)}%"></i></div><div class="actions"><button class="btn" data-j="\${r.id}">\${joined.has(r.id)?'已报名':'补位加入'}</button></div></div>\`).join('');
  const mine=ROOMS.filter(r=>joined.has(r.id));
  document.getElementById('bs-mine').innerHTML=mine.length?mine.map(r=>\`<div class="list-item"><div><b>\${r.title}</b><div class="meta">\${r.time}</div></div><span class="chip">已报名</span></div>\`).join(''):'<div class="empty">暂无报名</div>';
}
document.getElementById('bs-f').addEventListener('click',e=>{const t=e.target.closest('[data-f]');if(!t)return;f=t.dataset.f;[...e.currentTarget.children].forEach(c=>c.classList.toggle('active',c===t));render();});
document.getElementById('bs-list').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;const id=+b.dataset.j;const r=ROOMS.find(x=>x.id===id);if(!r||joined.has(id))return;joined.add(id);r.need=Math.max(0,r.need-1);localStorage.setItem('bs-joined',JSON.stringify([...joined]));toast('报名成功');render();});
document.getElementById('bs-submit').onclick=()=>{
  const title=document.getElementById('bs-title').value.trim(); if(!title) return toast('请填写标题');
  const id=Date.now(); const need=+document.getElementById('bs-need').value||2;
  ROOMS.unshift({id,title,type:document.getElementById('bs-type').value,need,total:need+3,place:document.getElementById('bs-place').value.trim()||'待定',time:'待定'});
  joined.add(id); localStorage.setItem('bs-joined',JSON.stringify([...joined]));
  toast('组局已发布'); document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "liuchong",
    build() {
      const routes = [
        { id: 1, name: "滨江夜遛线", pets: "狗友好", km: "2.4km", people: 6, time: "今晚 19:30" },
        { id: 2, name: "公园草坪社交", pets: "猫狗都可", km: "1.1km", people: 4, time: "周六 09:00" },
        { id: 3, name: "城墙慢走圈", pets: "小型犬", km: "3.0km", people: 8, time: "周日 17:00" },
      ];
      const buddies = [
        { id: 11, name: "豆豆妈", pet: "柯基 · 豆豆", near: "0.6km" },
        { id: 12, name: "橘子", pet: "英短 · 橘子", near: "1.1km" },
        { id: 13, name: "大白主人", pet: "金毛 · 大白", near: "1.8km" },
      ];
      return shell({
        platform: "h5",
        title: "遛宠圈 · 同城搭子",
        accent: "#42A5F5",
        accent2: "#1E88E5",
        heroBg: "#eaf4ff",
        emoji: "🐾",
        tagline: "遛狗也能社交",
        tabs: [
          { id: "home", label: "路线", icon: "🗺️" },
          { id: "buddy", label: "搭子", icon: "🐶" },
          { id: "mine", label: "行程", icon: "📅" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>今日热门遛宠线</h2><p>路线 · 搭子 · 一起出发</p></div>
  <div id="lc-routes"></div>
</div>
<div class="view" id="view-buddy"><div id="lc-buddies"></div></div>
<div class="view" id="view-mine"><div class="card"><h3>我的遛宠行程</h3><div id="lc-mine"></div></div></div>`,
        script: `
const ROUTES=${JSON.stringify(routes)};
const BUDDIES=${JSON.stringify(buddies)};
const plan=new Set(JSON.parse(localStorage.getItem('lc-plan')||'[]'));
function render(){
  document.getElementById('lc-routes').innerHTML=ROUTES.map(r=>\`<div class="card"><h3>\${r.name}</h3><div class="meta"><span>\${r.pets}</span><span>\${r.km}</span><span>\${r.people}人已约</span><span>\${r.time}</span></div><div class="actions"><button class="btn" data-join="r-\${r.id}">\${plan.has('r-'+r.id)?'已加入':'加入路线'}</button></div></div>\`).join('');
  document.getElementById('lc-buddies').innerHTML=BUDDIES.map(b=>\`<div class="card"><div class="row"><div class="avatar">宠</div><div style="flex:1"><h3>\${b.name}</h3><div class="meta"><span>\${b.pet}</span><span>\${b.near}</span></div><div class="actions"><button class="btn" data-join="b-\${b.id}">\${plan.has('b-'+b.id)?'已约':'约一起遛'}</button></div></div></div></div>\`).join('');
  const mine=[...plan].map(k=>{
    if(k.startsWith('r-')){const r=ROUTES.find(x=>x.id===+k.slice(2));return r?\`<div class="list-item"><div><b>\${r.name}</b><div class="meta">\${r.time}</div></div><span class="chip">路线</span></div>\`:'';}
    const b=BUDDIES.find(x=>x.id===+k.slice(2));return b?\`<div class="list-item"><div><b>与 \${b.name}</b><div class="meta">\${b.pet}</div></div><span class="chip">搭子</span></div>\`:'';
  }).join('');
  document.getElementById('lc-mine').innerHTML=mine||'<div class="empty">还没有行程</div>';
}
document.body.addEventListener('click',e=>{const b=e.target.closest('[data-join]');if(!b)return;plan.add(b.dataset.join);localStorage.setItem('lc-plan',JSON.stringify([...plan]));toast('已加入行程');render();});
render();`,
      });
    },
  },
  {
    slug: "jiuwu-juanzeng",
    build() {
      const points = [
        { id: 1, name: "社区旧物驿站", type: "衣物/书籍", dist: "420m", open: "09:00-18:00", door: false },
        { id: 2, name: "绿色回收车 · 东站", type: "家电/家具", dist: "1.2km", open: "预约上门", door: true },
        { id: 3, name: "高校公益柜", type: "衣物", dist: "800m", open: "全天", door: false },
        { id: 4, name: "蓝鲸鱼上门回收", type: "综合", dist: "全市", open: "当日上门", door: true },
      ];
      return shell({
        platform: "pc",
        title: "旧物捐赠地图",
        accent: "#66BB6A",
        accent2: "#43A047",
        heroBg: "#eefaf0",
        emoji: "♻️",
        tagline: "捐赠点与上门回收",
        tabs: [
          { id: "home", label: "地图", icon: "📍" },
          { id: "door", label: "上门", icon: "🚚" },
          { id: "mine", label: "记录", icon: "📝" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>附近捐赠点</h2><p>一站查询 · 随手做好事</p></div>
  <div class="card-grid" id="jw-list"></div>
</div>
<div class="view" id="view-door">
  <div class="card">
    <h3>预约上门回收</h3>
    <div class="field"><label>物品类型</label><select id="jw-type"><option>衣物</option><option>书籍</option><option>家电</option><option>家具</option></select></div>
    <div class="field"><label>地址</label><input id="jw-addr" placeholder="小区门牌"></div>
    <div class="field"><label>期望时间</label><input id="jw-time" placeholder="明天上午"></div>
    <button class="btn block" id="jw-book">提交预约</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我的捐赠记录</h3><div id="jw-mine"></div></div></div>`,
        script: `
const POINTS=${JSON.stringify(points)};
const logs=JSON.parse(localStorage.getItem('jw-logs')||'[]');
function render(){
  document.getElementById('jw-list').innerHTML=POINTS.map(p=>\`<div class="card"><h3>\${p.name}</h3><div class="meta"><span class="chip">\${p.type}</span><span>\${p.dist}</span><span>\${p.open}</span>\${p.door?'<span>可上门</span>':''}</div><div class="actions"><button class="btn" data-go="\${p.id}">导航前往</button></div></div>\`).join('');
  document.getElementById('jw-mine').innerHTML=logs.length?logs.map(l=>\`<div class="list-item"><div><b>\${l.title}</b><div class="meta">\${l.time}</div></div><span class="chip">\${l.kind}</span></div>\`).join(''):'<div class="empty">暂无记录</div>';
}
document.getElementById('jw-list').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;const p=POINTS.find(x=>x.id===+b.dataset.go);logs.unshift({title:p.name,time:new Date().toLocaleString(),kind:'到店'});localStorage.setItem('jw-logs',JSON.stringify(logs));toast('已记录，打开地图导航（演示）');render();});
document.getElementById('jw-book').onclick=()=>{
  const addr=document.getElementById('jw-addr').value.trim(); if(!addr) return toast('请填写地址');
  logs.unshift({title:document.getElementById('jw-type').value+' · '+addr,time:document.getElementById('jw-time').value||'待确认',kind:'上门'});
  localStorage.setItem('jw-logs',JSON.stringify(logs)); toast('上门预约已提交'); document.querySelector('[data-nav="mine"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "zhiyuan-shichang",
    build() {
      return shell({
        platform: "h5",
        title: "志愿时长本",
        accent: "#26A69A",
        accent2: "#00897B",
        heroBg: "#e7f7f5",
        emoji: "⏱️",
        tagline: "签到与时长自动记账",
        tabs: [
          { id: "home", label: "本子", icon: "📒" },
          { id: "check", label: "签到", icon: "✅" },
          { id: "acts", label: "活动", icon: "🤝" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>我的志愿时长</h2><p id="zy-total">累计 0 小时</p></div>
  <div class="card"><h3>最近记录</h3><div id="zy-logs"></div></div>
</div>
<div class="view" id="view-check">
  <div class="card">
    <h3>活动签到</h3>
    <div class="field"><label>活动名称</label><input id="zy-name" placeholder="社区环保日"></div>
    <div class="field"><label>时长（小时）</label><input id="zy-hours" type="number" step="0.5" value="2"></div>
    <button class="btn block" id="zy-in">签到记账</button>
  </div>
</div>
<div class="view" id="view-acts">
  <div class="card"><h3>可报名活动</h3>
    <div class="list-item"><div><b>图书馆导览志愿</b><div class="meta">本周六 · 3h</div></div><button class="btn" data-act="图书馆导览志愿|3">报名</button></div>
    <div class="list-item"><div><b>流浪猫喂养</b><div class="meta">每日晚间 · 1h</div></div><button class="btn" data-act="流浪猫喂养|1">报名</button></div>
    <div class="list-item"><div><b>马拉松补给点</b><div class="meta">下周日 · 4h</div></div><button class="btn" data-act="马拉松补给点|4">报名</button></div>
  </div>
</div>`,
        script: `
const KEY='zy-hours-log';
let logs=JSON.parse(localStorage.getItem(KEY)||'[]');
function render(){
  const total=logs.reduce((s,l)=>s+(+l.hours||0),0);
  document.getElementById('zy-total').textContent='累计 '+total.toFixed(1)+' 小时';
  document.getElementById('zy-logs').innerHTML=logs.length?logs.map(l=>\`<div class="list-item"><div><b>\${l.name}</b><div class="meta">\${l.time}</div></div><span class="chip">+\${l.hours}h</span></div>\`).join(''):'<div class="empty">还没有记录，去签到吧</div>';
}
function add(name,hours){
  logs.unshift({name,hours:+hours,time:new Date().toLocaleString()});
  localStorage.setItem(KEY,JSON.stringify(logs)); toast('已记入时长本'); render();
}
document.getElementById('zy-in').onclick=()=>{const name=document.getElementById('zy-name').value.trim();if(!name)return toast('请填写活动');add(name,document.getElementById('zy-hours').value);document.querySelector('[data-nav="home"]').click();};
document.getElementById('view-acts').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const [n,h]=b.dataset.act.split('|');add(n+'（报名）',h);});
render();`,
      });
    },
  },
  {
    slug: "liulang-zhuyang",
    build() {
      const animals = [
        { id: 1, name: "小橘", kind: "猫", status: "待助养", place: "城东小区", note: "已绝育，亲人" },
        { id: 2, name: "黑豆", kind: "狗", status: "临时寄养", place: "爱心驿站", note: "幼犬，需驱虫" },
        { id: 3, name: "芝麻", kind: "猫", status: "寻永久", place: "高校周边", note: "疫苗已打" },
        { id: 4, name: "阿黄", kind: "狗", status: "待助养", place: "郊外救助点", note: "大型犬" },
      ];
      return shell({
        platform: "pc",
        title: "流浪助养台",
        accent: "#FFA726",
        accent2: "#FB8C00",
        heroBg: "#fff6e9",
        emoji: "🏠",
        tagline: "救助与临时寄养对接",
        tabs: [
          { id: "home", label: "待助养", icon: "🐱" },
          { id: "help", label: "我能帮", icon: "💛" },
          { id: "mine", label: "对接", icon: "📋" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>等待温暖的它们</h2><p>助养 · 寄养 · 对接救助</p></div>
  <div class="card-grid" id="ll-list"></div>
</div>
<div class="view" id="view-help">
  <div class="card">
    <h3>我可以提供</h3>
    <div class="field"><label>能力</label><select id="ll-cap"><option>临时寄养</option><option>接送就医</option><option>物资捐赠</option><option>长期领养咨询</option></select></div>
    <div class="field"><label>说明</label><textarea id="ll-note" rows="2" placeholder="可寄养天数、地址范围等"></textarea></div>
    <button class="btn block" id="ll-offer">提交意愿</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我对接通的</h3><div id="ll-mine"></div></div></div>`,
        script: `
const ANIMALS=${JSON.stringify(animals)};
const linked=new Set(JSON.parse(localStorage.getItem('ll-linked')||'[]'));
const offers=JSON.parse(localStorage.getItem('ll-offers')||'[]');
function render(){
  document.getElementById('ll-list').innerHTML=ANIMALS.map(a=>\`<div class="card"><div class="row"><div class="avatar">\${a.kind[0]}</div><div style="flex:1"><h3>\${a.name} · \${a.kind}</h3><div class="meta"><span class="chip">\${a.status}</span><span>\${a.place}</span></div><p style="font-size:13px;color:var(--muted)">\${a.note}</p><div class="actions"><button class="btn" data-link="\${a.id}">\${linked.has(a.id)?'已对接':'申请助养'}</button></div></div></div></div>\`).join('');
  const mine=[...ANIMALS.filter(a=>linked.has(a.id)).map(a=>\`<div class="list-item"><div><b>\${a.name}</b><div class="meta">\${a.status}</div></div><span class="chip">助养</span></div>\`),...offers.map(o=>\`<div class="list-item"><div><b>\${o.cap}</b><div class="meta">\${o.note||'已提交意愿'}</div></div><span class="chip">支持</span></div>\`)].join('');
  document.getElementById('ll-mine').innerHTML=mine||'<div class="empty">还没有对接</div>';
}
document.getElementById('ll-list').addEventListener('click',e=>{const b=e.target.closest('[data-link]');if(!b)return;linked.add(+b.dataset.link);localStorage.setItem('ll-linked',JSON.stringify([...linked]));toast('已提交助养申请');render();});
document.getElementById('ll-offer').onclick=()=>{offers.unshift({cap:document.getElementById('ll-cap').value,note:document.getElementById('ll-note').value.trim(),time:Date.now()});localStorage.setItem('ll-offers',JSON.stringify(offers));toast('感谢你的善意');document.querySelector('[data-nav="mine"]').click();render();};
render();`,
      });
    },
  },
  {
    slug: "sijiao-pinda",
    build() {
      const classes = [
        { id: 1, title: "增肌私教 10 次卡", coach: "Coach Leo", price: 1280, need: 2, total: 4, gym: "力量工厂 · 高新店" },
        { id: 2, title: "体态矫正体验课", coach: "Amy", price: 99, need: 3, total: 6, gym: "KeepFit 中央城" },
        { id: 3, title: "燃脂私教拼团", coach: "大牛", price: 860, need: 1, total: 3, gym: "超级猩猩" },
      ];
      return shell({
        platform: "h5",
        title: "私教拼搭",
        accent: "#EF5350",
        accent2: "#E53935",
        heroBg: "#ffefef",
        emoji: "💪",
        tagline: "私教课拼人更划算",
        tabs: [
          { id: "home", label: "拼团", icon: "🔥" },
          { id: "create", label: "发起", icon: "➕" },
          { id: "mine", label: "我的", icon: "🎫" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>一起拼私教更省</h2><p>差 1 人成团的优先看</p></div>
  <div id="sj-list"></div>
</div>
<div class="view" id="view-create">
  <div class="card">
    <h3>发起拼课</h3>
    <div class="field"><label>课程名</label><input id="sj-title" placeholder="私教体验课"></div>
    <div class="field"><label>健身房</label><input id="sj-gym" placeholder="门店名"></div>
    <div class="field"><label>拼团价</label><input id="sj-price" type="number" placeholder="199"></div>
    <div class="field"><label>还差几人</label><input id="sj-need" type="number" value="2"></div>
    <button class="btn block" id="sj-submit">发布拼团</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我参与的拼团</h3><div id="sj-mine"></div></div></div>`,
        script: `
let CLS=${JSON.stringify(classes)};
const joined=new Set(JSON.parse(localStorage.getItem('sj-joined')||'[]'));
function render(){
  document.getElementById('sj-list').innerHTML=CLS.map(c=>\`<div class="card"><h3>\${c.title}</h3><div class="meta"><span>\${c.coach||'教练待定'}</span><span>\${c.gym}</span><span class="chip">¥\${c.price}</span><span>差\${c.need}人</span></div><div class="progress"><i style="width:\${Math.round((1-c.need/c.total)*100)}%"></i></div><div class="actions"><button class="btn" data-j="\${c.id}">\${joined.has(c.id)?'已参团':'参团'}</button></div></div>\`).join('');
  const mine=CLS.filter(c=>joined.has(c.id));
  document.getElementById('sj-mine').innerHTML=mine.length?mine.map(c=>\`<div class="list-item"><div><b>\${c.title}</b><div class="meta">¥\${c.price}</div></div><span class="chip">拼团中</span></div>\`).join(''):'<div class="empty">暂无拼团</div>';
}
document.getElementById('sj-list').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;const id=+b.dataset.j;const c=CLS.find(x=>x.id===id);if(!c||joined.has(id))return;joined.add(id);c.need=Math.max(0,c.need-1);localStorage.setItem('sj-joined',JSON.stringify([...joined]));toast(c.need===0?'恭喜成团！':'参团成功');render();});
document.getElementById('sj-submit').onclick=()=>{
  const title=document.getElementById('sj-title').value.trim(); if(!title) return toast('请填写课程名');
  const id=Date.now(); const need=+document.getElementById('sj-need').value||2;
  CLS.unshift({id,title,coach:'我发起的',price:+document.getElementById('sj-price').value||0,need,total:need+1,gym:document.getElementById('sj-gym').value.trim()||'待定'});
  joined.add(id); localStorage.setItem('sj-joined',JSON.stringify([...joined]));
  toast('拼团已发布'); document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "reliang",
    build() {
      const foods = [
        { id: 1, name: "鸡胸肉沙拉", kcal: 320, tag: "轻食", tip: "高蛋白低脂" },
        { id: 2, name: "红烧肉盖饭", kcal: 780, tag: "重口", tip: "建议减半米饭" },
        { id: 3, name: "番茄牛腩面", kcal: 540, tag: "面食", tip: "少喝汤更轻" },
        { id: 4, name: "蔬菜粥套餐", kcal: 280, tag: "清淡", tip: "适合控卡日" },
        { id: 5, name: "炸鸡套餐", kcal: 920, tag: "炸物", tip: "今日额度谨慎" },
        { id: 6, name: "酸奶水果杯", kcal: 210, tag: "加餐", tip: "不错的加餐" },
      ];
      return shell({
        platform: "h5",
        title: "热量一眼过",
        accent: "#FF7043",
        accent2: "#F4511E",
        heroBg: "#fff1eb",
        emoji: "🔥",
        tagline: "食堂菜品估热量",
        tabs: [
          { id: "home", label: "识别", icon: "📷" },
          { id: "today", label: "今日", icon: "📊" },
          { id: "lib", label: "菜谱", icon: "🥗" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>拍一下，热量心里有数</h2><p>演示：点选菜品即「识别」</p></div>
  <div class="card">
    <h3>快速识别</h3>
    <div class="field"><label>选择菜品</label><select id="rl-pick">${foods.map((f) => `<option value="${f.id}">${f.name}</option>`).join("")}</select></div>
    <button class="btn block" id="rl-scan">开始识别</button>
    <div id="rl-result" style="margin-top:12px"></div>
  </div>
</div>
<div class="view" id="view-today">
  <div class="hero"><h2 id="rl-sum">今日 0 kcal</h2><p>目标 1800 kcal</p><div class="progress" style="background:rgba(255,255,255,.25)"><i id="rl-bar" style="width:0%;background:#fff"></i></div></div>
  <div class="card"><h3>已记录</h3><div id="rl-logs"></div></div>
</div>
<div class="view" id="view-lib"><div id="rl-lib"></div></div>`,
        script: `
const FOODS=${JSON.stringify(foods)};
let logs=JSON.parse(localStorage.getItem('rl-logs')||'[]');
function renderToday(){
  const sum=logs.reduce((s,l)=>s+l.kcal,0);
  document.getElementById('rl-sum').textContent='今日 '+sum+' kcal';
  document.getElementById('rl-bar').style.width=Math.min(100,Math.round(sum/1800*100))+'%';
  document.getElementById('rl-logs').innerHTML=logs.length?logs.map(l=>\`<div class="list-item"><div><b>\${l.name}</b><div class="meta">\${l.time}</div></div><span class="chip">\${l.kcal} kcal</span></div>\`).join(''):'<div class="empty">还没记录</div>';
}
document.getElementById('rl-lib').innerHTML=FOODS.map(f=>\`<div class="card"><h3>\${f.name}</h3><div class="meta"><span class="chip">\${f.tag}</span><span>\${f.kcal} kcal</span></div><p style="font-size:13px;color:var(--muted)">\${f.tip}</p><div class="actions"><button class="btn" data-add="\${f.id}">记入今日</button></div></div>\`).join('');
document.getElementById('rl-scan').onclick=()=>{
  const f=FOODS.find(x=>x.id===+document.getElementById('rl-pick').value);
  document.getElementById('rl-result').innerHTML=\`<div class="card" style="margin:0;background:color-mix(in srgb,var(--accent) 8%,#fff)"><h3>\${f.name}</h3><div class="meta"><span class="chip">约 \${f.kcal} kcal</span><span>\${f.tag}</span></div><p style="font-size:13px;color:var(--muted)">\${f.tip}</p><div class="actions"><button class="btn" data-add="\${f.id}">记入今日</button></div></div>\`;
  toast('识别完成（演示）');
};
function addFood(id){const f=FOODS.find(x=>x.id===+id);if(!f)return;logs.unshift({name:f.name,kcal:f.kcal,time:new Date().toLocaleTimeString()});localStorage.setItem('rl-logs',JSON.stringify(logs));toast('已记入今日');renderToday();}
document.body.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;addFood(b.dataset.add);});
renderToday();`,
      });
    },
  },
  {
    slug: "paoxian",
    build() {
      const routes = [
        { id: 1, name: "湖畔轻松 5K", pace: "6分30秒/km", road: "平路", light: "路灯充足", score: 96 },
        { id: 2, name: "城墙间歇训练", pace: "5分20秒/km", road: "缓坡", light: "良好", score: 88 },
        { id: 3, name: "滨江夜跑 10K", pace: "6分00秒/km", road: "平路", light: "明亮", score: 92 },
        { id: 4, name: "公园爬坡挑战", pace: "7分00秒/km", road: "坡多", light: "一般", score: 80 },
      ];
      return shell({
        platform: "pc",
        title: "跑线推荐",
        accent: "#29B6F6",
        accent2: "#039BE5",
        heroBg: "#e8f7ff",
        emoji: "🏃",
        tagline: "按配速与路况推荐",
        tabs: [
          { id: "home", label: "推荐", icon: "✨" },
          { id: "filter", label: "筛选", icon: "⚙️" },
          { id: "mine", label: "收藏", icon: "⭐" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>今日适合你的跑线</h2><p id="px-hint">根据偏好排序</p></div>
  <div class="card-grid" id="px-list"></div>
</div>
<div class="view" id="view-filter">
  <div class="card">
    <h3>跑步偏好</h3>
    <div class="field"><label>目标配速</label><select id="px-pace"><option>轻松有氧</option><option>节奏跑</option><option>间歇挑战</option></select></div>
    <div class="field"><label>路况</label><select id="px-road"><option>不限</option><option>平路</option><option>缓坡</option><option>坡多</option></select></div>
    <button class="btn block" id="px-apply">应用筛选</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>收藏路线</h3><div id="px-mine"></div></div></div>`,
        script: `
const ROUTES=${JSON.stringify(routes)};
const fav=new Set(JSON.parse(localStorage.getItem('px-fav')||'[]'));
let road='不限';
function render(){
  let rows=[...ROUTES].sort((a,b)=>b.score-a.score);
  if(road!=='不限') rows=rows.filter(r=>r.road===road);
  document.getElementById('px-list').innerHTML=rows.map(r=>\`<div class="card"><h3>\${r.name}</h3><div class="meta"><span>配速 \${r.pace}</span><span>\${r.road}</span><span>\${r.light}</span><span class="chip">匹配 \${r.score}</span></div><div class="actions"><button class="btn" data-fav="\${r.id}">\${fav.has(r.id)?'已收藏':'收藏路线'}</button></div></div>\`).join('')||'<div class="empty">没有符合条件的路线</div>';
  const mine=ROUTES.filter(r=>fav.has(r.id));
  document.getElementById('px-mine').innerHTML=mine.length?mine.map(r=>\`<div class="list-item"><div><b>\${r.name}</b><div class="meta">\${r.pace}</div></div><span class="chip">收藏</span></div>\`).join(''):'<div class="empty">还没有收藏</div>';
}
document.getElementById('px-list').addEventListener('click',e=>{const b=e.target.closest('[data-fav]');if(!b)return;fav.add(+b.dataset.fav);localStorage.setItem('px-fav',JSON.stringify([...fav]));toast('已收藏');render();});
document.getElementById('px-apply').onclick=()=>{road=document.getElementById('px-road').value;document.getElementById('px-hint').textContent='偏好：'+document.getElementById('px-pace').value+' · '+road;toast('已更新推荐');document.querySelector('[data-nav="home"]').click();render();};
render();`,
      });
    },
  },
  {
    slug: "tubo",
    build() {
      const trips = [
        { id: 1, name: "青城后山轻松线", level: "入门", km: "8km", date: "本周六", need: 3 },
        { id: 2, name: "龙泉山日出线", level: "进阶", km: "14km", date: "本周日", need: 2 },
        { id: 3, name: "城市绿道半日", level: "轻松", km: "6km", date: "下周六", need: 5 },
      ];
      return shell({
        platform: "pc",
        title: "徒步组队社",
        accent: "#26A69A",
        accent2: "#00897B",
        heroBg: "#e8f6f3",
        emoji: "🥾",
        tagline: "路线与队友一键成团",
        tabs: [
          { id: "home", label: "队伍", icon: "🥾" },
          { id: "create", label: "组队", icon: "➕" },
          { id: "mine", label: "行程", icon: "🎒" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>周末徒步成团</h2><p>看路线 · 找队友</p></div>
  <div class="card-grid" id="tb-list"></div>
</div>
<div class="view" id="view-create">
  <div class="card">
    <h3>发起徒步</h3>
    <div class="field"><label>路线名</label><input id="tb-name" placeholder="某某山轻徒步"></div>
    <div class="field"><label>日期</label><input id="tb-date" placeholder="本周日"></div>
    <div class="field"><label>里程</label><input id="tb-km" placeholder="10km"></div>
    <div class="field"><label>还差几人</label><input id="tb-need" type="number" value="3"></div>
    <button class="btn block" id="tb-submit">发布组队</button>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>我的徒步</h3><div id="tb-mine"></div></div></div>`,
        script: `
let TRIPS=${JSON.stringify(trips)};
const joined=new Set(JSON.parse(localStorage.getItem('tb-joined')||'[]'));
function render(){
  document.getElementById('tb-list').innerHTML=TRIPS.map(t=>\`<div class="card"><h3>\${t.name}</h3><div class="meta"><span class="chip">\${t.level||'自建'}</span><span>\${t.km}</span><span>\${t.date}</span><span>缺\${t.need}人</span></div><div class="actions"><button class="btn" data-j="\${t.id}">\${joined.has(t.id)?'已入队':'加入队伍'}</button></div></div>\`).join('');
  const mine=TRIPS.filter(t=>joined.has(t.id));
  document.getElementById('tb-mine').innerHTML=mine.length?mine.map(t=>\`<div class="list-item"><div><b>\${t.name}</b><div class="meta">\${t.date} · \${t.km}</div></div><span class="chip">已报名</span></div>\`).join(''):'<div class="empty">暂无行程</div>';
}
document.getElementById('tb-list').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;const id=+b.dataset.j;const t=TRIPS.find(x=>x.id===id);if(!t||joined.has(id))return;joined.add(id);t.need=Math.max(0,t.need-1);localStorage.setItem('tb-joined',JSON.stringify([...joined]));toast('已入队');render();});
document.getElementById('tb-submit').onclick=()=>{
  const name=document.getElementById('tb-name').value.trim(); if(!name) return toast('请填写路线');
  const id=Date.now(); const need=+document.getElementById('tb-need').value||3;
  TRIPS.unshift({id,name,level:'自建',km:document.getElementById('tb-km').value.trim()||'待定',date:document.getElementById('tb-date').value.trim()||'待定',need});
  joined.add(id); localStorage.setItem('tb-joined',JSON.stringify([...joined]));
  toast('组队已发布'); document.querySelector('[data-nav="home"]').click(); render();
};
render();`,
      });
    },
  },
  {
    slug: "luying-zhuangbei",
    build() {
      const catalog = {
        基础: ["帐篷", "防潮垫", "睡袋", "头灯", "充电宝"],
        厨房: ["卡式炉", "锅具", "餐具", "饮用水", "垃圾袋"],
        天气: ["防晒衣", "雨衣", "保暖外套", "防风绳"],
        安全: ["急救包", "驱蚊液", "打火机", "多功能刀"],
      };
      return shell({
        platform: "pc",
        title: "露营装备单",
        accent: "#8D6E63",
        accent2: "#6D4C41",
        heroBg: "#f4efe9",
        emoji: "⛺",
        tagline: "按人数与天气生成清单",
        tabs: [
          { id: "home", label: "生成", icon: "✨" },
          { id: "list", label: "清单", icon: "✅" },
          { id: "tips", label: "提示", icon: "💡" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>生成你的露营清单</h2><p>人数 · 天气 · 一键出单</p></div>
  <div class="card">
    <div class="field"><label>人数</label><input id="ly-n" type="number" value="3" min="1"></div>
    <div class="field"><label>天气</label><select id="ly-w"><option>晴</option><option>多云</option><option>小雨</option><option>降温</option></select></div>
    <div class="field"><label>夜数</label><input id="ly-d" type="number" value="1" min="1"></div>
    <button class="btn block" id="ly-gen">生成装备单</button>
  </div>
</div>
<div class="view" id="view-list"><div class="card"><h3>清单（可勾选）</h3><div id="ly-items" class="empty">先去生成清单</div><button class="btn block" id="ly-save" style="margin-top:10px">保存清单</button></div></div>
<div class="view" id="view-tips">
  <div class="card"><h3>小提示</h3>
    <p style="font-size:13px;color:var(--muted);line-height:1.7">· 下雨优先带雨衣与地垫加厚<br>· 降温务必加保暖层与备用电池<br>· 人数每增加 2 人，餐具与水按比例加</p>
  </div>
</div>`,
        script: `
const CATALOG=${JSON.stringify(catalog)};
let items=[];
const checked=new Set();
function renderList(){
  const el=document.getElementById('ly-items');
  if(!items.length){el.innerHTML='<div class="empty">先去生成清单</div>';return;}
  el.innerHTML=items.map((name,i)=>\`<div class="list-item"><div style="display:flex;gap:10px;align-items:center"><div class="check \${checked.has(name)?'on':''}" data-c="\${name}">\${checked.has(name)?'✓':''}</div><b>\${name}</b></div></div>\`).join('');
}
document.getElementById('ly-gen').onclick=()=>{
  const n=+document.getElementById('ly-n').value||1;
  const w=document.getElementById('ly-w').value;
  const d=+document.getElementById('ly-d').value||1;
  items=[...CATALOG['基础'],...CATALOG['厨房'],...CATALOG['安全']];
  if(w==='小雨'||w==='降温') items.push(...CATALOG['天气']);
  if(n>=4) items.push('第二顶帐篷','折叠桌');
  if(d>=2) items.push('换洗衣物','洗漱包');
  items=[...new Set(items)];
  checked.clear();
  toast('清单已生成（'+items.length+' 项）');
  document.querySelector('[data-nav="list"]').click();
  renderList();
};
document.getElementById('ly-items').addEventListener('click',e=>{const c=e.target.closest('[data-c]');if(!c)return;const name=c.dataset.c;if(checked.has(name))checked.delete(name);else checked.add(name);renderList();});
document.getElementById('ly-save').onclick=()=>{localStorage.setItem('ly-list',JSON.stringify({items:[...items],checked:[...checked]}));toast('清单已保存到本机');};
const saved=JSON.parse(localStorage.getItem('ly-list')||'null');
if(saved){items=saved.items||[];(saved.checked||[]).forEach(x=>checked.add(x));renderList();}`,
      });
    },
  },
  {
    slug: "qixing",
    build() {
      const routes = [
        { id: 1, name: "滨江风光骑行", km: "18km", supply: "3 个补给点", level: "轻松", time: "约 70 分钟" },
        { id: 2, name: "大学城环线", km: "12km", supply: "便利店密集", level: "入门", time: "约 45 分钟" },
        { id: 3, name: "郊外爬坡挑战", km: "32km", supply: "2 个补给点", level: "进阶", time: "约 2 小时" },
        { id: 4, name: "夜骑灯光秀", km: "15km", supply: "市区补给", level: "轻松", time: "约 55 分钟" },
      ];
      return shell({
        platform: "pc",
        title: "骑行城市线",
        accent: "#00ACC1",
        accent2: "#00838F",
        heroBg: "#e6f8fa",
        emoji: "🚴",
        tagline: "路线与补给点推荐",
        tabs: [
          { id: "home", label: "路线", icon: "🗺️" },
          { id: "supply", label: "补给", icon: "🥤" },
          { id: "mine", label: "收藏", icon: "⭐" },
        ],
        body: `
<div class="view active" id="view-home">
  <div class="hero"><h2>城市骑行精选</h2><p>里程 · 补给 · 难度一眼看清</p></div>
  <div class="card-grid" id="qx-list"></div>
</div>
<div class="view" id="view-supply">
  <div class="card"><h3>常用补给点</h3>
    <div class="list-item"><div><b>滨江 3 号驿站</b><div class="meta">补水 · 充气 · 洗手间</div></div><span class="chip">开放</span></div>
    <div class="list-item"><div><b>大学城便利店集群</b><div class="meta">补给密集</div></div><span class="chip">推荐</span></div>
    <div class="list-item"><div><b>郊外服务站</b><div class="meta">工具租借</div></div><span class="chip">周末</span></div>
  </div>
</div>
<div class="view" id="view-mine"><div class="card"><h3>收藏路线</h3><div id="qx-mine"></div></div></div>`,
        script: `
const ROUTES=${JSON.stringify(routes)};
const fav=new Set(JSON.parse(localStorage.getItem('qx-fav')||'[]'));
function render(){
  document.getElementById('qx-list').innerHTML=ROUTES.map(r=>\`<div class="card"><h3>\${r.name}</h3><div class="meta"><span>\${r.km}</span><span>\${r.level}</span><span>\${r.time}</span><span class="chip">\${r.supply}</span></div><div class="actions"><button class="btn" data-fav="\${r.id}">\${fav.has(r.id)?'已收藏':'收藏'}</button><button class="btn ghost" data-go="\${r.id}">开始导航</button></div></div>\`).join('');
  const mine=ROUTES.filter(r=>fav.has(r.id));
  document.getElementById('qx-mine').innerHTML=mine.length?mine.map(r=>\`<div class="list-item"><div><b>\${r.name}</b><div class="meta">\${r.km} · \${r.level}</div></div><span class="chip">收藏</span></div>\`).join(''):'<div class="empty">还没有收藏</div>';
}
document.getElementById('qx-list').addEventListener('click',e=>{
  const favBtn=e.target.closest('[data-fav]');
  if(favBtn){fav.add(+favBtn.dataset.fav);localStorage.setItem('qx-fav',JSON.stringify([...fav]));toast('已收藏');render();return;}
  const go=e.target.closest('[data-go]');
  if(go){const r=ROUTES.find(x=>x.id===+go.dataset.go);toast('已规划「'+r.name+'」（演示）');}
});
render();`,
      });
    },
  },
];

async function main() {
  if (!process.argv.includes("--force")) {
    console.error(
      "[generate-real-apps] 已停用默认覆盖：apps/ 下为场景定制页。\n" +
        "如需强制用旧模板壳重写，请加 --force（会丢失定制 UI）。",
    );
    process.exit(1);
  }
  await fs.mkdir(APPS_ROOT, { recursive: true });
  let written = 0;
  for (const app of APPS) {
    if (app.skip) continue;
    const html = app.build();
    const dir = path.join(APPS_ROOT, app.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
    // 去掉占位 README / 测试标记文件（若有）
    try {
      await fs.unlink(path.join(dir, "README.md"));
    } catch {
      /* ignore */
    }
    written += 1;
    const plat = APP_PLATFORM_BY_SLUG[app.slug] || "h5";
    console.log(`[ok] /apps/${app.slug}/  (${plat})`);
  }
  console.log(`\nGenerated ${written} apps. Kept shitang-pintuan as-is.`);
}

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}