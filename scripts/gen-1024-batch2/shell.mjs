/**
 * 1024 码上创 · 第二批应用生成外壳
 * 统一视觉系统 + 轻量运行时（AK），每个应用只写自己的 UI 与逻辑。
 */

export const SHELL_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--a:#5b6ef5;--b:#2a2c86;--ink:#141a2b;--ink2:#4b5570;--ink3:#8b93a8;--line:#e7e9f2;--bg:#f4f5fb;--r:16px}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);padding:16px 14px 44px;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto}
.hd{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.ico{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:linear-gradient(150deg,var(--a),var(--b));box-shadow:0 8px 20px rgba(20,26,43,.18);flex:0 0 auto}
h1{font-size:19px;font-weight:800;letter-spacing:-.3px}
.sub{font-size:12.5px;color:var(--ink3);margin-top:3px}
.card{background:#fff;border-radius:var(--r);padding:16px;box-shadow:0 3px 16px rgba(20,26,43,.06);margin-bottom:12px}
.card h2{font-size:14px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.card h2 small{font-weight:600;color:var(--ink3);font-size:11.5px;margin-left:auto}
label{display:block;font-size:12.5px;font-weight:700;color:var(--ink2);margin-bottom:6px}
input,select,textarea{width:100%;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-size:14px;font-family:inherit;color:var(--ink);background:#fff;outline:none;font-weight:600}
input:focus,select:focus,textarea:focus{border-color:var(--a);box-shadow:0 0 0 3px rgba(91,110,245,.12)}
.btn{border:none;border-radius:11px;padding:10px 16px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}
.btn-main{background:linear-gradient(135deg,var(--a),var(--b));color:#fff;box-shadow:0 6px 16px rgba(20,26,43,.14)}
.btn-main:active{transform:translateY(1px)}
.btn-ghost{background:#eef0f8;color:var(--ink2)}
.btn-sm{padding:6px 11px;font-size:12px;border-radius:9px}
.btn-warn{background:#fdeaea;color:#c0392b}
.btn:disabled{opacity:.5;cursor:not-allowed}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.spread{justify-content:space-between}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.field{margin-bottom:12px}
.chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer;font-family:inherit}
.chip.on{background:linear-gradient(135deg,var(--a),var(--b));color:#fff;border-color:transparent}
.big{font-size:30px;font-weight:900;letter-spacing:-1px;font-variant-numeric:tabular-nums}
.muted{font-size:12px;color:var(--ink3);line-height:1.75}
.kv{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:13px}
.kv:last-child{border-bottom:none}
.kv b{font-variant-numeric:tabular-nums;font-weight:800}
.bar{height:8px;border-radius:999px;background:#eef0f8;overflow:hidden}
.bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--a),var(--b));transition:width .3s}
.item{border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:8px;background:#fff;font-size:13px;display:flex;gap:10px;align-items:center}
.item .grow{flex:1;min-width:0}
.item .t{font-weight:700;word-break:break-word}
.item .s{font-size:11.5px;color:var(--ink3);margin-top:3px;line-height:1.6}
.item.done{opacity:.5;text-decoration:line-through}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef0f8;color:var(--ink2)}
.result{background:linear-gradient(150deg,var(--a),var(--b));border-radius:14px;padding:16px;color:#fff}
.result .lbl{font-size:11.5px;opacity:.78}
.empty{text-align:center;color:var(--ink3);font-size:12.5px;padding:18px 0;line-height:1.8}
.ft{text-align:center;font-size:11px;color:var(--ink3);margin-top:18px;line-height:1.9}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:rgba(20,26,43,.92);color:#fff;font-size:13px;padding:10px 18px;border-radius:999px;opacity:0;pointer-events:none;transition:.25s;z-index:99;max-width:80vw;text-align:center}
.toast.on{opacity:1;transform:translate(-50%,0)}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th,td{padding:8px 6px;text-align:left;border-bottom:1px solid var(--line)}
th{color:var(--ink3);font-weight:700;font-size:11.5px}
td{font-variant-numeric:tabular-nums}
.hero{background:linear-gradient(150deg,var(--a),var(--b));border-radius:14px;padding:16px;color:#fff;position:relative;overflow:hidden}
.hero:after{content:"";position:absolute;right:-60px;top:-70px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.10)}
@media(max-width:420px){.grid3{grid-template-columns:1fr 1fr}.big{font-size:26px}}
`;

const AK_RUNTIME = `
var AK={
  $:function(s,r){return (r||document).querySelector(s)},
  $$:function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))},
  n:function(v,d){var x=Number(v);return isFinite(x)?x:(d===undefined?0:d)},
  fmt:function(v,d){d=d||0;try{return Number(v).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d})}catch(e){return String(v)}},
  clamp:function(v,a,b){return Math.min(b,Math.max(a,v))},
  esc:function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')},
  store:{
    get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
    set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
    del:function(k){try{localStorage.removeItem(k)}catch(e){}}
  },
  toast:function(msg){var t=AK.$('#toast');if(!t)return;t.textContent=msg;t.className='toast on';clearTimeout(AK._tt);AK._tt=setTimeout(function(){t.className='toast'},1900)},
  on:function(sel,ev,fn){var el=typeof sel==='string'?AK.$(sel):sel;if(el)el.addEventListener(ev,fn);return el},
  pad:function(n){return String(n).length<2?'0'+n:String(n)},
  ymd:function(d){d=d||new Date();return d.getFullYear()+'-'+AK.pad(d.getMonth()+1)+'-'+AK.pad(d.getDate())},
  hm:function(sec){sec=Math.max(0,Math.round(sec));var m=Math.floor(sec/60);return AK.pad(m)+':'+AK.pad(sec%60)},
  days:function(a,b){return Math.round((b-a)/86400000)},
  uid:function(){return Math.random().toString(36).slice(2,9)},
  copy:function(text){try{if(navigator.clipboard){navigator.clipboard.writeText(text);AK.toast('已复制')}else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();AK.toast('已复制')}}catch(e){AK.toast('复制失败，请手动选择')}}
};
window.AK=AK;
`;

export function pageFor(app) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${app.name}</title>
<meta name="description" content="${app.tagline}">
<style>${SHELL_CSS}
:root{--a:${app.theme[0]};--b:${app.theme[1]};--bg:${app.bg || "#f4f5fb"}}
${app.css || ""}
</style>
</head>
<body>
<div class="wrap">
  <header class="hd">
    <div class="ico">${app.icon}</div>
    <div>
      <h1>${app.name}</h1>
      <p class="sub">${app.tagline}</p>
    </div>
  </header>
  <main id="app">
${app.body}
  </main>
  <footer class="ft">数据保存在本机浏览器 · 无需登录<br>1024 程序员节 · 码上创</footer>
</div>
<div class="toast" id="toast"></div>
<script>${AK_RUNTIME}</script>
<script>
try{
${app.init}
}catch(e){console.error(e);}
</script>
</body>
</html>
`;
}

export function coverFor(app) {
  const [a, b] = app.theme;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1024px;height:640px;overflow:hidden;position:relative;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:linear-gradient(145deg,${a},${b});color:#fff}
.c1{position:absolute;width:560px;height:560px;border-radius:50%;background:rgba(255,255,255,.10);right:-150px;top:-180px}
.c2{position:absolute;width:360px;height:360px;border-radius:50%;background:rgba(255,255,255,.07);left:-130px;bottom:-160px}
.c3{position:absolute;right:96px;bottom:96px;width:200px;height:200px;border-radius:44px;background:rgba(255,255,255,.13);transform:rotate(-12deg)}
.in{position:absolute;left:76px;top:132px;right:76px}
.ic{font-size:92px;line-height:1;filter:drop-shadow(0 8px 18px rgba(0,0,0,.18))}
h1{font-size:76px;font-weight:900;letter-spacing:-3px;margin:22px 0 18px;text-shadow:0 6px 22px rgba(0,0,0,.16)}
p{font-size:30px;font-weight:600;opacity:.9;line-height:1.5;max-width:780px}
.badge{position:absolute;left:76px;bottom:58px;font-size:21px;letter-spacing:3px;opacity:.78;font-weight:600}
</style></head><body>
<div class="c1"></div><div class="c2"></div><div class="c3"></div>
<div class="in"><div class="ic">${app.icon}</div><h1>${app.name}</h1><p>${app.tagline}</p></div>
<div class="badge">1024 程序员节 · 码上创</div>
</body></html>`;
}

export function introFor(app) {
  const feats = (app.feats || []).map((f, i) => `${i + 1}. ${f}`).join("\n");
  const lines = [
    `应用名称：${app.name}`,
    `所属分类：${app.cat}`,
    `一句话介绍：${app.tagline}`,
    "",
    "应用简介",
    app.desc,
    "",
    "核心功能",
    feats,
    "",
    "文件说明",
    `${app.name}.html    应用页面（双击打开即可使用）`,
    "封面.png       应用封面图（1024 × 640）",
    "介绍.txt       本文件",
    "",
  ];
  return lines.join("\n");
}
