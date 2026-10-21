/* 第二批替换 · 7 个游戏
   线上已有：2048 / 贪吃蛇 / 扫雷 / 五子棋 AI / 记忆翻牌 / 打字测速 / 反应力测试，
   这里全部换成本站没有的玩法。 */
export default [
  {
    name: "井字棋三连",
    slug: "jingziqi-sanlian",
    cat: "游戏",
    icon: "⭕",
    tagline: "九宫格三连，电脑一步不让",
    theme: ["#3d6ef5", "#1b2a6b"],
    bg: "#f2f5ff",
    desc: "经典井字棋，你执 X 先走，电脑用极小化极大搜索应招：只要它能挡住就一定挡，能赢就一定赢。想赢只有先抢正中再展开双杀。记录胜平负战绩，保存在本机。",
    feats: [
      "3×3 棋盘，点击落子，电脑即时应招",
      "电脑走极小化极大搜索，不会送子",
      "胜局连线高亮，胜 / 平 / 负分别统计",
      "一键重开，战绩永久保存在本机",
    ],
    css: ".t3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin:0 auto}.t3 button{aspect-ratio:1;font-size:36px;font-weight:900;border:1px solid var(--line);background:#fff;border-radius:12px;color:var(--ink);cursor:pointer;font-family:inherit;transition:.12s}.t3 button:active{transform:scale(.97)}.t3 button.x{color:#2563eb}.t3 button.o{color:#e8452c}.t3 button.win{background:rgba(91,110,245,.12);border-color:var(--a)}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <span id="st" style="font-weight:800;font-size:13.5px">你执 X，先走</span>
      <button class="btn btn-ghost btn-sm" id="rs" type="button">重开</button>
    </div>
    <div class="t3" id="bd"></div>
  </section>
  <section class="card">
    <h2>战绩 <small>保存在本机</small></h2>
    <div class="grid3">
      <div><div class="muted">胜</div><div class="big" id="w">0</div></div>
      <div><div class="muted">平</div><div class="big" id="d">0</div></div>
      <div><div class="muted">负</div><div class="big" id="l">0</div></div>
    </div>
    <p class="muted" style="margin-top:10px">电脑会堵死所有威胁，赢它的唯一办法是同时造出两条必胜线。</p>
  </section>`,
    init: `
  var LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  var bd=AK.$('#bd'), st=AK.$('#st'), rec=AK.store.get('t3.stat',{w:0,d:0,l:0});
  var cells=[], b, over, lock;
  function paintRec(){ AK.$('#w').textContent=rec.w; AK.$('#d').textContent=rec.d; AK.$('#l').textContent=rec.l; }
  function winner(brd){
    for(var i=0;i<8;i++){ var w=LINES[i]; if(brd[w[0]] && brd[w[0]]===brd[w[1]] && brd[w[1]]===brd[w[2]]) return {p:brd[w[0]],line:w}; }
    return brd.indexOf('')<0 ? {p:'-',line:[]} : null;
  }
  function scoreOf(brd, deep){
    for(var i=0;i<8;i++){ var w=LINES[i]; if(brd[w[0]] && brd[w[0]]===brd[w[1]] && brd[w[1]]===brd[w[2]]) return brd[w[0]]==='O' ? 10-deep : deep-10; }
    return brd.indexOf('')<0 ? 0 : null;
  }
  function bestMove(brd){
    var bestS=-99, mv=-1;
    for(var i=0;i<9;i++){
      if(brd[i]) continue;
      brd[i]='O';
      var s=minimax(brd,'X',1);
      brd[i]='';
      if(s>bestS){ bestS=s; mv=i; }
    }
    return mv<0 ? 0 : mv;
  }
  function minimax(brd, who, deep){
    var sc=scoreOf(brd,deep);
    if(sc!==null) return sc;
    var bs= who==='O' ? -99 : 99;
    for(var i=0;i<9;i++){
      if(brd[i]) continue;
      brd[i]=who;
      var v=minimax(brd, who==='O'?'X':'O', deep+1);
      brd[i]='';
      if(who==='O' ? v>bs : v<bs) bs=v;
    }
    return bs;
  }
  function draw(){
    for(var i=0;i<9;i++){ cells[i].textContent=b[i]; cells[i].className = b[i]==='X'?'x':(b[i]==='O'?'o':''); }
  }
  function end(r){
    over=true;
    for(var i=0;i<r.line.length;i++) cells[r.line[i]].className += ' win';
    if(r.p==='X'){ rec.w++; st.textContent='你赢了'; }
    else if(r.p==='O'){ rec.l++; st.textContent='电脑赢了'; }
    else { rec.d++; st.textContent='平局，再来一局'; }
    AK.store.set('t3.stat',rec); paintRec();
  }
  function tap(e){
    if(over||lock) return;
    var i=Number(e.currentTarget.dataset.i);
    if(b[i]) return;
    b[i]='X'; draw();
    var r=winner(b); if(r){ end(r); return; }
    lock=true; st.textContent='电脑思考中…';
    setTimeout(function(){
      b[bestMove(b)]='O'; draw(); lock=false;
      var r2=winner(b); if(r2){ end(r2); return; }
      st.textContent='轮到你了，执 X';
    },160);
  }
  function reset(){
    b=['','','','','','','','','']; over=false; lock=false;
    bd.innerHTML=''; cells=[];
    for(var i=0;i<9;i++){
      var el=document.createElement('button');
      el.type='button'; el.dataset.i=String(i);
      el.addEventListener('click',tap);
      bd.appendChild(el); cells.push(el);
    }
    st.textContent='你执 X，先走'; paintRec();
  }
  AK.on('#rs','click',reset);
  reset();`,
  },
  {
    name: "水排序",
    slug: "shui-paixu",
    cat: "游戏",
    icon: "🧪",
    tagline: "把同色倒进一个瓶子，五个关卡",
    theme: ["#2f9bd8", "#0d3f63"],
    bg: "#f1f9ff",
    desc: "试管倒水谜题：每瓶最多装 4 层颜色，把同一颜色归到同一个瓶子里就算过关。只能倒进空瓶或与顶端同色的瓶子，倒一次可以带走整段同色的水。五关递进，卡住可撤销一步。",
    feats: [
      "五关递进，从两种颜色到六种颜色",
      "点击两瓶即可倾倒，整段同色一次带走",
      "可撤销上一步、可重开本关，不会卡死",
      "通关后解锁下一关，进度保存在本机",
    ],
    css: ".bottles{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:6px 0}.bt{width:52px;height:170px;border:2px solid #cfd8ea;border-radius:8px 8px 20px 20px;display:flex;flex-direction:column-reverse;padding:5px;gap:3px;cursor:pointer;background:#fbfdff;transition:.15s}.bt.sel{border-color:var(--a);box-shadow:0 0 0 3px rgba(47,155,216,.2);transform:translateY(-4px)}.bt .u{height:34px;border-radius:6px}.bt .u.e{background:#eef2f9}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <div><div class="muted">当前关卡</div><div class="big" id="lv">1</div></div>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="undo" type="button">撤销</button>
        <button class="btn btn-ghost btn-sm" id="reset" type="button">重开本关</button>
        <button class="btn btn-main btn-sm" id="next" type="button" disabled>下一关</button>
      </div>
    </div>
    <div class="bottles" id="bt"></div>
    <p class="muted" style="margin-top:12px">点一瓶拿起最上面的颜色，再点另一瓶倒进去。只能倒进空瓶或同色顶端，单瓶最多 4 层。</p>
  </section>`,
    init: `
  var COLORS=['#e8452c','#f2b01e','#2ea44f','#2f7bf5','#8a4bd6','#0f9d8f'];
  var LEVELS=[
    [[0,1,0,1],[1,0,1,0],[],[]],
    [[0,1,2,0],[1,2,0,1],[2,0,1,2],[],[]],
    [[0,1,2,3],[1,2,3,0],[2,3,0,1],[3,0,1,2],[],[]],
    [[0,1,2,3],[4,0,1,2],[3,4,0,1],[2,3,4,0],[1,2,3,4],[],[]],
    [[0,1,2,3],[1,2,3,4],[2,3,4,5],[3,4,5,0],[4,5,0,1],[5,0,1,2],[],[]]
  ];
  var lv=0, state=[], sel=-1, hist=[];
  var box=AK.$('#bt');
  function clone(arr){ return arr.map(function(b){ return b.slice(); }); }
  function load(n){
    lv=n; state=clone(LEVELS[n]); sel=-1; hist=[];
    AK.$('#lv').textContent=String(n+1);
    AK.$('#next').disabled=true;
    render();
  }
  function render(){
    box.innerHTML='';
    for(var i=0;i<state.length;i++){
      var b=state[i];
      var el=document.createElement('div');
      el.className='bt'+(sel===i?' sel':'');
      el.dataset.i=String(i);
      for(var k=0;k<4;k++){
        var u=document.createElement('div');
        u.className='u'+(b[k]===undefined?' e':'');
        if(b[k]!==undefined) u.style.background=COLORS[b[k]];
        el.appendChild(u);
      }
      el.addEventListener('click',function(e){ pick(Number(e.currentTarget.dataset.i)); });
      box.appendChild(el);
    }
  }
  function solved(){
    for(var i=0;i<state.length;i++){
      var b=state[i];
      if(!b.length) continue;
      if(b.length!==4) return false;
      for(var k=1;k<b.length;k++) if(b[k]!==b[0]) return false;
    }
    return true;
  }
  function pick(i){
    if(sel<0){ if(!state[i].length){ AK.toast('这瓶是空的'); return; } sel=i; render(); return; }
    if(sel===i){ sel=-1; render(); return; }
    var A=state[sel], B=state[i];
    if(!A.length){ sel=-1; render(); return; }
    var c=A[A.length-1], run=0;
    for(var k=A.length-1;k>=0;k--){ if(A[k]===c) run++; else break; }
    if(B.length && B[B.length-1]!==c){ AK.toast('只能倒进空瓶或同色'); sel=i; render(); return; }
    var space=4-B.length;
    if(space<=0){ AK.toast('这瓶满了'); sel=-1; render(); return; }
    hist.push(clone(state));
    var move=Math.min(run,space);
    for(var m=0;m<move;m++) B.push(A.pop());
    sel=-1; render();
    if(solved()){
      AK.$('#next').disabled=lv>=LEVELS.length-1;
      AK.toast(lv>=LEVELS.length-1 ? '全部通关，厉害' : '过关，点下一关');
    }
  }
  AK.on('#undo','click',function(){
    if(!hist.length){ AK.toast('没有可撤销的步'); return; }
    state=hist.pop(); sel=-1; AK.$('#next').disabled=true; render();
  });
  AK.on('#reset','click',function(){ load(lv); });
  AK.on('#next','click',function(){ if(lv<LEVELS.length-1) load(lv+1); });
  load(0);`,
  },
  {
    name: "数字猜心",
    slug: "shuzi-caixin",
    cat: "游戏",
    icon: "🔢",
    tagline: "四位不重复的数字，几次能猜中",
    theme: ["#6d5bd0", "#2a1d6b"],
    bg: "#f6f4ff",
    desc: "系统心里想一个四位不重复的数字，你每次猜一组，系统回你 A / B：A 是数字和位置都对，B 是数字对但位置错。靠逻辑在十次内锁定答案，最少次数记录在本机。",
    feats: [
      "四位数字不重复，A / B 双重反馈",
      "每次猜测倒序留档，方便回看推理过程",
      "十次未中自动给出答案，不会卡在死局",
      "最少猜中次数与总局数保存在本机",
    ],
    css: "",
    body: `
  <section class="card">
    <label for="g">输入 4 位不重复的数字</label>
    <div class="row" style="margin-top:6px">
      <input id="g" inputmode="numeric" maxlength="4" placeholder="例如 1234" style="flex:1;min-width:130px" autocomplete="off">
      <button class="btn btn-main" id="ok" type="button">猜</button>
    </div>
    <p class="muted" id="hint" style="margin-top:10px">A = 数字和位置都对，B = 数字对但位置不对。0 也可以出现。</p>
  </section>
  <section class="card">
    <h2>猜测记录 <small id="cnt">0 次</small></h2>
    <div id="list"></div>
    <div class="empty" id="empty">还没有开始猜，随便输四位数字试试</div>
  </section>
  <section class="card">
    <h2>战绩 <small>保存在本机</small></h2>
    <div class="grid2">
      <div><div class="muted">最少猜中</div><div class="big" id="best">—</div></div>
      <div><div class="muted">已玩局数</div><div class="big" id="plays">0</div></div>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" id="again" type="button">换一局</button></div>
  </section>`,
    init: `
  var rec=AK.store.get('guess.stat',{best:0,plays:0});
  var secret='', tries=0;
  function pick(){
    var pool=[0,1,2,3,4,5,6,7,8,9], out=[];
    for(var i=0;i<4;i++) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    return out.join('');
  }
  function paint(){
    AK.$('#best').textContent = rec.best ? rec.best+' 次' : '—';
    AK.$('#plays').textContent = String(rec.plays);
  }
  function judge(v){
    var a=0,b=0;
    for(var i=0;i<4;i++){
      if(v.charAt(i)===secret.charAt(i)) a++;
      else if(secret.indexOf(v.charAt(i))>=0) b++;
    }
    return {a:a,b:b};
  }
  function newGame(){
    secret=pick(); tries=0;
    AK.$('#g').value=''; AK.$('#list').innerHTML='';
    AK.$('#empty').style.display='';
    AK.$('#cnt').textContent='0 次';
    AK.$('#hint').textContent='新的一局，四位数字不重复。';
    paint(); AK.$('#g').focus();
  }
  function submit(){
    var v=(AK.$('#g').value||'').replace(/\\s/g,'');
    if(!/^[0-9]{4}$/.test(v)){ AK.toast('请输入 4 位数字'); return; }
    if(v.charAt(0)===v.charAt(1)||v.charAt(0)===v.charAt(2)||v.charAt(0)===v.charAt(3)||v.charAt(1)===v.charAt(2)||v.charAt(1)===v.charAt(3)||v.charAt(2)===v.charAt(3)){ AK.toast('四位数字不能重复'); return; }
    tries++;
    var r=judge(v);
    var item=document.createElement('div');
    item.className='item';
    item.innerHTML='<div class="grow"><div class="t">'+AK.esc(v)+'</div><div class="s">'+r.a+'A '+r.b+'B</div></div><span class="tag">第 '+tries+' 次</span>';
    AK.$('#list').insertBefore(item, AK.$('#list').firstChild);
    AK.$('#empty').style.display='none';
    AK.$('#cnt').textContent=tries+' 次';
    AK.$('#g').value='';
    if(r.a===4){
      rec.plays++;
      if(!rec.best || tries<rec.best) rec.best=tries;
      AK.store.set('guess.stat',rec); paint();
      AK.$('#hint').innerHTML='<b>猜中了</b>，答案就是 '+secret+'，你用了 '+tries+' 次。';
      AK.toast('猜中，'+tries+' 次');
      return;
    }
    if(tries>=10){
      AK.$('#hint').textContent='十次没中，答案是 '+secret+'。点「换一局」继续。';
      return;
    }
    AK.$('#hint').textContent='A 越多越接近，继续。';
  }
  AK.on('#ok','click',submit);
  AK.on('#g','keydown',function(e){ if(e.key==='Enter') submit(); });
  AK.on('#again','click',newGame);
  newGame();`,
  },
  {
    name: "记忆序列",
    slug: "jiyi-xulie",
    cat: "游戏",
    icon: "💡",
    tagline: "四盏灯依次亮起，照着顺序按回来",
    theme: ["#e8871e", "#7a2f00"],
    bg: "#fff8f1",
    desc: "记忆灯序游戏：四块灯板依次亮起，你要按同样的顺序点一遍。每对一次序列加一位，越往后越长。测的是工作记忆容量，大多数人能撑到 7 到 9 位。",
    feats: [
      "四块灯板随机亮，长度逐轮递增",
      "按对加一位，按错立即结束并记录长度",
      "最高记录保存在本机，可反复刷新",
      "纯色高对比，手机单手也能玩",
    ],
    css: ".simon{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:320px;margin:0 auto}.p{aspect-ratio:1;border:none;border-radius:18px;opacity:.5;cursor:pointer;transition:.12s;box-shadow:0 4px 14px rgba(20,26,43,.14)}.p.on{opacity:1;transform:scale(.96);box-shadow:0 0 0 5px rgba(255,255,255,.7) inset}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <div><div class="muted">当前序列长度</div><div class="big" id="lv">0</div></div>
      <div style="text-align:right"><div class="muted">最高记录</div><div class="big" id="best">0</div></div>
    </div>
    <div class="simon" id="pad"></div>
    <div class="row" style="margin-top:14px">
      <button class="btn btn-main btn-sm" id="start" type="button">开始 / 重来</button>
      <span class="muted" id="st">点开始，记住亮起的顺序</span>
    </div>
  </section>`,
    init: `
  var COLORS=['#2f7bf5','#e8452c','#2ea44f','#f2b01e'];
  var pad=AK.$('#pad'), st=AK.$('#st');
  var seq=[], idx=0, busy=false, timer=null;
  var best=AK.store.get('simon.best',0);
  for(var i=0;i<4;i++){
    (function(k){
      var d=document.createElement('button');
      d.type='button'; d.className='p'; d.style.background=COLORS[k];
      d.addEventListener('click',function(){ hit(k); });
      pad.appendChild(d);
    })(i);
  }
  AK.$('#best').textContent=String(best);
  function flash(k,ms){
    var el=pad.children[k];
    el.className='p on';
    setTimeout(function(){ el.className='p'; }, ms);
  }
  function play(){
    busy=true; idx=0; st.textContent='看好了…';
    var i=0;
    function step(){
      if(i>=seq.length){ busy=false; st.textContent='轮到你了，按顺序点'; return; }
      flash(seq[i],360); i++;
      timer=setTimeout(step,540);
    }
    timer=setTimeout(step,420);
  }
  function grow(){
    seq.push(Math.floor(Math.random()*4));
    AK.$('#lv').textContent=String(seq.length);
    play();
  }
  function hit(k){
    if(busy || !seq.length) return;
    flash(k,170);
    if(seq[idx]!==k){
      var got=seq.length-1;
      if(got>best){ best=got; AK.store.set('simon.best',best); AK.$('#best').textContent=String(best); }
      st.textContent='按错了，这一轮撑到 '+seq.length+' 位';
      AK.toast('错了，长度 '+seq.length);
      seq=[]; idx=0; AK.$('#lv').textContent='0';
      return;
    }
    idx++;
    if(idx>=seq.length){
      if(seq.length>best){ best=seq.length; AK.store.set('simon.best',best); AK.$('#best').textContent=String(best); }
      st.textContent='对了，加一位';
      setTimeout(grow,700);
    }
  }
  AK.on('#start','click',function(){
    clearTimeout(timer);
    seq=[]; idx=0; busy=false;
    AK.$('#lv').textContent='0';
    grow();
  });`,
  },
  {
    name: "emoji 猜词",
    slug: "emoji-caici",
    cat: "游戏",
    icon: "🧩",
    tagline: "三五个表情，猜一个四字成语",
    theme: ["#d94f8a", "#5c1236"],
    bg: "#fff5f9",
    desc: "看 emoji 组合猜四字成语。每轮二十题，四选一，连对会加成分数。题目都是常见成语，考的是联想而不是死记。",
    feats: [
      "24 组 emoji 谜面，每轮随机抽 20 题",
      "四选一，答错立刻标出正确答案",
      "连对加减成，得分与答对数分开统计",
      "最高分保存在本机，可随时重开一轮",
    ],
    css: ".emoji{font-size:50px;text-align:center;letter-spacing:5px;line-height:1.55;padding:12px 0 14px}.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.opts button{border:1px solid var(--line);background:#fff;border-radius:12px;padding:14px 8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--ink);transition:.12s}.opts button.ok{background:#e8f7ee;border-color:#2ea44f;color:#1c7c3c}.opts button.no{background:#fdeaea;border-color:#e8452c;color:#c0392b}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:6px">
      <span class="tag" id="prog">第 1 / 20 题</span>
      <span class="tag" id="score">得分 0</span>
    </div>
    <div class="emoji" id="clue">🧩</div>
    <div class="opts" id="opts"></div>
  </section>
  <section class="card">
    <h2>本轮 <small id="fb">选一个答案</small></h2>
    <div class="grid2">
      <div><div class="muted">答对</div><div class="big" id="right">0</div></div>
      <div><div class="muted">连对</div><div class="big" id="streak">0</div></div>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" id="restart" type="button">重新开始</button></div>
  </section>`,
    init: `
  var DATA=[
    {e:'🐍➕🦶',a:'画蛇添足'},{e:'🐸🕳️👀',a:'井底之蛙'},{e:'🌳🐇⏰',a:'守株待兔'},
    {e:'🐑❌🔒',a:'亡羊补牢'},{e:'🙉🔔',a:'掩耳盗铃'},{e:'🚣🗡️🔍',a:'刻舟求剑'},
    {e:'🐮🎹',a:'对牛弹琴'},{e:'🥛🏹🐍',a:'杯弓蛇影'},{e:'🦊🐯',a:'狐假虎威'},
    {e:'🐲👁️✏️',a:'画龙点睛'},{e:'🏹🦅🦅',a:'一箭双雕'},{e:'🪨🐦🐦',a:'一石二鸟'},
    {e:'3️⃣❤️2️⃣',a:'三心二意'},{e:'4️⃣🧭8️⃣',a:'四面八方'},{e:'7️⃣⬆️8️⃣⬇️',a:'七上八下'},
    {e:'🔥➕🛢️',a:'火上浇油'},{e:'❄️🎁🔥',a:'雪中送炭'},{e:'💧🌙🤲',a:'水中捞月'},
    {e:'🐯🏇⬇️',a:'骑虎难下'},{e:'🐟💧',a:'如鱼得水'},{e:'🛣️✂️',a:'半途而废'},
    {e:'💯🏹🎯',a:'百发百中'},{e:'🌊🏔️⛰️',a:'翻山越岭'},{e:'☝️🈚️✨',a:'一鸣惊人'}
  ];
  var pool=[], cur=0, score=0, right=0, streak=0, locked=false;
  function shuffle(a){
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function start(){
    pool=shuffle(DATA.slice()).slice(0,20);
    cur=0; score=0; right=0; streak=0;
    AK.$('#right').textContent='0'; AK.$('#streak').textContent='0';
    render();
  }
  function render(){
    locked=false;
    var q=pool[cur];
    AK.$('#prog').textContent='第 '+(cur+1)+' / '+pool.length+' 题';
    AK.$('#score').textContent='得分 '+score;
    AK.$('#fb').textContent='选一个答案';
    AK.$('#clue').textContent=q.e;
    var opts=[q.a];
    var guard=0;
    while(opts.length<4 && guard<300){
      guard++;
      var t=DATA[Math.floor(Math.random()*DATA.length)].a;
      if(opts.indexOf(t)<0) opts.push(t);
    }
    shuffle(opts);
    var box=AK.$('#opts');
    box.innerHTML='';
    for(var i=0;i<opts.length;i++){
      (function(o){
        var b=document.createElement('button');
        b.type='button'; b.textContent=o;
        b.addEventListener('click',function(){ answer(b,o,q); });
        box.appendChild(b);
      })(opts[i]);
    }
  }
  function answer(btn,val,q){
    if(locked) return;
    locked=true;
    if(val===q.a){ btn.className='ok'; streak++; right++; score+=10+(streak-1)*2; AK.toast('对了'); }
    else {
      btn.className='no'; streak=0;
      var all=AK.$$('#opts button');
      for(var i=0;i<all.length;i++) if(all[i].textContent===q.a) all[i].className='ok';
      AK.toast('答案是 '+q.a);
    }
    AK.$('#score').textContent='得分 '+score;
    AK.$('#right').textContent=String(right);
    AK.$('#streak').textContent=String(streak);
    AK.$('#fb').textContent = val===q.a ? '答对了' : '答案：'+q.a;
    setTimeout(function(){
      cur++;
      if(cur>=pool.length){
        AK.$('#clue').textContent='🎉';
        AK.$('#opts').innerHTML='';
        AK.$('#prog').textContent='本轮结束';
        AK.$('#fb').textContent='答对 '+right+' / '+pool.length+' 题';
        var best=AK.store.get('emoji.best',0);
        if(score>best) AK.store.set('emoji.best',score);
        return;
      }
      render();
    },900);
  }
  AK.on('#restart','click',start);
  start();`,
  },
  {
    name: "色字干扰测试",
    slug: "sezi-ganrao",
    cat: "游戏",
    icon: "🎨",
    tagline: "字说红，颜色是蓝，你选哪个",
    theme: ["#1f9e8a", "#0a3f39"],
    bg: "#f0fbf9",
    desc: "斯特鲁普效应测试：屏幕出现一个颜色词，但它是用另一种颜色写的，你要选字本身的颜色而不是字义。45 秒内看能答对多少题，平均反应时间越短越稳。",
    feats: [
      "45 秒限时，答对加分、答错扣时",
      "统计正确数、错误数与平均反应时间",
      "颜色与字义刻意冲突，专门干扰阅读习惯",
      "四个选项固定位置，适合反复刷记录",
    ],
    css: ".word{font-size:54px;font-weight:900;text-align:center;padding:20px 0 22px;letter-spacing:6px}.opts4{display:grid;grid-template-columns:1fr 1fr;gap:10px}.opts4 button{border:1px solid var(--line);background:#fff;border-radius:12px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;color:var(--ink)}.opts4 button:active{transform:scale(.98)}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:8px">
      <span class="tag" id="time">45 秒</span>
      <span class="tag" id="score">得分 0</span>
    </div>
    <div class="word" id="word">准备</div>
    <div class="opts4" id="opts"></div>
    <p class="muted" style="margin-top:12px">选<b>字的颜色</b>，不要选字的意思。答对 +1 分，答错 -1 分。</p>
  </section>
  <section class="card">
    <h2>本轮统计 <small id="st">点开始</small></h2>
    <div class="grid3">
      <div><div class="muted">正确</div><div class="big" id="ok">0</div></div>
      <div><div class="muted">错误</div><div class="big" id="no">0</div></div>
      <div><div class="muted">平均</div><div class="big" id="rt">—</div></div>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn btn-main btn-sm" id="start" type="button">开始 45 秒</button>
      <span class="muted">最高分 <b id="best">0</b></span>
    </div>
  </section>`,
    init: `
  var COLORS=[{n:'红',c:'#e8452c'},{n:'黄',c:'#d99b0b'},{n:'绿',c:'#2ea44f'},{n:'蓝',c:'#2f7bf5'}];
  var left=45, score=0, ok=0, no=0, rtSum=0, rtCount=0, running=false, timer=null, curInk=null, shownAt=0;
  var best=AK.store.get('stroop.best',0);
  AK.$('#best').textContent=String(best);
  function paintOpts(){
    var box=AK.$('#opts');
    box.innerHTML='';
    for(var i=0;i<COLORS.length;i++){
      (function(c){
        var b=document.createElement('button');
        b.type='button'; b.textContent=c.n; b.style.color=c.c;
        b.addEventListener('click',function(){ answer(c); });
        box.appendChild(b);
      })(COLORS[i]);
    }
  }
  function nextWord(){
    var wi=Math.floor(Math.random()*COLORS.length);
    var ii=Math.floor(Math.random()*COLORS.length);
    while(ii===wi) ii=Math.floor(Math.random()*COLORS.length);
    curInk=COLORS[ii];
    var w=AK.$('#word');
    w.textContent=COLORS[wi].n;
    w.style.color=COLORS[ii].c;
    shownAt=Date.now();
  }
  function answer(c){
    if(!running) return;
    var dt=(Date.now()-shownAt)/1000;
    if(c.n===curInk.n){ ok++; score++; rtSum+=dt; rtCount++; }
    else { no++; score=Math.max(0,score-1); }
    AK.$('#score').textContent='得分 '+score;
    AK.$('#ok').textContent=String(ok);
    AK.$('#no').textContent=String(no);
    AK.$('#rt').textContent = rtCount ? (rtSum/rtCount).toFixed(2)+'s' : '—';
    nextWord();
  }
  function tick(){
    left--;
    AK.$('#time').textContent=left+' 秒';
    if(left<=0) stop();
  }
  function stop(){
    running=false;
    clearInterval(timer); timer=null;
    AK.$('#word').textContent='结束';
    AK.$('#word').style.color='var(--ink)';
    AK.$('#st').textContent='本轮得分 '+score;
    if(score>best){ best=score; AK.store.set('stroop.best',best); AK.$('#best').textContent=String(best); }
    AK.toast('本轮得分 '+score);
  }
  function start(){
    clearInterval(timer);
    left=45; score=0; ok=0; no=0; rtSum=0; rtCount=0; running=true;
    AK.$('#time').textContent='45 秒';
    AK.$('#score').textContent='得分 0';
    AK.$('#ok').textContent='0'; AK.$('#no').textContent='0'; AK.$('#rt').textContent='—';
    AK.$('#st').textContent='进行中…';
    nextWord();
    timer=setInterval(tick,1000);
  }
  AK.on('#start','click',start);
  paintOpts();`,
  },
  {
    name: "一笔画挑战",
    slug: "yibihua-tiaozhan",
    cat: "游戏",
    icon: "✏️",
    tagline: "不抬笔不重复，把图形一次画完",
    theme: ["#c2410c", "#5c1d00"],
    bg: "#fff6f1",
    desc: "一笔画谜题：给你一个由点和线组成的图形，从任意点起笔，每条线只能走一次，把所有线走完就算通关。五个图形由易到难，走不通可以撤销。",
    feats: [
      "五个图形：正方形、房子、五角星、信封、双三角",
      "每条线只能走一次，走满全部线即通关",
      "支持撤销一步与重来，走错不用从头点",
      "实时显示已连线数，走不通会给出提示",
    ],
    css: ".board2{position:relative;width:100%;max-width:340px;margin:0 auto;aspect-ratio:1;background:#fff;border:1px solid var(--line);border-radius:14px}.board2 svg{position:absolute;inset:0;width:100%;height:100%}.board2 .nd{position:absolute;width:22px;height:22px;border-radius:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid #c8cfe6;cursor:pointer;transition:.12s}.board2 .nd.cur{border-color:var(--a);box-shadow:0 0 0 4px rgba(194,65,12,.18)}.board2 .nd:active{transform:translate(-50%,-50%) scale(.92)}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:6px">
      <span class="tag" id="lvname">正方形</span>
      <span class="tag" id="prog">已连 0 / 4</span>
    </div>
    <div class="board2" id="board"></div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="undo" type="button">撤销一步</button>
      <button class="btn btn-ghost btn-sm" id="reset" type="button">重来</button>
      <button class="btn btn-main btn-sm" id="next" type="button">换一题</button>
    </div>
    <p class="muted" id="st" style="margin-top:10px">从任意点起笔，一笔画完所有线，每条线只能走一次。</p>
  </section>`,
    init: `
  var LV=[
    {name:'正方形', nodes:[[70,70],[250,70],[250,250],[70,250]], edges:[[0,1],[1,2],[2,3],[3,0]]},
    {name:'房子', nodes:[[80,150],[240,150],[240,280],[80,280],[160,50]], edges:[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4]]},
    {name:'五角星', nodes:[[160,40],[276,196],[76,92],[244,92],[44,196]], edges:[[0,2],[2,4],[4,1],[1,3],[3,0]]},
    {name:'信封', nodes:[[60,90],[260,90],[260,270],[60,270],[160,180]], edges:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,2]]},
    {name:'双三角', nodes:[[160,40],[70,230],[250,230],[160,320]], edges:[[0,1],[1,2],[2,0],[1,3],[3,2]]}
  ];
  var li=0, edges=[], used=[], cur=-1, hist=[];
  var board=AK.$('#board');
  function deepCopy(){ return used.slice(); }
  function load(n){
    li=n; edges=LV[n].edges.map(function(e){ return [e[0],e[1]]; });
    used=[]; cur=-1; hist=[];
    AK.$('#lvname').textContent=LV[n].name;
    render();
  }
  function edgeIndex(a,b){
    for(var i=0;i<edges.length;i++){
      var e=edges[i];
      if((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)) return i;
    }
    return -1;
  }
  function render(){
    var nodes=LV[li].nodes;
    var html='<svg viewBox="0 0 320 340" preserveAspectRatio="none">';
    for(var i=0;i<edges.length;i++){
      var e=edges[i], a=nodes[e[0]], b=nodes[e[1]];
      var on=used[i] ? 1 : 0;
      html+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+(on?'var(--a)':'#dfe4f2')+'" stroke-width="'+(on?5:3)+'" stroke-linecap="round"/>';
    }
    html+='</svg>';
    board.innerHTML=html;
    for(var k=0;k<nodes.length;k++){
      var d=document.createElement('div');
      d.className='nd'+(cur===k?' cur':'');
      d.style.left=(nodes[k][0]/320*100)+'%';
      d.style.top=(nodes[k][1]/340*100)+'%';
      d.dataset.k=String(k);
      d.addEventListener('click',function(ev){ tap(Number(ev.currentTarget.dataset.k)); });
      board.appendChild(d);
    }
    AK.$('#prog').textContent='已连 '+used.filter(function(v){return v;}).length+' / '+edges.length;
  }
  function done(){ for(var i=0;i<used.length;i++) if(!used[i]) return false; return true; }
  function stuck(){
    if(cur<0) return false;
    for(var i=0;i<edges.length;i++){
      if(used[i]) continue;
      if(edges[i][0]===cur||edges[i][1]===cur) return false;
    }
    return true;
  }
  function tap(k){
    if(cur<0){ cur=k; AK.$('#st').textContent='起笔了，接着连下一个点'; render(); return; }
    if(k===cur) return;
    var idx=edgeIndex(cur,k);
    if(idx<0 || used[idx]){ AK.toast('这两点之间没有可连的线'); return; }
    hist.push({used:deepCopy(), cur:cur});
    used[idx]=1; cur=k;
    render();
    if(done()){
      AK.$('#st').textContent='一笔画完，通关';
      AK.toast('画完了');
      return;
    }
    if(stuck()) AK.$('#st').textContent='这里走不通了，撤销一步换个走法';
    else AK.$('#st').textContent='继续，还剩 '+(edges.length-used.filter(function(v){return v;}).length)+' 条线';
  }
  AK.on('#undo','click',function(){
    if(!hist.length){ AK.toast('没有可撤销的步'); return; }
    var h=hist.pop(); used=h.used; cur=h.cur; AK.$('#st').textContent='已撤销一步'; render();
  });
  AK.on('#reset','click',function(){ load(li); });
  AK.on('#next','click',function(){ load((li+1)%LV.length); });
  load(0);`,
  },
];
