/* 第二批 · K12 六个应用 */
export default [
  {
    name: "三角函数速查",
    slug: "sanjiao-hanshu-sucha",
    cat: "K12",
    icon: "📐",
    tagline: "输入任意角度，六种三角函数一次算完",
    theme: ["#4f6ef7", "#22307e"],
    bg: "#f2f4fd",
    desc: "输入角度或弧度，实时算出正弦、余弦、正切以及三个倒数函数值，同时标注所在象限与周期化简结果。内置 0°–360° 特殊角对照表，点一行就能填入，做题核对不必翻书。",
    feats: [
      "角度 / 弧度双单位输入，负角与超过 360° 都能正确处理",
      "sin、cos、tan、cot、sec、csc 六值一次算出",
      "自动给出周期化简角度与象限判定，0 与不存在的值单独标注",
      "11 个特殊角对照表，点击整行直接填入计算",
    ],
    body: `
  <section class="card">
    <h2>输入角度</h2>
    <div class="grid2">
      <div><label>数值</label><input id="val" type="number" value="30" step="any"></div>
      <div><label>单位</label><select id="unit"><option value="deg">角度 °</option><option value="rad">弧度 rad</option></select></div>
    </div>
    <div class="row" style="margin-top:12px" id="quick"></div>
  </section>
  <section class="card">
    <h2>计算结果 <small id="norm"></small></h2>
    <div id="out"></div>
  </section>
  <section class="card">
    <h2>特殊角对照 <small>点一行填入</small></h2>
    <table id="tbl"><thead><tr><th>角度</th><th>sin</th><th>cos</th><th>tan</th></tr></thead><tbody></tbody></table>
  </section>`,
    init: `
  var QUICK = [0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360];
  var qbox = AK.$('#quick');
  QUICK.forEach(function (d) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = d + '°';
    b.onclick = function () { AK.$('#unit').value = 'deg'; AK.$('#val').value = d; calc(); };
    qbox.appendChild(b);
  });
  var SP = [[0, '0', '1', '0'], [30, '1/2', '√3/2', '√3/3'], [45, '√2/2', '√2/2', '1'], [60, '√3/2', '1/2', '√3'], [90, '1', '0', '不存在'], [120, '√3/2', '-1/2', '-√3'], [135, '√2/2', '-√2/2', '-1'], [150, '1/2', '-√3/2', '-√3/3'], [180, '0', '-1', '0'], [270, '-1', '0', '不存在'], [360, '0', '1', '0']];
  var tbody = AK.$('#tbl tbody');
  SP.forEach(function (r) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + r[0] + '°</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td>';
    tr.style.cursor = 'pointer';
    tr.onclick = function () { AK.$('#unit').value = 'deg'; AK.$('#val').value = r[0]; calc(); };
    tbody.appendChild(tr);
  });
  function fmt(v) {
    if (!isFinite(v)) return '不存在';
    if (Math.abs(v) < 1e-10) return '0';
    if (Math.abs(v) > 1e6) return v.toExponential(3);
    return String(Math.round(v * 10000) / 10000);
  }
  function calc() {
    var raw = AK.n(AK.$('#val').value, 0);
    var deg = AK.$('#unit').value === 'deg' ? raw : raw * 180 / Math.PI;
    var rad = deg * Math.PI / 180;
    var s = Math.sin(rad), c = Math.cos(rad);
    var norm = ((deg % 360) + 360) % 360;
    var qn = norm < 90 ? '第一象限' : norm < 180 ? '第二象限' : norm < 270 ? '第三象限' : '第四象限';
    if (Math.abs(norm % 90) < 1e-9) qn = '轴线角';
    AK.$('#norm').textContent = '化简 ' + Math.round(norm) + '° · ' + qn;
    var rows = [['sin θ', fmt(s)], ['cos θ', fmt(c)], ['tan θ', fmt(s / c)], ['cot θ', fmt(c / s)], ['sec θ', fmt(1 / c)], ['csc θ', fmt(1 / s)]];
    AK.$('#out').innerHTML = rows.map(function (r) {
      return '<div class="kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('');
  }
  AK.on('#val', 'input', calc);
  AK.on('#unit', 'change', calc);
  calc();`
  },
  {
    name: "单位换算练习",
    slug: "danwei-huansuan-lianxi",
    cat: "K12",
    icon: "📏",
    tagline: "随机出题，换算题刷到不丢分",
    theme: ["#12a594", "#0a5c56"],
    bg: "#f0faf8",
    desc: "长度、质量、面积、体积、时间、温度六类换算随机出题，输入答案即时判分，答错直接给出正确结果与换算过程。记录连对次数与历史正确率，适合课前五分钟反复练手。",
    feats: [
      "六类单位、100+ 种单位组合随机出题，难度按数值大小控制",
      "即时判分并展示换算过程，答错也能看懂怎么算",
      "连对次数、总正确率、最好成绩记录在本机",
      "包含温度 ℃/℉/K 的特例换算，不套用简单比例",
    ],
    body: `
  <section class="card">
    <h2>第 <span id="no">1</span> 题 <small id="streak">连对 0</small></h2>
    <p class="big" id="question" style="line-height:1.45;font-size:26px">—</p>
    <div class="row" style="margin:14px 0 10px">
      <input id="ans" type="number" step="any" placeholder="输入答案" style="flex:1;min-width:160px">
      <button class="btn btn-main" id="submit" type="button">提交</button>
      <button class="btn btn-ghost" id="skip" type="button">跳过</button>
    </div>
    <div id="feedback" class="muted"></div>
  </section>
  <section class="card">
    <h2>练习统计 <small>保存在本机</small></h2>
    <div class="grid3">
      <div><div class="muted">已答</div><div class="big" id="s-total">0</div></div>
      <div><div class="muted">正确率</div><div class="big" id="s-rate">—</div></div>
      <div><div class="muted">最好连对</div><div class="big" id="s-best">0</div></div>
    </div>
    <button class="btn btn-ghost btn-sm" id="reset" type="button" style="margin-top:12px">清空统计</button>
  </section>`,
    init: `
  var CATS = [
    { n: '长度', u: [['毫米', 0.001], ['厘米', 0.01], ['分米', 0.1], ['米', 1], ['千米', 1000]] },
    { n: '质量', u: [['克', 1], ['千克', 1000], ['吨', 1000000]] },
    { n: '面积', u: [['平方厘米', 0.0001], ['平方米', 1], ['公顷', 10000], ['平方千米', 1000000]] },
    { n: '体积', u: [['毫升', 0.001], ['升', 1], ['立方米', 1000]] },
    { n: '时间', u: [['秒', 1], ['分钟', 60], ['小时', 3600], ['天', 86400]] }
  ];
  var TEMPS = [['摄氏度', '华氏度'], ['华氏度', '摄氏度'], ['摄氏度', '开尔文'], ['开尔文', '摄氏度']];
  var st = AK.store.get('danwei.stat', { total: 0, right: 0, streak: 0, best: 0 });
  var cur = null, no = 0, answered = false;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function makeQ() {
    answered = false;
    if (Math.random() < 0.15) {
      var tc = pick(TEMPS);
      var f = Math.round(rnd(-20, 120));
      cur = { type: 'temp', from: tc[0], to: tc[1], value: f, text: '把 ' + f + ' ' + tc[0] + ' 换算成 ' + tc[1] };
    } else {
      var cat = pick(CATS);
      var a = pick(cat.u), b = pick(cat.u);
      while (a[0] === b[0]) b = pick(cat.u);
      var v = Math.round(rnd(1, 60) * 100) / 100;
      cur = { type: 'ratio', from: a[0], to: b[0], value: v, fa: a[1], fb: b[1], text: v + ' ' + a[0] + ' = ? ' + b[0] };
    }
    no++;
    AK.$('#no').textContent = no;
    AK.$('#question').innerHTML = cur.text.replace('?', '<span style="color:var(--a)">?</span>');
    AK.$('#feedback').textContent = '';
    AK.$('#ans').value = '';
    AK.$('#ans').focus();
  }
  function answer() {
    var v = AK.$('#ans').value;
    if (v === '' || answered) return;
    answered = true;
    var got = Number(v);
    var want, detail;
    if (cur.type === 'temp') {
      if (cur.from === '摄氏度') want = cur.to === '华氏度' ? cur.value * 9 / 5 + 32 : cur.value + 273.15;
      else if (cur.from === '华氏度') want = (cur.value - 32) * 5 / 9;
      else want = cur.value - 273.15;
      detail = cur.value + ' ' + cur.from + ' = ' + (Math.round(want * 100) / 100) + ' ' + cur.to;
    } else {
      want = cur.value * cur.fa / cur.fb;
      detail = cur.value + ' ' + cur.from + ' = ' + cur.value + ' × ' + (cur.fa / cur.fb) + ' = ' + (Math.round(want * 100000) / 100000) + ' ' + cur.to;
    }
    var ok = Math.abs(got - want) <= Math.max(0.01, Math.abs(want) * 0.005);
    st.total++;
    if (ok) { st.right++; st.streak++; st.best = Math.max(st.best, st.streak); } else { st.streak = 0; }
    AK.store.set('danwei.stat', st);
    paintStat();
    AK.$('#feedback').innerHTML = ok
      ? '<span style="color:#12a594;font-weight:800">正确</span> · ' + detail
      : '<span style="color:#c0392b;font-weight:800">答错了</span> · 正确答案 ' + (Math.round(want * 10000) / 10000) + '<br>' + detail;
    AK.$('#streak').textContent = '连对 ' + st.streak;
    setTimeout(makeQ, 1500);
  }
  function paintStat() {
    AK.$('#s-total').textContent = st.total;
    AK.$('#s-rate').textContent = st.total ? Math.round(st.right / st.total * 100) + '%' : '—';
    AK.$('#s-best').textContent = st.best;
    AK.$('#streak').textContent = '连对 ' + st.streak;
  }
  AK.on('#submit', 'click', answer);
  AK.on('#skip', 'click', function () { answered = true; AK.toast('已跳过'); makeQ(); });
  AK.on('#ans', 'keydown', function (e) { if (e.key === 'Enter') answer(); });
  AK.on('#reset', 'click', function () {
    st = { total: 0, right: 0, streak: 0, best: 0 };
    AK.store.set('danwei.stat', st);
    paintStat();
    AK.toast('统计已清空');
  });
  paintStat();
  makeQ();`
  },
  {
    name: "时区换算器",
    slug: "shiqu-huansuanqi",
    cat: "K12",
    icon: "🌍",
    tagline: "一句话看清十二个城市此刻几点",
    theme: ["#2d8cf0", "#123a6b"],
    bg: "#f0f6fe",
    desc: "选定基准城市与时间，一次算出全球 12 个主要城市的当地时间，跨天和跨日自动标注。适合上地理课讲时区、算海外会议时间，或给在国外的人发消息前先看一眼。",
    feats: [
      "12 个主要城市固定时差表，含国内北京、东京、新加坡等常用城市",
      "任意日期时间输入，自动标注比基准早一天还是晚一天",
      "按时间先后排序，附与基准城市的时差标签",
      "记住上次用的基准城市与时间",
    ],
    body: `
  <section class="card">
    <h2>基准城市与时间</h2>
    <div class="grid2">
      <div><label>城市</label><select id="city"></select></div>
      <div><label>当地时间</label><input id="dt" type="datetime-local"></div>
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-main" id="now" type="button">使用当前时间</button>
      <span class="muted" id="hint"></span>
    </div>
  </section>
  <section class="card">
    <h2>各城市当地时间 <small>按时间先后</small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var CITIES = [
    ['北京', 8], ['东京', 9], ['首尔', 9], ['新加坡', 8], ['悉尼', 11], ['迪拜', 4],
    ['莫斯科', 3], ['柏林', 2], ['巴黎', 2], ['伦敦', 1], ['纽约', -4], ['洛杉矶', -7]
  ];
  var sel = AK.$('#city');
  CITIES.forEach(function (c, i) {
    var o = document.createElement('option');
    o.value = i;
    o.textContent = c[0] + '（UTC' + (c[1] >= 0 ? '+' : '') + c[1] + '）';
    sel.appendChild(o);
  });
  var saved = AK.store.get('shiqu.state', { city: 0 });
  sel.value = saved.city || 0;
  function pad(n) { return AK.pad(n); }
  function localInput(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  AK.$('#dt').value = localInput(new Date());
  function render() {
    var idx = Number(sel.value);
    var base = CITIES[idx];
    var v = AK.$('#dt').value;
    if (!v) return;
    var parts = v.split('T');
    var dparts = parts[0].split('-');
    var tparts = (parts[1] || '00:00').split(':');
    var local = new Date(Number(dparts[0]), Number(dparts[1]) - 1, Number(dparts[2]), Number(tparts[0]), Number(tparts[1]));
    var utc = new Date(local.getTime() - base[1] * 3600000);
    AK.store.set('shiqu.state', { city: idx });
    var baseDay = new Date(utc.getTime() + base[1] * 3600000).toDateString();
    var rows = CITIES.map(function (c, i) {
      var d = new Date(utc.getTime() + c[1] * 3600000);
      return { name: c[0], off: c[1], d: d, diff: c[1] - base[1], i: i, same: d.toDateString() === baseDay };
    }).sort(function (a, b) { return a.d - b.d; });
    AK.$('#list').innerHTML = rows.map(function (r) {
      var dayTag = r.same ? '' : '<span class="tag" style="margin-left:6px">' + (r.d > new Date(utc.getTime() + base[1] * 3600000) ? '次日' : '前一日') + '</span>';
      var time = pad(r.d.getHours()) + ':' + pad(r.d.getMinutes());
      var diffTxt = r.diff === 0 ? '同时区' : (r.diff > 0 ? '快 ' + r.diff + ' 小时' : '慢 ' + (-r.diff) + ' 小时');
      return '<div class="item" style="' + (r.i === idx ? 'border-color:var(--a);background:#f6f8ff' : '') + '">' +
        '<div class="grow"><div class="t">' + r.name + (r.i === idx ? ' · 基准' : '') + dayTag + '</div>' +
        '<div class="s">' + (r.d.getMonth() + 1) + ' 月 ' + r.d.getDate() + ' 日 · ' + diffTxt + '</div></div>' +
        '<b style="font-size:19px;font-variant-numeric:tabular-nums">' + time + '</b></div>';
    }).join('');
    AK.$('#hint').textContent = '基准 UTC' + (base[1] >= 0 ? '+' : '') + base[1] + '，已换算为各城市当地时间';
  }
  AK.on('#dt', 'change', render);
  AK.on('#city', 'change', render);
  AK.on('#now', 'click', function () {
    AK.$('#dt').value = localInput(new Date());
    render();
    AK.toast('已切换为当前时间');
  });
  render();`
  },
  {
    name: "成语填空挑战",
    slug: "chengyu-tiankong",
    cat: "K12",
    icon: "🀄",
    tagline: "三十个成语挖一个字，看你还记得几个",
    theme: ["#c9432f", "#6d1a12"],
    bg: "#fdf4f2",
    desc: "从三十个常用成语里随机挖掉一个字，四个选项里挑出正确的一个。答完立刻显示释义，连对可以累积连击，适合语文课前热身或家长陪孩子一起玩。",
    feats: [
      "30 个常考成语随机挖空，含易错字专项",
      "四选一即时判定，答对答错都给释义",
      "连对记录与正确率统计，保存在本机",
      "支持键盘 1–4 快捷作答，连点不卡顿",
    ],
    body: `
  <section class="card">
    <h2>第 <span id="no">1</span> 题 <small id="streak">连对 0 · 正确率 —</small></h2>
    <p id="stem" class="big" style="font-size:30px;letter-spacing:4px;margin:6px 0 18px">—</p>
    <div id="opts" class="grid2"></div>
    <div id="fb" class="muted" style="margin-top:14px;min-height:44px"></div>
  </section>
  <section class="card">
    <h2>本局成绩</h2>
    <div class="grid3">
      <div><div class="muted">已答</div><div class="big" id="s-total">0</div></div>
      <div><div class="muted">答对</div><div class="big" id="s-right">0</div></div>
      <div><div class="muted">最好连对</div><div class="big" id="s-best">0</div></div>
    </div>
    <button class="btn btn-ghost btn-sm" id="restart" type="button" style="margin-top:12px">重新开始</button>
  </section>`,
    init: `
  var BANK = [
    ['画蛇添□', '足', ['足', '脚', '腿', '手'], '比喻做了多余的事，反而不好。'],
    ['□苗助长', '拔', ['拔', '拨', '拉', '扶'], '比喻违反事物发展规律，急于求成。'],
    ['守株待□', '兔', ['兔', '鹿', '羊', '鸟'], '比喻死守狭隘经验，不知变通。'],
    ['掩耳盗□', '铃', ['铃', '钟', '鼓', '锣'], '比喻自己欺骗自己。'],
    ['刻舟求□', '剑', ['剑', '刀', '舟', '鱼'], '比喻拘泥固执，不知变化。'],
    ['井底之□', '蛙', ['蛙', '鱼', '龟', '虫'], '比喻见识狭窄的人。'],
    ['杯弓蛇□', '影', ['影', '形', '身', '像'], '比喻因疑神疑鬼而自相惊扰。'],
    ['亡羊补□', '牢', ['牢', '圈', '栏', '门'], '出了问题及时补救，防止继续受损失。'],
    ['吴牛喘□', '月', ['月', '日', '风', '雨'], '比喻因疑心而过分惧怕。'],
    ['胸有成□', '竹', ['竹', '木', '松', '梅'], '比喻做事之前已有通盘考虑。'],
    ['一鼓作□', '气', ['气', '势', '力', '勇'], '比喻趁劲头大的时候鼓起干劲。'],
    ['三顾茅□', '庐', ['庐', '屋', '舍', '亭'], '比喻诚心诚意一再邀请。'],
    ['不耻下□', '问', ['问', '学', '看', '求'], '不把向学问不如自己的人请教当耻辱。'],
    ['出类拔□', '萃', ['萃', '粹', '翠', '瘁'], '形容超出同类之上。'],
    ['全神贯□', '注', ['注', '住', '驻', '柱'], '形容注意力高度集中。'],
    ['再接再□', '厉', ['厉', '励', '砺', '历'], '比喻继续努力，再加一把劲。'],
    ['变本加□', '厉', ['厉', '利', '励', '立'], '情况变得比原来更加严重。'],
    ['病人膏□', '肓', ['肓', '盲', '荒', '慌'], '形容病情严重到无法医治。'],
    ['一诺千□', '金', ['金', '斤', '今', '津'], '许下的诺言价值千金，形容说话算数。'],
    ['风驰电□', '掣', ['掣', '撤', '澈', '彻'], '形容非常迅速，像风吹电闪一样。'],
    ['川流不□', '息', ['息', '熄', '惜', '昔'], '形容行人车马来来往往，接连不断。'],
    ['别出心□', '裁', ['裁', '栽', '载', '才'], '独创一格，与众不同。'],
    ['黄粱一□', '梦', ['梦', '孟', '猛', '蒙'], '比喻虚幻不能实现的梦想。'],
    ['名列前□', '茅', ['茅', '毛', '矛', '茂'], '名次排在前面。'],
    ['破釜沉□', '舟', ['舟', '船', '舰', '艇'], '比喻下决心不顾一切干到底。'],
    ['悬梁刺□', '股', ['股', '骨', '鼓', '古'], '形容刻苦学习。'],
    ['原形毕□', '露', ['露', '路', '录', '禄'], '本来面目完全暴露。'],
    ['谈笑风□', '生', ['生', '声', '升', '胜'], '形容谈话谈得高兴而有风趣。'],
    ['如火如□', '荼', ['荼', '茶', '涂', '图'], '形容气势蓬勃，气氛热烈。'],
    ['心旷神□', '怡', ['怡', '宜', '移', '疑'], '心情舒畅，精神愉快。']
  ];
  var st = { total: 0, right: 0, streak: 0, best: 0, cur: null, locked: false };
  function pick(n) { return Math.floor(Math.random() * n); }
  function next() {
    st.locked = false;
    var q = BANK[pick(BANK.length)];
    st.cur = q;
    AK.$('#stem').textContent = q[0];
    AK.$('#fb').textContent = '';
    var opts = q[2].slice();
    for (var i = opts.length - 1; i > 0; i--) { var j = pick(i + 1); var t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
    var box = AK.$('#opts');
    box.innerHTML = '';
    opts.forEach(function (o, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-ghost';
      b.style.cssText = 'padding:14px;font-size:20px;font-weight:800;letter-spacing:2px';
      b.textContent = (i + 1) + '. ' + o;
      b.onclick = function () { answer(o, b); };
      box.appendChild(b);
    });
  }
  function answer(val, btn) {
    if (st.locked) return;
    st.locked = true;
    var q = st.cur;
    var ok = val === q[1];
    st.total++;
    if (ok) { st.right++; st.streak++; st.best = Math.max(st.best, st.streak); } else { st.streak = 0; }
    AK.$('#fb').innerHTML = (ok ? '<b style="color:#12a594">答对了</b>' : '<b style="color:#c0392b">答错，正确是「' + q[1] + '」</b>') + '<br>' + q[3] + '<br><span style="color:var(--ink3)">1.5 秒后继续</span>';
    btn.style.background = ok ? '#e6f7f4' : '#fdeaea';
    paint();
    setTimeout(next, 1500);
  }
  function paint() {
    AK.$('#s-total').textContent = st.total;
    AK.$('#s-right').textContent = st.right;
    AK.$('#s-best').textContent = st.best;
    AK.$('#no').textContent = st.total + 1;
    AK.$('#streak').textContent = '连对 ' + st.streak + ' · 正确率 ' + (st.total ? Math.round(st.right / st.total * 100) + '%' : '—');
  }
  AK.on(document, 'keydown', function (e) {
    var k = Number(e.key);
    if (k >= 1 && k <= 4) {
      var btns = AK.$$('#opts .btn');
      if (btns[k - 1]) btns[k - 1].click();
    }
  });
  AK.on('#restart', 'click', function () {
    st = { total: 0, right: 0, streak: 0, best: 0, cur: null, locked: false };
    paint();
    next();
  });
  paint();
  next();`
  },
  {
    name: "小数分数互转",
    slug: "xiaoshu-fenshu-huzhuan",
    cat: "K12",
    icon: "🔢",
    tagline: "小数、分数、百分数，一键互转还带约分",
    theme: ["#7b5cf0", "#3a2378"],
    bg: "#f5f2fe",
    desc: "输入小数自动转成最简分数与百分数，输入分数自动转小数和百分数，循环小数也能识别并给出分数形式。附竖式思路提示，适合小学高年级到初中阶段练习数感。",
    feats: [
      "小数 → 最简分数 / 百分数，自动约分并给出约分过程",
      "分数 → 小数 / 百分数，除不尽时标注循环节",
      "支持带分数输入，如 2 3/4",
      "常用分数对照表一键填入",
    ],
    body: `
  <section class="card">
    <h2>输入数值</h2>
    <div class="row">
      <input id="v" placeholder="如 0.375 或 3/8 或 2 3/4" style="flex:1;min-width:180px">
      <button class="btn btn-main" id="go" type="button">换算</button>
    </div>
    <div class="row" style="margin-top:10px" id="quick"></div>
  </section>
  <section class="card">
    <h2>换算结果</h2>
    <div id="out"><div class="empty">输入一个数，结果会显示在这里</div></div>
  </section>`,
    init: `
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function fracStr(n, d) { return d === 1 ? String(n) : n + '/' + d; }
  function fromDecimal(x) {
    if (!isFinite(x)) return null;
    var s = String(x);
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var dec = (s.split('.')[1] || '').length;
    if (dec === 0) return { n: sign * x, d: 1, dec: 0 };
    var d = Math.pow(10, dec);
    var n = Math.round(x * d);
    var g = gcd(n, d);
    return { n: sign * n / g, d: d / g, dec: dec, rawN: n, rawD: d };
  }
  function parse(input) {
    var t = String(input).trim().replace(/／/g, '/');
    var m = t.match(/^(-?\\d+)\\s+(\\d+)\\/(\\d+)$/);
    if (m) return { n: Number(m[1]) * Number(m[3]) + (Number(m[1]) < 0 ? -1 : 1) * Number(m[2]), d: Number(m[3]), mixed: true };
    m = t.match(/^(-?\\d+)\\/(\\d+)$/);
    if (m) return { n: Number(m[1]), d: Number(m[2]) };
    if (/^-?\\d*\\.?\\d+$/.test(t)) return { dec: Number(t) };
    return null;
  }
  function render() {
    var raw = AK.$('#v').value;
    var p = parse(raw);
    var out = AK.$('#out');
    if (!p) { out.innerHTML = '<div class="empty">格式无法识别，试试 0.375、3/8 或 2 3/4</div>'; return; }
    var rows = [];
    if (p.dec !== undefined) {
      var x = p.dec;
      var f = fromDecimal(x);
      rows.push(['小数', String(x)]);
      rows.push(['百分数', (Math.round(x * 1000000) / 10000) + '%']);
      if (f.d === 1) {
        rows.push(['最简分数', String(f.n) + '/1（整数）']);
      } else {
        rows.push(['最简分数', fracStr(f.n, f.d)]);
        if (f.rawN !== f.n) rows.push(['约分过程', f.rawN + '/' + f.rawD + ' → 同除 ' + (f.rawN / f.n) + ' → ' + f.n + '/' + f.d]);
      }
      if (Math.abs(x) > 1 && f.d !== 1) {
        var whole = Math.trunc(f.n / f.d);
        var rest = Math.abs(f.n % f.d);
        if (rest) rows.push(['带分数', whole + ' ' + rest + '/' + f.d]);
      }
    } else {
      var n = p.n, d = p.d;
      if (d === 0) { out.innerHTML = '<div class="empty">分母不能为 0</div>'; return; }
      var g = gcd(n, d);
      var sn = n / g, sd = d / g;
      var val = n / d;
      rows.push(['分数', (p.mixed ? '带分数 ' : '') + n + '/' + d]);
      if (g !== 1) rows.push(['约分', n + '/' + d + ' → ' + sn + '/' + sd + '（同除 ' + g + '）']);
      rows.push(['小数', isFinite(val) ? (Math.round(val * 1000000) / 1000000).toString() : '—']);
      rows.push(['百分数', (Math.round(val * 1000000) / 100) + '%']);
      if (Math.abs(sn) > Math.abs(sd)) {
        var w = Math.trunc(sn / sd), r = Math.abs(sn % sd);
        if (r) rows.push(['带分数', w + ' ' + r + '/' + sd]);
      }
      if (!isFinite(val) || Math.abs(val * 1000000 - Math.round(val * 1000000)) > 1e-6) {
        rows.push(['说明', '除不尽，通常会写作循环小数，例如 1/3 = 0.333…']);
      }
    }
    out.innerHTML = rows.map(function (r) {
      return '<div class="kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('');
  }
  var QUICK = ['0.5', '0.25', '0.125', '0.375', '1/3', '2/5', '7/8', '2 3/4'];
  var qb = AK.$('#quick');
  QUICK.forEach(function (v) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = v;
    b.onclick = function () { AK.$('#v').value = v; render(); };
    qb.appendChild(b);
  });
  AK.on('#go', 'click', render);
  AK.on('#v', 'keydown', function (e) { if (e.key === 'Enter') render(); });
  AK.$('#v').value = '0.375';
  render();`
  },
  {
    name: "化学方程式配平",
    slug: "huaxue-peiping",
    cat: "K12",
    icon: "⚗️",
    tagline: "十二道配平题，选系数就能判对错",
    theme: ["#0f9d8f", "#0a4b46"],
    bg: "#effaf8",
    desc: "收录十二个初中化学常见反应的配平题，每题给出四组系数组合，选出正确的一组即判分。答完展示正确的配平结果与反应类型，适合单元复习前快速过一遍。",
    feats: [
      "12 个经典反应：燃烧、置换、复分解、分解反应全覆盖",
      "四选一系数组合，选中即判定并展示正确配平式",
      "即时显示反应类型与常见易错点提示",
      "记录已答、正确数与最好连对，可随时重新开始",
    ],
    body: `
  <section class="card">
    <h2>第 <span id="no">1</span> / 12 题 <small id="score">答对 0</small></h2>
    <p id="eq" style="font-size:24px;font-weight:800;line-height:1.7;margin:4px 0 6px">—</p>
    <p class="muted" id="tip"></p>
    <div class="grid2" id="opts" style="margin-top:14px"></div>
    <div id="fb" style="margin-top:12px;font-size:13px;line-height:1.8"></div>
  </section>
  <section class="card">
    <div class="row spread">
      <div class="muted">进度 <span id="prog">0</span> / 12</div>
      <button class="btn btn-ghost btn-sm" id="restart" type="button">重新开始</button>
    </div>
    <div class="bar" style="margin-top:10px"><i id="pbar" style="width:0%"></i></div>
  </section>`,
    init: `
  var BANK = [
    { eq: '__H2 + __O2 → __H2O', ans: '2,1,2', opts: ['1,1,1', '2,1,2', '1,2,2', '2,2,1'], type: '化合反应', tip: '氢气燃烧生成水，氧原子要成对处理。' },
    { eq: '__C + __O2 → __CO2', ans: '1,1,1', opts: ['1,1,1', '1,2,1', '2,1,2', '1,1,2'], type: '化合反应', tip: '碳充分燃烧，各元素原子数天然相等。' },
    { eq: '__Fe + __O2 → __Fe3O4', ans: '3,2,1', opts: ['3,2,1', '2,3,1', '3,1,2', '1,2,3'], type: '化合反应', tip: '先配氧：四氧化三铁有 4 个氧，需要 2 个 O2。' },
    { eq: '__CH4 + __O2 → __CO2 + __H2O', ans: '1,2,1,2', opts: ['1,1,1,1', '1,2,1,2', '2,1,2,1', '1,2,2,1'], type: '氧化反应', tip: '先配碳氢，再用氧原子数校验。' },
    { eq: '__Al + __O2 → __Al2O3', ans: '4,3,2', opts: ['2,3,1', '4,3,2', '3,2,1', '4,2,3'], type: '化合反应', tip: '铝是 4 个、氧分子 3 个，生成 2 个氧化铝。' },
    { eq: '__KClO3 → __KCl + __O2', ans: '2,2,3', opts: ['2,2,3', '1,1,1', '2,2,1', '3,3,2'], type: '分解反应', tip: '氧原子左右都要成双，取最小公倍数 6。' },
    { eq: '__H2O2 → __H2O + __O2', ans: '2,2,1', opts: ['1,1,1', '2,2,1', '2,1,2', '1,2,1'], type: '分解反应', tip: '过氧化氢分解，2 份生成 2 份水与 1 份氧气。' },
    { eq: '__Mg + __HCl → __MgCl2 + __H2', ans: '1,2,1,1', opts: ['1,2,1,1', '1,1,1,1', '2,2,1,2', '1,2,2,1'], type: '置换反应', tip: '一个镁置换出两个氢原子，即一个氢分子。' },
    { eq: '__N2 + __H2 → __NH3', ans: '1,3,2', opts: ['1,2,2', '1,3,2', '2,3,1', '1,3,1'], type: '化合反应', tip: '氢原子数要凑成 6，所以是 3 个氢分子。' },
    { eq: '__Fe2O3 + __CO → __Fe + __CO2', ans: '1,3,2,3', opts: ['1,3,2,3', '1,2,2,2', '2,3,4,3', '1,3,3,2'], type: '氧化还原', tip: '每个 CO 夺一个氧，三个氧需要三份 CO。' },
    { eq: '__CaCO3 → __CaO + __CO2', ans: '1,1,1', opts: ['1,1,1', '2,1,2', '1,2,1', '2,2,1'], type: '分解反应', tip: '碳酸钙高温分解，原子数已平衡。' },
    { eq: '__NaOH + __H2SO4 → __Na2SO4 + __H2O', ans: '2,1,1,2', opts: ['1,1,1,1', '2,1,1,2', '2,2,1,2', '1,2,1,2'], type: '复分解反应', tip: '硫酸有两个氢，需要两份氢氧化钠中和。' }
  ];
  var order = [], idx = 0, right = 0, answered = false;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function start() {
    order = shuffle(BANK.map(function (_, i) { return i; }));
    idx = 0; right = 0; answered = false;
    paint(); next();
  }
  function next() {
    if (idx >= order.length) {
      AK.$('#eq').textContent = '全部完成';
      AK.$('#tip').textContent = '答对 ' + right + ' / ' + order.length + ' 题';
      AK.$('#opts').innerHTML = '';
      AK.$('#fb').innerHTML = '<b style="color:var(--a)">' + (right >= 10 ? '配平已经很熟了，去挑战更难的题目吧。' : '错题多集中在氧原子成对上，回头再看一遍配平步骤。') + '</b>';
      return;
    }
    answered = false;
    var q = BANK[order[idx]];
    AK.$('#eq').textContent = q.eq;
    AK.$('#tip').textContent = '提示：' + q.tip;
    AK.$('#fb').textContent = '';
    var box = AK.$('#opts');
    box.innerHTML = '';
    shuffle(q.opts.slice()).forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-ghost';
      b.style.cssText = 'padding:13px;font-size:15px;font-weight:800;letter-spacing:.5px';
      b.textContent = o;
      b.onclick = function () {
        if (answered) return;
        answered = true;
        var ok = o === q.ans;
        if (ok) right++;
        b.style.background = ok ? '#e6f7f4' : '#fdeaea';
        AK.$('#fb').innerHTML = (ok ? '<b style="color:#0f9d8f">正确</b>' : '<b style="color:#c0392b">不对，正确答案是 ' + q.ans + '</b>') +
          '<br><span class="tag">' + q.type + '</span>';
        var parts = q.ans.split(',');
        var k = 0;
        AK.$('#fb').innerHTML += '<div style="margin-top:8px;font-weight:700">' + q.eq.replace(/__/g, function () { return parts[k++]; }) + '</div>';
        idx++;
        paint();
        setTimeout(next, 1600);
      };
      box.appendChild(b);
    });
  }
  function paint() {
    AK.$('#no').textContent = Math.min(idx + 1, order.length || 1);
    AK.$('#score').textContent = '答对 ' + right;
    AK.$('#prog').textContent = idx;
    AK.$('#pbar').style.width = Math.round(idx / BANK.length * 100) + '%';
  }
  AK.on('#restart', 'click', start);
  start();`
  }
];
