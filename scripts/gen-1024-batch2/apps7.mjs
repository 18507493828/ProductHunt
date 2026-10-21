/* 第二批替换 · 10 个工具类应用
   避开线上已有的：单位换算器、健康指数计算、睡眠计算器、热量一眼过、
   露营装备单、志愿时长本、课表空档表、合租账单分摊、聚餐分账、配速区间。 */
export default [
  {
    name: "物理公式速查",
    slug: "wuli-gongshi-sucha",
    cat: "K12",
    icon: "📐",
    tagline: "二十条常用公式，代入数字就出结果",
    theme: ["#2f6fd0", "#102a52"],
    bg: "#f1f6ff",
    desc: "把初中到高中常用的物理公式收在一页：选公式、填数字，直接出结果，单位自动对齐。适合做题时核对、考前快速过一遍。",
    feats: [
      "按力学、运动、电学、热学、光学分类",
      "选中公式后填三个以内的量，结果实时计算",
      "每条公式标注单位与适用条件",
      "纯前端计算，不联网也能用",
    ],
    css: ".flist{display:flex;flex-wrap:wrap;gap:8px}.flist .chip{font-size:12px}.fbox{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:12px}.fml{font-size:16px;font-weight:800;letter-spacing:.4px;margin-bottom:4px}.cond{font-size:11.5px;color:var(--ink3);margin-bottom:10px}",
    body: `
  <section class="card">
    <div class="row" id="cats" style="margin-bottom:10px"></div>
    <div class="flist" id="flist"></div>
  </section>
  <section class="card" id="detail" style="display:none">
    <h2 id="fname">— <small id="fcat"></small></h2>
    <div class="fbox">
      <div class="fml" id="ftext">—</div>
      <div class="cond" id="fcond"></div>
      <div id="finputs"></div>
      <div class="result" style="margin-top:4px">
        <div class="lbl" id="foutlabel">结果</div>
        <div style="font-size:26px;font-weight:900;margin-top:4px" id="fout">—</div>
      </div>
    </div>
  </section>`,
    init: `
  var DATA=[
    {cat:'力学',items:[
      {n:'牛顿第二定律',f:'F = m · a',cond:'宏观低速、质量不变',unit:'N',out:'合力',
       ins:[['m','质量',10,'kg'],['a','加速度',2,'m/s²']],calc:function(v){return v.m*v.a;}},
      {n:'重力',f:'G = m · g',cond:'地面附近 g 取 9.8',unit:'N',out:'重力',
       ins:[['m','质量',60,'kg']],calc:function(v){return v.m*9.8;}},
      {n:'滑动摩擦力',f:'f = μ · N',cond:'正压力 N、动摩擦因数 μ',unit:'N',out:'摩擦力',
       ins:[['u','摩擦因数',0.3,''],['N','正压力',200,'N']],calc:function(v){return v.u*v.N;}},
      {n:'功',f:'W = F · s · cosθ',cond:'θ 为力与位移夹角',unit:'J',out:'功',
       ins:[['F','力',50,'N'],['s','位移',10,'m'],['c','cosθ',1,'']],calc:function(v){return v.F*v.s*v.c;}},
      {n:'功率',f:'P = F · v',cond:'匀速直线运动',unit:'W',out:'功率',
       ins:[['F','牵引力',300,'N'],['v','速度',20,'m/s']],calc:function(v){return v.F*v.v;}},
      {n:'动能',f:'E = ½ m v²',cond:'—',unit:'J',out:'动能',
       ins:[['m','质量',2,'kg'],['v','速度',10,'m/s']],calc:function(v){return 0.5*v.m*v.v*v.v;}},
      {n:'重力势能',f:'E = m g h',cond:'以参考面为零势能',unit:'J',out:'势能',
       ins:[['m','质量',2,'kg'],['h','高度',10,'m']],calc:function(v){return v.m*9.8*v.h;}},
      {n:'向心加速度',f:'a = v² / r',cond:'匀速圆周运动',unit:'m/s²',out:'向心加速度',
       ins:[['v','线速度',5,'m/s'],['r','半径',2,'m']],calc:function(v){return v.v*v.v/v.r;}}
    ]},
    {cat:'运动',items:[
      {n:'平均速度',f:'v = s / t',cond:'—',unit:'m/s',out:'速度',
       ins:[['s','路程',100,'m'],['t','时间',12,'s']],calc:function(v){return v.t?v.s/v.t:0;}},
      {n:'匀加速位移',f:'s = v₀t + ½ a t²',cond:'加速度恒定',unit:'m',out:'位移',
       ins:[['v0','初速度',0,'m/s'],['t','时间',5,'s'],['a','加速度',2,'m/s²']],calc:function(v){return v.v0*v.t+0.5*v.a*v.t*v.t;}},
      {n:'速度位移关系',f:'v² = v₀² + 2 a s',cond:'加速度恒定',unit:'m/s',out:'末速度',
       ins:[['v0','初速度',0,'m/s'],['a','加速度',2,'m/s²'],['s','位移',25,'m']],calc:function(v){var x=v.v0*v.v0+2*v.a*v.s;return x>0?Math.sqrt(x):0;}},
      {n:'自由落体时间',f:'t = √(2h / g)',cond:'初速度为零',unit:'s',out:'下落时间',
       ins:[['h','高度',20,'m']],calc:function(v){return Math.sqrt(2*v.h/9.8);}}
    ]},
    {cat:'电学',items:[
      {n:'欧姆定律',f:'U = I · R',cond:'线性电阻',unit:'V',out:'电压',
       ins:[['I','电流',0.5,'A'],['R','电阻',20,'Ω']],calc:function(v){return v.I*v.R;}},
      {n:'电功率',f:'P = U · I',cond:'—',unit:'W',out:'功率',
       ins:[['U','电压',220,'V'],['I','电流',0.2,'A']],calc:function(v){return v.U*v.I;}},
      {n:'电功',f:'W = U · I · t',cond:'t 以秒计',unit:'J',out:'电功',
       ins:[['U','电压',220,'V'],['I','电流',0.2,'A'],['t','时间',3600,'s']],calc:function(v){return v.U*v.I*v.t;}},
      {n:'电阻定律',f:'R = ρ L / S',cond:'ρ 为电阻率',unit:'Ω',out:'电阻',
       ins:[['p','电阻率',1.7e-8,'Ω·m'],['L','长度',100,'m'],['S','横截面积',1e-6,'m²']],calc:function(v){return v.S?v.p*v.L/v.S:0;}}
    ]},
    {cat:'热学',items:[
      {n:'吸放热',f:'Q = c m Δt',cond:'无相变',unit:'J',out:'热量',
       ins:[['c','比热容',4200,'J/(kg·℃)'],['m','质量',2,'kg'],['dt','温差',30,'℃']],calc:function(v){return v.c*v.m*v.dt;}},
      {n:'热机效率',f:'η = W / Q × 100%',cond:'W 为有用功',unit:'%',out:'效率',
       ins:[['W','有用功',3000,'J'],['Q','总热量',10000,'J']],calc:function(v){return v.Q?v.W/v.Q*100:0;}}
    ]},
    {cat:'光学',items:[
      {n:'折射率',f:'n = c / v',cond:'c 为真空光速',unit:'',out:'折射率',
       ins:[['c','真空光速',3e8,'m/s'],['v','介质光速',2e8,'m/s']],calc:function(v){return v.v?v.c/v.v:0;}},
      {n:'薄透镜成像',f:'1/f = 1/u + 1/v',cond:'u 物距，结果取像距',unit:'cm',out:'像距',
       ins:[['f','焦距',10,'cm'],['u','物距',30,'cm']],calc:function(v){var x=1/v.f-1/v.u;return x?1/x:0;}}
    ]}
  ];
  var cur=null, cat=DATA[0].cat;
  function renderCats(){
    var box=AK.$('#cats'); box.innerHTML='';
    DATA.forEach(function(g){
      var b=document.createElement('button');
      b.type='button'; b.className='chip'+(g.cat===cat?' on':''); b.textContent=g.cat;
      b.addEventListener('click',function(){ cat=g.cat; renderCats(); renderList(); });
      box.appendChild(b);
    });
  }
  function renderList(){
    var box=AK.$('#flist'); box.innerHTML='';
    var group=DATA.filter(function(g){return g.cat===cat;})[0];
    group.items.forEach(function(it){
      var b=document.createElement('button');
      b.type='button'; b.className='chip'+(cur===it?' on':''); b.textContent=it.n;
      b.addEventListener('click',function(){ cur=it; renderList(); show(it); });
      box.appendChild(b);
    });
  }
  function show(it){
    AK.$('#detail').style.display='';
    AK.$('#fname').textContent=it.n;
    AK.$('#fcat').textContent=it.unit?'单位 '+it.unit:'';
    AK.$('#ftext').textContent=it.f;
    AK.$('#fcond').textContent='适用条件：'+it.cond;
    var box=AK.$('#finputs'); box.innerHTML='';
    it.ins.forEach(function(row){
      var wrap=document.createElement('div');
      wrap.className='field';
      var lab=document.createElement('label');
      lab.textContent=row[1]+(row[3]?'（'+row[3]+'）':'');
      var inp=document.createElement('input');
      inp.type='number'; inp.value=String(row[2]); inp.dataset.k=row[0];
      inp.addEventListener('input',function(){ calc(it); });
      wrap.appendChild(lab); wrap.appendChild(inp);
      box.appendChild(wrap);
    });
    calc(it);
  }
  function calc(it){
    var v={};
    AK.$$('#finputs input').forEach(function(i){ v[i.dataset.k]=AK.n(i.value,0); });
    var r=it.calc(v);
    var txt;
    if(!isFinite(r)) txt='—';
    else if(Math.abs(r)>=1e6||(Math.abs(r)>0&&Math.abs(r)<1e-3)) txt=r.toExponential(2);
    else txt=(Math.round(r*1000)/1000).toLocaleString('zh-CN');
    AK.$('#foutlabel').textContent=it.out+(it.unit?'（'+it.unit+'）':'');
    AK.$('#fout').textContent=txt;
  }
  renderCats(); renderList();
  cur=DATA[0].items[0]; renderList(); show(cur);`,
  },
  {
    name: "宿舍值日表",
    slug: "sushe-zhiri",
    cat: "校园",
    icon: "🧹",
    tagline: "轮着来，谁值日一眼看清",
    theme: ["#2ea44f", "#0f4126"],
    bg: "#f2fbf5",
    desc: "把宿舍成员填进去，选每天几个人、从哪天开始，自动排出两周值日表。人少就一天一人，人多可以两人一组。表格可复制发群里。",
    feats: [
      "按成员顺序自动轮换，不重复不遗漏",
      "每天 1 到 2 人一组，可选 7 天或 14 天",
      "设置与成员名单保存在本机，下次直接看",
      "一键复制表格文本，方便发到宿舍群",
    ],
    css: "table td:first-child{white-space:nowrap}table td:nth-child(2){color:var(--ink3);font-size:12px}.today{background:rgba(46,164,79,.1);font-weight:800}",
    body: `
  <section class="card">
    <div class="field">
      <label for="mem">宿舍成员（用逗号或空格分开）</label>
      <input id="mem" placeholder="张三, 李四, 王五, 赵六">
    </div>
    <div class="grid2">
      <div class="field"><label for="per">每天几人</label>
        <select id="per"><option value="1">1 人</option><option value="2">2 人</option></select>
      </div>
      <div class="field"><label for="days">排几天</label>
        <select id="days"><option value="7">7 天</option><option value="14">14 天</option></select>
      </div>
    </div>
    <div class="field"><label for="start">起始日期</label><input type="date" id="start"></div>
    <div class="row">
      <button class="btn btn-main" id="gen" type="button">生成值日表</button>
      <button class="btn btn-ghost" id="copy" type="button">复制表格</button>
    </div>
  </section>
  <section class="card">
    <h2>值日安排 <small id="tip">—</small></h2>
    <div id="out"><div class="empty">填好成员后点「生成值日表」</div></div>
  </section>`,
    init: `
  var cfg=AK.store.get('duty.cfg',null);
  function today(){ return AK.ymd(new Date()); }
  AK.$('#start').value = cfg ? cfg.start : today();
  if(cfg){ AK.$('#mem').value=cfg.mem; AK.$('#per').value=String(cfg.per); AK.$('#days').value=String(cfg.days); }
  function parseMembers(){
    return (AK.$('#mem').value||'').split(/[,，、\\s]+/).filter(function(s){return s;});
  }
  function build(){
    var mem=parseMembers();
    if(mem.length<2){ AK.toast('至少填两位成员'); return; }
    var per=AK.n(AK.$('#per').value,1), days=AK.n(AK.$('#days').value,7);
    var start=AK.$('#start').value||today();
    var base=new Date(start+'T00:00:00');
    if(isNaN(base.getTime())){ AK.toast('起始日期不对'); return; }
    AK.store.set('duty.cfg',{mem:AK.$('#mem').value,per:per,days:days,start:start});
    var wk=['周日','周一','周二','周三','周四','周五','周六'];
    var rows=[], idx=0, texts=[];
    for(var i=0;i<days;i++){
      var d=new Date(base.getTime()+i*86400000);
      var who=[];
      for(var k=0;k<per;k++){ who.push(mem[idx%mem.length]); idx++; }
      rows.push({date:d,who:who});
      texts.push(AK.ymd(d)+' '+wk[d.getDay()]+' '+who.join('、'));
    }
    var html='<table><thead><tr><th>日期</th><th>星期</th><th>值日</th></tr></thead><tbody>';
    var now=AK.ymd(new Date());
    rows.forEach(function(r){
      var cls=AK.ymd(r.date)===now?' class="today"':'';
      html+='<tr'+cls+'><td>'+AK.ymd(r.date).slice(5)+'</td><td>'+wk[r.date.getDay()]+'</td><td>'+AK.esc(r.who.join('、'))+'</td></tr>';
    });
    html+='</tbody></table>';
    AK.$('#out').innerHTML=html;
    AK.$('#tip').textContent='共 '+days+' 天 · '+mem.length+' 人轮换';
    AK._text = '宿舍值日表（'+start+' 起）\\n'+texts.join('\\n');
  }
  AK.on('#gen','click',build);
  AK.on('#copy','click',function(){ if(!AK._text){ AK.toast('先生成表格'); return; } AK.copy(AK._text); });
  if(cfg) build();`,
  },
  {
    name: "学分进度看板",
    slug: "xuefen-jindu",
    cat: "校园",
    icon: "🎓",
    tagline: "还差多少学分毕业，一屏看清",
    theme: ["#7a5af8", "#2c1a6b"],
    bg: "#f7f5ff",
    desc: "按模块记录毕业要求学分与实际已修学分，自动算总进度、各模块缺口。模块名可自己改（必修、选修、实践、论文），数据存在本机，随时更新。",
    feats: [
      "模块名、要求学分、已修学分都可自行编辑",
      "自动汇总总学分、总进度与剩余缺口",
      "每个模块单独进度条，缺口一眼看到",
      "设 100% 达标提示，数据保存在本机",
    ],
    css: ".rowline{display:grid;grid-template-columns:1.4fr .8fr .8fr 28px;gap:8px;align-items:center;margin-bottom:8px}.rowline input{padding:8px 10px;font-size:13px}.rowline .del{border:none;background:#fdeaea;color:#c0392b;border-radius:8px;width:28px;height:32px;cursor:pointer;font-weight:800;font-family:inherit}.mod{margin-bottom:12px}.mod .kv{padding:6px 0}",
    body: `
  <section class="card">
    <h2>模块设置 <small>要求 / 已修</small></h2>
    <div class="rowline" style="font-size:11.5px;color:var(--ink3);font-weight:700">
      <span>模块</span><span>要求</span><span>已修</span><span></span>
    </div>
    <div id="rows"></div>
    <div class="row">
      <button class="btn btn-ghost btn-sm" id="add" type="button">+ 加一行</button>
      <button class="btn btn-main btn-sm" id="save" type="button">保存并计算</button>
    </div>
  </section>
  <section class="card">
    <h2>总进度 <small id="state">—</small></h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">已修 / 要求</div>
      <div style="font-size:28px;font-weight:900;margin-top:4px" id="total">0 / 0</div>
      <div style="margin-top:10px"><div class="bar" style="background:rgba(255,255,255,.25)"><i id="tbar" style="width:0%;background:#fff"></i></div></div>
    </div>
    <div id="mods"></div>
  </section>`,
    init: `
  var DEF=[{n:'必修课',need:100,got:0},{n:'选修课',need:30,got:0},{n:'实践环节',need:20,got:0},{n:'毕业论文',need:8,got:0}];
  var rows=AK.store.get('credit.rows',DEF);
  function render(){
    var box=AK.$('#rows'); box.innerHTML='';
    rows.forEach(function(r,i){
      var line=document.createElement('div');
      line.className='rowline';
      var n=document.createElement('input'); n.value=r.n; n.placeholder='模块名';
      var need=document.createElement('input'); need.type='number'; need.value=String(r.need);
      var got=document.createElement('input'); got.type='number'; got.value=String(r.got);
      var del=document.createElement('button'); del.type='button'; del.className='del'; del.textContent='×';
      n.addEventListener('input',function(){ rows[i].n=n.value; });
      need.addEventListener('input',function(){ rows[i].need=AK.n(need.value,0); });
      got.addEventListener('input',function(){ rows[i].got=AK.n(got.value,0); });
      del.addEventListener('click',function(){ rows.splice(i,1); render(); });
      line.appendChild(n); line.appendChild(need); line.appendChild(got); line.appendChild(del);
      box.appendChild(line);
    });
  }
  function calc(){
    AK.store.set('credit.rows',rows);
    var need=0, got=0;
    rows.forEach(function(r){ need+=r.need; got+=r.got; });
    AK.$('#total').textContent=AK.fmt(got)+' / '+AK.fmt(need);
    var pct=need?Math.min(100,got/need*100):0;
    AK.$('#tbar').style.width=pct.toFixed(1)+'%';
    AK.$('#state').textContent = got>=need && need>0 ? '已达标' : '还差 '+AK.fmt(Math.max(0,need-got))+' 学分';
    var html='';
    rows.forEach(function(r){
      var p=r.need?Math.min(100,r.got/r.need*100):0;
      html+='<div class="mod"><div class="kv"><span>'+AK.esc(r.n)+'</span><b>'+r.got+' / '+r.need+'</b></div><div class="bar"><i style="width:'+p.toFixed(1)+'%"></i></div></div>';
    });
    AK.$('#mods').innerHTML = html || '<div class="empty">还没有模块</div>';
  }
  AK.on('#add','click',function(){ rows.push({n:'新模块',need:0,got:0}); render(); });
  AK.on('#save','click',function(){ calc(); AK.toast('已保存'); });
  render(); calc();`,
  },
  {
    name: "群接龙登记",
    slug: "qun-jielong",
    cat: "社交",
    icon: "📋",
    tagline: "报名接龙排好号，一键复制发群",
    theme: ["#0ea5a5", "#0a3d3d"],
    bg: "#f0fbfb",
    desc: "发起一个接龙，把标题和说明写清楚，每来一个人点一下追加名字，序号自动排。人满了自动停止，最后复制成标准接龙格式发到群里。",
    feats: [
      "标题、说明、人数上限都可设置",
      "一键追加名字，序号自动排列",
      "支持撤销最后一位、清空重来",
      "一键复制成「#接龙」格式文本",
    ],
    css: ".jrow{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:13.5px}.jrow b{width:26px;height:26px;border-radius:50%;background:rgba(14,165,165,.12);color:#0a7d7d;display:grid;place-items:center;font-size:12px;flex:0 0 auto}.jrow span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    body: `
  <section class="card">
    <div class="field"><label for="title">接龙标题</label><input id="title" placeholder="周末徒步 · 香山线"></div>
    <div class="field"><label for="note">说明（可选）</label><input id="note" placeholder="周六 8:00 地铁口集合"></div>
    <div class="grid2">
      <div class="field"><label for="cap">人数上限</label><input id="cap" type="number" value="12"></div>
      <div class="field"><label for="who">追加名字</label><input id="who" placeholder="填名字后回车"></div>
    </div>
    <div class="row">
      <button class="btn btn-main" id="add" type="button">接龙 +1</button>
      <button class="btn btn-ghost btn-sm" id="undo" type="button">撤销最后一位</button>
      <button class="btn btn-ghost btn-sm" id="copy" type="button">复制接龙</button>
      <button class="btn btn-warn btn-sm" id="clear" type="button">清空</button>
    </div>
  </section>
  <section class="card">
    <h2>已接龙 <small id="cnt">0 人</small></h2>
    <div id="list"></div>
    <div class="empty" id="empty">还没有人接龙</div>
  </section>`,
    init: `
  var saved=AK.store.get('jielong.data',{title:'',note:'',cap:12,names:[]});
  AK.$('#title').value=saved.title||'';
  AK.$('#note').value=saved.note||'';
  AK.$('#cap').value=String(saved.cap||12);
  var names=saved.names||[];
  function save(){
    AK.store.set('jielong.data',{title:AK.$('#title').value,note:AK.$('#note').value,cap:AK.n(AK.$('#cap').value,12),names:names});
  }
  function render(){
    var box=AK.$('#list'); box.innerHTML='';
    names.forEach(function(n,i){
      var d=document.createElement('div');
      d.className='jrow';
      d.innerHTML='<b>'+String(i+1)+'</b><span>'+AK.esc(n)+'</span>';
      box.appendChild(d);
    });
    AK.$('#cnt').textContent=names.length+' 人';
    AK.$('#empty').style.display=names.length?'none':'';
  }
  function add(){
    var v=(AK.$('#who').value||'').trim();
    var cap=AK.n(AK.$('#cap').value,12);
    if(!v){ AK.toast('先填个名字'); return; }
    if(cap>0 && names.length>=cap){ AK.toast('已满 '+cap+' 人'); return; }
    names.push(v);
    AK.$('#who').value='';
    save(); render();
    AK.toast('第 '+names.length+' 位：'+v);
  }
  function jlText(){
    var out=['#接龙', AK.$('#title').value||'接龙'];
    var note=AK.$('#note').value;
    if(note) out.push(note);
    out.push('');
    names.forEach(function(n,i){ out.push((i+1)+'. '+n); });
    return out.join('\\n');
  }
  AK.on('#add','click',add);
  AK.on('#who','keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); add(); } });
  AK.on('#undo','click',function(){
    if(!names.length){ AK.toast('没有可撤销的'); return; }
    var n=names.pop(); save(); render(); AK.toast('已移除 '+n);
  });
  AK.on('#copy','click',function(){
    if(!names.length){ AK.toast('还没有人接龙'); return; }
    AK.copy(jlText());
  });
  AK.on('#clear','click',function(){
    if(!names.length) return;
    if(!confirm('清空全部接龙记录？')) return;
    names=[]; save(); render();
  });
  ['#title','#note','#cap'].forEach(function(sel){ AK.on(sel,'input',save); });
  render();`,
  },
  {
    name: "应急物资清单",
    slug: "yingji-wuzi",
    cat: "公益",
    icon: "🧰",
    tagline: "家里、车里、野外，该备什么按人数算",
    theme: ["#e0701b", "#5c2a00"],
    bg: "#fff7f1",
    desc: "按场景和人数生成应急物资清单：家里备灾、车载应急、户外徒步各有侧重，数量按人数自动折算。勾选即记录备齐进度，下次打开还在。",
    feats: [
      "三种场景：家庭备灾、车载应急、户外徒步",
      "数量按人数自动折算，不用自己算",
      "勾选记录备齐进度，进度条实时更新",
      "勾选状态保存在本机，可反复核对",
    ],
    css: ".gtitle{font-size:12px;font-weight:800;color:var(--ink3);margin:14px 0 6px;letter-spacing:.5px}.ck{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:13.5px}.ck input{width:18px;height:18px;flex:0 0 auto;accent-color:var(--a)}.ck .grow{flex:1;min-width:0}.ck .q{font-size:11.5px;color:var(--ink3);font-variant-numeric:tabular-nums;white-space:nowrap}",
    body: `
  <section class="card">
    <div class="row" id="scenes" style="margin-bottom:12px"></div>
    <div class="grid2">
      <div class="field"><label for="ppl">人数</label><input id="ppl" type="number" value="3" min="1"></div>
      <div class="field"><label for="day">保障天数</label><input id="day" type="number" value="3" min="1"></div>
    </div>
    <button class="btn btn-main" id="gen" type="button">生成清单</button>
  </section>
  <section class="card">
    <h2>清单 <small id="pct">0%</small></h2>
    <div class="bar" style="margin-bottom:6px"><i id="bar" style="width:0%"></i></div>
    <div id="list"></div>
  </section>`,
    init: `
  var SCENES=[
    {k:'home',n:'家庭备灾',items:[
      {g:'饮水与食品',list:[['瓶装饮用水','瓶',2,'day'],['压缩饼干 / 罐头','份',1,'day'],['婴儿或老人特需食品','份',1,'day']]},
      {g:'照明与电力',list:[['手电筒','支',1,'ppl'],['备用电池','组',1,'ppl'],['充电宝（满电）','个',1,'ppl'],['蜡烛与打火机','套',1,'']]},
      {g:'医疗与急救',list:[['急救包','个',1,''],['常用处方药','盒',1,'ppl'],['口罩','只',5,'ppl'],['消毒湿巾','包',1,'']]},
      {g:'工具与证件',list:[['多功能刀具','把',1,''],['应急现金','元',300,''],['证件复印件','套',1,'ppl'],['口哨','个',1,'ppl']]},
      {g:'防护',list:[['灭火器','个',1,''],['逃生绳 / 缓降器','套',1,''],['防水袋','个',1,'']]}
    ]},
    {k:'car',n:'车载应急',items:[
      {g:'随车必备',list:[['三角警示牌','个',1,''],['反光背心','件',1,'ppl'],['千斤顶与扳手','套',1,''],['搭电线','套',1,'']]},
      {g:'应急补给',list:[['瓶装水','瓶',2,'ppl'],['高热量零食','份',1,'ppl'],['保温毯','条',1,'ppl'],['充电线与车充','套',1,'']]},
      {g:'医疗与清洁',list:[['车载急救包','个',1,''],['纸巾与垃圾袋','套',1,''],['免洗洗手液','瓶',1,'']]},
      {g:'季节附加',list:[['防滑链 / 沙袋','套',1,''],['遮阳挡','张',1,''],['雨衣','件',1,'ppl']]}
    ]},
    {k:'hike',n:'户外徒步',items:[
      {g:'背负与导航',list:[['登山包（30L 以上）','个',1,'ppl'],['离线地图 / 纸质地图','份',1,''],['指北针','个',1,''],['头灯与备用电池','套',1,'ppl']]},
      {g:'饮水与热量',list:[['饮用水','升',1.5,'ppl'],['电解质片','片',2,'ppl'],['行动粮','份',2,'ppl'],['炉头与气罐','套',1,'']]},
      {g:'衣物与防护',list:[['冲锋衣','件',1,'ppl'],['速干衣裤','套',1,'ppl'],['防晒霜与帽子','套',1,'ppl'],['急救毯','条',1,'ppl']]},
      {g:'安全与救援',list:[['急救包','个',1,''],['哨子','个',1,'ppl'],['绳索（10m）','根',1,''],['创可贴与绷带','套',1,'']]}
    ]}
  ];
  var scene='home';
  var checked=AK.store.get('emergency.checked',{});
  function renderScenes(){
    var box=AK.$('#scenes'); box.innerHTML='';
    SCENES.forEach(function(s){
      var b=document.createElement('button');
      b.type='button'; b.className='chip'+(s.k===scene?' on':''); b.textContent=s.n;
      b.addEventListener('click',function(){ scene=s.k; renderScenes(); render(); });
      box.appendChild(b);
    });
  }
  function render(){
    var s=SCENES.filter(function(x){return x.k===scene;})[0];
    var ppl=AK.n(AK.$('#ppl').value,1)||1, day=AK.n(AK.$('#day').value,1)||1;
    var box=AK.$('#list'); box.innerHTML='';
    var total=0, done=0;
    s.items.forEach(function(g){
      var t=document.createElement('div'); t.className='gtitle'; t.textContent=g.g;
      box.appendChild(t);
      g.list.forEach(function(it){
        var qty = it[3]==='day' ? it[2]*ppl*day : (it[3]==='ppl' ? it[2]*ppl : it[2]);
        var key=scene+'|'+it[0];
        total++;
        var row=document.createElement('label');
        row.className='ck';
        var cb=document.createElement('input');
        cb.type='checkbox'; cb.checked=!!checked[key];
        if(cb.checked) done++;
        cb.addEventListener('change',function(){ checked[key]=cb.checked; AK.store.set('emergency.checked',checked); paint(); });
        var name=document.createElement('div'); name.className='grow'; name.textContent=it[0];
        var q=document.createElement('div'); q.className='q'; q.textContent='× '+(Math.round(qty*10)/10)+' '+(it[1]||'');
        row.appendChild(cb); row.appendChild(name); row.appendChild(q);
        box.appendChild(row);
      });
    });
    AK._total=total; AK._done=done;
    paint();
  }
  function paint(){
    var total=AK._total||0, done=0;
    Object.keys(checked).forEach(function(k){ if(k.indexOf(scene+'|')===0 && checked[k]) done++; });
    var pct=total?Math.round(done/total*100):0;
    AK.$('#bar').style.width=pct+'%';
    AK.$('#pct').textContent=pct+'% · '+done+' / '+total+' 项';
  }
  AK.on('#gen','click',render);
  AK.on('#ppl','input',render);
  AK.on('#day','input',render);
  renderScenes(); render();`,
  },
  {
    name: "1RM 负重估算",
    slug: "1rm-fuzhong",
    cat: "健身",
    icon: "🏋️",
    tagline: "用一组重量推算你的极限",
    theme: ["#c0392b", "#4a0f0a"],
    bg: "#fdf4f3",
    desc: "填一组你刚做过的重量与次数，用 Epley / Brzycki 公式推算单次极限（1RM），并给出各百分比的训练重量表——安排 5×5、3×8 这类计划时直接用。",
    feats: [
      "两种公式可选：Epley 适合多次数，Brzycki 适合低次数",
      "自动生成 65% 到 100% 的配重表",
      "每档标注通常能做的次数，方便排计划",
      "重量按 0.5kg 取整，健身房杠铃片能直接配",
    ],
    css: "table td:last-child{text-align:right;font-weight:800}",
    body: `
  <section class="card">
    <div class="grid2">
      <div class="field"><label for="w">重量（kg）</label><input id="w" type="number" value="60" step="0.5"></div>
      <div class="field"><label for="r">次数（次）</label><input id="r" type="number" value="8" min="1" max="15"></div>
    </div>
    <div class="row" id="formula">
      <button class="chip on" type="button" data-f="epley">Epley</button>
      <button class="chip" type="button" data-f="brzycki">Brzycki</button>
    </div>
    <div class="result" style="margin-top:12px">
      <div class="lbl">推算 1RM</div>
      <div style="font-size:32px;font-weight:900;margin-top:4px" id="orm">—</div>
      <div style="font-size:11.5px;opacity:.8;margin-top:6px" id="note">—</div>
    </div>
  </section>
  <section class="card">
    <h2>配重表 <small>按 1RM 百分比</small></h2>
    <table><thead><tr><th>强度</th><th>重量</th><th>预计次数</th></tr></thead><tbody id="tb"></tbody></table>
  </section>`,
    init: `
  var f='epley';
  var PCT=[[100,1],[95,2],[90,4],[85,6],[80,8],[75,10],[70,12],[65,15],[60,18]];
  function compute(){
    var w=AK.n(AK.$('#w').value,0), r=AK.n(AK.$('#r').value,1);
    if(w<=0||r<=0){ AK.$('#orm').textContent='—'; return; }
    if(r===1){ AK.$('#orm').textContent=w.toFixed(1)+' kg'; }
    else {
      var v = f==='epley' ? w*(1+r/30) : w*36/(37-r);
      AK.$('#orm').textContent=(Math.round(v*2)/2).toFixed(1)+' kg';
    }
    var orm = r===1 ? w : (f==='epley' ? w*(1+r/30) : w*36/(37-r));
    var tb=AK.$('#tb'); tb.innerHTML='';
    PCT.forEach(function(p){
      var kg=Math.round(orm*p[0]/100*2)/2;
      var tr=document.createElement('tr');
      tr.innerHTML='<td>'+p[0]+'%</td><td>'+kg.toFixed(1)+' kg</td><td>'+p[1]+' 次</td>';
      tb.appendChild(tr);
    });
    AK.$('#note').textContent = f==='epley' ? 'Epley：1RM = 重量 ×(1 + 次数/30)' : 'Brzycki：1RM = 重量 × 36 /(37 − 次数)';
  }
  AK.$$('#formula .chip').forEach(function(b){
    b.addEventListener('click',function(){
      f=b.dataset.f;
      AK.$$('#formula .chip').forEach(function(x){ x.className='chip'; });
      b.className='chip on';
      compute();
    });
  });
  AK.on('#w','input',compute);
  AK.on('#r','input',compute);
  compute();`,
  },
  {
    name: "跑鞋里程账本",
    slug: "paoxie-licheng",
    cat: "健身",
    icon: "👟",
    tagline: "每双鞋跑了多少，什么时候该换",
    theme: ["#2563eb", "#0b1f52"],
    bg: "#f1f6ff",
    desc: "给每双跑鞋记上累计里程，跑到上限就标红提醒换鞋。中底缓震一般 500 到 800 公里衰减明显，按自己的跑量算出还能跑多久。",
    feats: [
      "多双鞋分开记账，各自设里程上限",
      "累计里程与剩余里程实时算、进度条显示",
      "超过 80% 标橙、超上限标红并提示更换",
      "全部记录保存在本机，换机前可截图留档",
    ],
    css: ".shoe{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px}.shoe h3{font-size:13.5px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:8px}.shoe h3 .tag{margin-left:auto}.shoe .row input{flex:1;min-width:80px}.warn{border-color:#e8452c;background:#fff7f5}.near{border-color:#f0a020}",
    body: `
  <section class="card">
    <h2>添加跑鞋</h2>
    <div class="grid2">
      <div class="field"><label for="sn">名称</label><input id="sn" placeholder="如 飞马 40"></div>
      <div class="field"><label for="sl">里程上限（km）</label><input id="sl" type="number" value="700"></div>
    </div>
    <button class="btn btn-main" id="add" type="button">加入账本</button>
  </section>
  <section class="card">
    <h2>我的跑鞋 <small id="sum">0 双</small></h2>
    <div id="list"></div>
    <div class="empty" id="empty">还没有记录，先加一双</div>
  </section>`,
    init: `
  var shoes=AK.store.get('shoe.data',[]);
  function save(){ AK.store.set('shoe.data',shoes); }
  function render(){
    var box=AK.$('#list'); box.innerHTML='';
    var totalKm=0;
    shoes.forEach(function(s,i){
      totalKm+=s.km;
      var pct=s.limit?Math.min(100,s.km/s.limit*100):0;
      var cls = pct>=100 ? 'shoe warn' : (pct>=80 ? 'shoe near' : 'shoe');
      var card=document.createElement('div');
      card.className=cls;
      card.innerHTML='<h3>'+AK.esc(s.name)+'<span class="tag">'+s.km.toFixed(1)+' / '+s.limit+' km</span></h3>'+
        '<div class="bar" style="margin-bottom:10px"><i style="width:'+pct.toFixed(1)+'%;background:'+(pct>=100?'#e8452c':(pct>=80?'#f0a020':'linear-gradient(90deg,var(--a),var(--b))'))+'"></i></div>'+
        '<div class="muted" style="margin-bottom:8px">剩余 '+Math.max(0,s.limit-s.km).toFixed(1)+' km'+(pct>=100?' · 建议更换':'')+'</div>';
      var row=document.createElement('div'); row.className='row';
      var inp=document.createElement('input'); inp.type='number'; inp.placeholder='本次公里数'; inp.step='0.1'; inp.min='0';
      var addBtn=document.createElement('button'); addBtn.type='button'; addBtn.className='btn btn-main btn-sm'; addBtn.textContent='+ 记一笔';
      var delBtn=document.createElement('button'); delBtn.type='button'; delBtn.className='btn btn-ghost btn-sm'; delBtn.textContent='删除';
      addBtn.addEventListener('click',function(){
        var d=AK.n(inp.value,0);
        if(d<=0){ AK.toast('填入公里数'); return; }
        shoes[i].km=Math.round((shoes[i].km+d)*10)/10;
        save(); render();
      });
      delBtn.addEventListener('click',function(){
        if(!confirm('删除「'+s.name+'」的记录？')) return;
        shoes.splice(i,1); save(); render();
      });
      row.appendChild(inp); row.appendChild(addBtn); row.appendChild(delBtn);
      card.appendChild(row);
      box.appendChild(card);
    });
    AK.$('#empty').style.display=shoes.length?'none':'';
    AK.$('#sum').textContent=shoes.length+' 双 · 累计 '+totalKm.toFixed(1)+' km';
  }
  AK.on('#add','click',function(){
    var n=(AK.$('#sn').value||'').trim();
    var l=AK.n(AK.$('#sl').value,700);
    if(!n){ AK.toast('先给鞋起个名字'); return; }
    if(l<=0) l=700;
    shoes.push({name:n,limit:l,km:0});
    AK.$('#sn').value='';
    save(); render(); AK.toast('已加入');
  });
  render();`,
  },
  {
    name: "蛋白质摄入计算",
    slug: "danbaizhi-sheru",
    cat: "健身",
    icon: "🥚",
    tagline: "一天吃多少蛋白，按体重算给你",
    theme: ["#e8871e", "#5c2a00"],
    bg: "#fff9f0",
    desc: "按体重、目标（维持 / 增肌 / 减脂）和训练频率，算出每日蛋白质建议区间，并折算成每餐克数和常见食物的等效份量，不用再记系数。",
    feats: [
      "按体重与目标给出每日蛋白区间（克）",
      "自动折算成三到五餐的每餐克数",
      "给出鸡蛋、鸡胸、牛奶、豆腐的等效份量",
      "附饮水与总热量参考，结果自动保存",
    ],
    css: "",
    body: `
  <section class="card">
    <div class="grid2">
      <div class="field"><label for="bw">体重（kg）</label><input id="bw" type="number" value="65" step="0.5"></div>
      <div class="field"><label for="meal">每天餐数</label><input id="meal" type="number" value="4" min="1" max="6"></div>
    </div>
    <div class="row" id="goals" style="margin-bottom:12px">
      <button class="chip on" type="button" data-g="keep">维持</button>
      <button class="chip" type="button" data-g="gain">增肌</button>
      <button class="chip" type="button" data-g="cut">减脂</button>
    </div>
    <div class="field"><label for="freq">每周训练次数</label><input id="freq" type="number" value="3" min="0" max="7"></div>
    <button class="btn btn-main" id="calc" type="button">计算</button>
  </section>
  <section class="card">
    <h2>每日建议 <small id="goalname">维持</small></h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">蛋白质</div>
      <div style="font-size:30px;font-weight:900;margin-top:4px" id="p">—</div>
      <div style="font-size:11.5px;opacity:.82;margin-top:6px" id="per">每餐 —</div>
    </div>
    <div id="foods"></div>
  </section>`,
    init: `
  var goal='keep';
  var FACTOR={keep:[1.2,1.6],gain:[1.6,2.0],cut:[1.8,2.2]};
  var NAME={keep:'维持',gain:'增肌',cut:'减脂'};
  var FOODS=[['鸡蛋','个','6g 蛋白',6],['鸡胸肉','100g','31g 蛋白',31],['牛奶','250ml','8g 蛋白',8],['北豆腐','100g','12g 蛋白',12],['希腊酸奶','100g','10g 蛋白',10]];
  function run(){
    var bw=AK.n(AK.$('#bw').value,0);
    var meals=AK.n(AK.$('#meal').value,4)||4;
    var freq=AK.n(AK.$('#freq').value,3);
    if(bw<=0){ AK.toast('填一下体重'); return; }
    var f=FACTOR[goal];
    var lo=bw*f[0], hi=bw*f[1];
    if(freq>=5){ lo*=1.05; hi*=1.1; }
    AK.$('#p').textContent=Math.round(lo)+' — '+Math.round(hi)+' g';
    AK.$('#per').textContent='每餐约 '+Math.round(lo/meals)+' — '+Math.round(hi/meals)+' g · 每天 '+meals+' 餐';
    AK.$('#goalname').textContent=NAME[goal];
    var html='';
    FOODS.forEach(function(x){
      var need=Math.round(lo*0.4/x[3]*10)/10;
      html+='<div class="kv"><span>'+x[0]+'（'+x[2]+'）</span><b>约 '+need+' '+x[1]+'</b></div>';
    });
    html+='<p class="muted" style="margin-top:10px">上面按占每日下限的 40% 估算，不是一次吃完。蛋白尽量分到每餐，单餐 20 到 40g 吸收效率最好。</p>';
    AK.$('#foods').innerHTML=html;
    AK.store.set('protein.cfg',{bw:bw,meals:meals,freq:freq,goal:goal});
  }
  AK.$$('#goals .chip').forEach(function(b){
    b.addEventListener('click',function(){
      goal=b.dataset.g;
      AK.$$('#goals .chip').forEach(function(x){ x.className='chip'; });
      b.className='chip on';
      run();
    });
  });
  AK.on('#calc','click',run);
  var saved=AK.store.get('protein.cfg',null);
  if(saved){
    AK.$('#bw').value=String(saved.bw); AK.$('#meal').value=String(saved.meals); AK.$('#freq').value=String(saved.freq);
    goal=saved.goal||'keep';
    AK.$$('#goals .chip').forEach(function(x){ x.className = x.dataset.g===goal ? 'chip on' : 'chip'; });
  }
  run();`,
  },
  {
    name: "健身房器械指南",
    slug: "jianshen-qixie-zhinan",
    cat: "健身",
    icon: "⚙️",
    tagline: "器械怎么用、练哪里、别做错什么",
    theme: ["#475569", "#1a2230"],
    bg: "#f5f7fa",
    desc: "把健身房常见的十几件器械讲清楚：主要练哪块肌肉、怎么调座位、动作要点、最容易犯的错。第一次进健身房也能照着用。",
    feats: [
      "十四件常见器械，按部位筛选",
      "每件写清目标肌群、调节方式与动作要点",
      "标注常见错误，避免代偿受伤",
      "支持关键词搜索，找不到直接输入名字",
    ],
    css: ".gcard{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px}.gcard h3{font-size:13.5px;font-weight:800;margin-bottom:4px}.gcard .m{font-size:11.5px;color:var(--a);font-weight:700;margin-bottom:8px}.gcard ul{margin:0 0 8px 16px;font-size:12.5px;line-height:1.8;color:var(--ink2)}.gcard .err{font-size:12px;color:#c0392b;background:#fdeaea;border-radius:8px;padding:8px 10px;line-height:1.7}",
    body: `
  <section class="card">
    <div class="row" id="parts" style="margin-bottom:10px"></div>
    <input id="q" placeholder="搜索器械名或肌群，如 背、腿、推胸" style="margin-bottom:4px">
  </section>
  <section class="card">
    <h2>器械 <small id="cnt">14 件</small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var DATA=[
    {n:'坐姿推胸机',p:'胸',m:'胸大肌、前三角、肱三头',tips:['把手调到与肩同高，背贴靠垫','推到底不要锁死肘关节','下放 3 秒控制，别让配重片砸响'],err:'耸肩推、腰离开靠垫，容易把力转到肩颈'},
    {n:'蝴蝶机夹胸',p:'胸',m:'胸大肌内侧',tips:['肘部微屈固定角度','夹到胸前停一秒','重量宜轻，追求收缩感'],err:'用手臂发力甩，肩关节前侧容易痛'},
    {n:'高位下拉',p:'背',m:'背阔肌、大圆肌、肱二头',tips:['握距略宽于肩，先沉肩再下拉','拉到锁骨上方即可','下放时让背阔充分伸展'],err:'身体大幅后仰借力，变成划船'},
    {n:'坐姿划船机',p:'背',m:'中背、菱形肌、肱二头',tips:['胸口贴垫，肘部贴身向后拉','肩胛先收紧再拉手','回放要慢，不要让配重拉着走'],err:'含胸弓背拉，腰先累'},
    {n:'腿举机',p:'腿',m:'股四头、臀大肌、腘绳肌',tips:['脚掌全掌踩实，与肩同宽','下放到膝盖约 90 度','蹬起时膝盖不要完全锁死'],err:'下放过深使腰离垫，腰椎受压'},
    {n:'腿屈伸机',p:'腿',m:'股四头（尤其股直肌）',tips:['膝关节对准转轴','伸到顶停一秒','重量轻、次数多更安全'],err:'甩腿借力，膝关节负担大'},
    {n:'腿弯举机',p:'腿',m:'腘绳肌',tips:['髋部贴紧垫子不要抬起','卷到最紧停一秒','下放慢速控制'],err:'腰代偿拱起，练完腰酸腿没感觉'},
    {n:'史密斯机深蹲',p:'腿',m:'股四头、臀、核心',tips:['脚比肩略宽，脚尖略外八','杠铃轨迹对准足中','下蹲到大腿接近平行'],err:'膝盖内扣，重心跑到脚尖'},
    {n:'坐姿肩推机',p:'肩',m:'三角肌前中束、肱三头',tips:['背贴靠垫，核心收紧','肘部略在身体前方','推起时不要顶腰'],err:'过度挺腰变成上斜推胸'},
    {n:'侧平举哑铃',p:'肩',m:'三角肌中束',tips:['小重量、肘微屈','抬到与肩平即可','想象用肘带着手往上'],err:'耸肩甩到 90 度以上，斜方肌抢力'},
    {n:'绳索下压',p:'手臂',m:'肱三头肌',tips:['大臂夹紧身体固定','压到底收紧一秒','回放时控制，不要让绳子拉走'],err:'大臂前后晃，变成推的动作'},
    {n:'牧师凳弯举',p:'手臂',m:'肱二头肌',tips:['腋下贴住斜垫','下放到底但不完全伸直','重量宁轻不重'],err:'下放过快，肘部受剪切力'},
    {n:'髋外展机',p:'臀',m:'臀中肌、臀小肌',tips:['上身略前倾，臀更有感觉','开合幅度不用追求最大','回位慢，不让配重撞响'],err:'用腰发力后仰'},
    {n:'划船机（有氧）',p:'有氧',m:'全身，重点背与腿',tips:['顺序：腿—背—手，回程反过来','每分钟 20 到 24 桨是常用节奏','背保持中立不要弓'],err:'只用手臂拉，几下就累且伤腰'}
  ];
  var part='全部', q='';
  function parts(){
    var box=AK.$('#parts'); box.innerHTML='';
    var list=['全部','胸','背','腿','肩','手臂','臀','有氧'];
    list.forEach(function(p){
      var b=document.createElement('button');
      b.type='button'; b.className='chip'+(p===part?' on':''); b.textContent=p;
      b.addEventListener('click',function(){ part=p; parts(); render(); });
      box.appendChild(b);
    });
  }
  function render(){
    var box=AK.$('#list'); box.innerHTML='';
    var rows=DATA.filter(function(d){
      if(part!=='全部' && d.p!==part) return false;
      if(!q) return true;
      return (d.n+d.p+d.m).indexOf(q)>=0;
    });
    AK.$('#cnt').textContent=rows.length+' 件';
    if(!rows.length){ box.innerHTML='<div class="empty">没找到，换个词试试</div>'; return; }
    rows.forEach(function(d){
      var card=document.createElement('div');
      card.className='gcard';
      var tips=d.tips.map(function(t){ return '<li>'+AK.esc(t)+'</li>'; }).join('');
      card.innerHTML='<h3>'+AK.esc(d.n)+'</h3><div class="m">'+AK.esc(d.p)+' · '+AK.esc(d.m)+'</div><ul>'+tips+'</ul><div class="err">常见错误：'+AK.esc(d.err)+'</div>';
      box.appendChild(card);
    });
  }
  AK.on('#q','input',function(){ q=(AK.$('#q').value||'').trim(); render(); });
  parts(); render();`,
  },
  {
    name: "野外方向辨识",
    slug: "yewai-fangxiang",
    cat: "户外",
    icon: "🧭",
    tagline: "看太阳和影子，算出东南西北",
    theme: ["#0f766e", "#093b36"],
    bg: "#f0fbf9",
    desc: "输入纬度、日期和时间，算出太阳高度角与方位角，直接告诉你影子指向哪个方向；再配手表法与北极星法，没带指南针也能定方向。",
    feats: [
      "按纬度、日期、时刻计算太阳方位角与高度角",
      "直接给出影子指向（方位角加 180 度）",
      "附北半球手表法与夜间北极星定位步骤",
      "结果含方位文字（东、东南、南等）便于判断",
    ],
    css: ".dir{font-size:34px;font-weight:900;letter-spacing:1px}",
    body: `
  <section class="card">
    <div class="grid2">
      <div class="field"><label for="lat">纬度（北纬为正）</label><input id="lat" type="number" value="39.9" step="0.1"></div>
      <div class="field"><label for="date">日期</label><input id="date" type="date"></div>
    </div>
    <div class="field"><label for="time">当地时间</label><input id="time" type="time" value="10:00"></div>
    <button class="btn btn-main" id="calc" type="button">计算方位</button>
  </section>
  <section class="card">
    <h2>计算结果 <small id="hint">按真太阳时近似</small></h2>
    <div class="result">
      <div class="lbl">影子指向</div>
      <div class="dir" id="dir">—</div>
      <div style="font-size:12px;opacity:.85;margin-top:6px" id="ang">—</div>
    </div>
    <div style="margin-top:12px">
      <div class="kv"><span>太阳高度角</span><b id="alt">—</b></div>
      <div class="kv"><span>太阳方位角（从北顺时针）</span><b id="azi">—</b></div>
      <div class="kv"><span>日出方位参考</span><b id="rise">—</b></div>
    </div>
  </section>
  <section class="card">
    <h2>没有太阳时</h2>
    <div class="kv"><span>手表法（北半球）</span><b>时针对太阳，角平分线指南</b></div>
    <div class="kv"><span>北极星法</span><b>北斗七星斗口两星连线延长 5 倍</b></div>
    <div class="kv"><span>树木与雪</span><b>北侧苔藓多、雪化得慢</b></div>
    <p class="muted" style="margin-top:10px">手表法用当地时间，夏令时需先减一小时；南半球把指南改指北。</p>
  </section>`,
    init: `
  var dirs=['北','东北偏北','东北','东北偏东','东','东南偏东','东南','东南偏南','南','西南偏南','西南','西南偏西','西','西北偏西','西北','西北偏北'];
  function dirName(deg){
    var d=((deg%360)+360)%360;
    var i=Math.round(d/22.5)%16;
    return dirs[i];
  }
  function run(){
    var lat=AK.n(AK.$('#lat').value,39.9);
    var dv=AK.$('#date').value || AK.ymd(new Date());
    var tv=AK.$('#time').value || '10:00';
    var d=new Date(dv+'T00:00:00');
    if(isNaN(d.getTime())){ AK.toast('日期格式不对'); return; }
    var hour=AK.n(tv.split(':')[0],10), min=AK.n(tv.split(':')[1],0);
    var t=hour+min/60;
    var start=new Date(d.getFullYear(),0,0);
    var N=Math.floor((d-start)/86400000);
    var dec=23.44*Math.sin(2*Math.PI*(284+N)/365);
    var H=(t-12)*15;
    var rad=Math.PI/180;
    var phi=lat*rad, dd=dec*rad, hh=H*rad;
    var sinAlt=Math.sin(phi)*Math.sin(dd)+Math.cos(phi)*Math.cos(dd)*Math.cos(hh);
    var alt=Math.asin(Math.max(-1,Math.min(1,sinAlt)))/rad;
    if(alt<0){
      AK.$('#dir').textContent='太阳在地平线下';
      AK.$('#ang').textContent='这个时刻看不到太阳和影子，改用北极星或地标判断';
      AK.$('#alt').textContent=alt.toFixed(1)+'°';
      AK.$('#azi').textContent='—';
      AK.$('#rise').textContent=dec>0?'东北升起、西北落下':'东南升起、西南落下';
      return;
    }
    var cosA=(Math.sin(dd)-Math.sin(phi)*sinAlt)/(Math.cos(phi)*Math.cos(alt*rad));
    var A=Math.acos(Math.max(-1,Math.min(1,cosA)))/rad;
    if(H>0) A=360-A;
    var shadow=(A+180)%360;
    AK.$('#alt').textContent=alt.toFixed(1)+'°';
    AK.$('#azi').textContent=A.toFixed(1)+'°（'+dirName(A)+'）';
    AK.$('#dir').textContent='影子朝 '+dirName(shadow);
    AK.$('#ang').textContent='影长约为物高的 '+(1/Math.tan(alt*rad)).toFixed(2)+' 倍 · 影子方位角 '+shadow.toFixed(1)+'°';
    AK.$('#rise').textContent=dec>0?'东北升起、西北落下':'东南升起、西南落下';
    AK.store.set('orient.cfg',{lat:lat,date:dv,time:tv});
  }
  AK.on('#calc','click',run);
  var cfg=AK.store.get('orient.cfg',null);
  if(cfg){ AK.$('#lat').value=String(cfg.lat); AK.$('#date').value=cfg.date; AK.$('#time').value=cfg.time; }
  else AK.$('#date').value=AK.ymd(new Date());
  run();`,
  },
];
