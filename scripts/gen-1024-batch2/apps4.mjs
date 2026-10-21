/* 第二批 · 公益六个 + 健身六个 */
export default [
  {
    name: "志愿服务时长记录",
    slug: "zhiyuan-fuwu-shichang",
    cat: "公益",
    icon: "🤝",
    tagline: "每一次志愿服务，都攒成自己的记录",
    theme: ["#2f855a", "#12452c"],
    bg: "#f1faf5",
    desc: "按日期录入志愿服务项目与时长，自动累计总时长、本月时长和服务次数，并按常见星级门槛提示距离下一档还差多少小时。记录存在本机，可导出为文本备份。",
    feats: [
      "按日期记录项目名称与时长，自动累计总时长",
      "本月与近 30 天时长统计，星级门槛进度条",
      "一键导出全部记录为文本，便于申报使用",
      "支持逐条删除与数据本地保存",
    ],
    body: `
  <section class="card">
    <h2>添加记录</h2>
    <div class="grid2">
      <div><label>日期</label><input id="d" type="date"></div>
      <div><label>时长（小时）</label><input id="h" type="number" value="3" step="0.5" min="0"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>服务项目</label><input id="n" placeholder="如 社区图书馆整理"></div>
    <button class="btn btn-main" id="add" type="button">加入记录</button>
  </section>
  <section class="card">
    <h2>累计 <small id="lv"></small></h2>
    <div class="grid3">
      <div><div class="muted">总时长</div><div class="big" id="total">0</div></div>
      <div><div class="muted">本月</div><div class="big" id="month">0</div></div>
      <div><div class="muted">次数</div><div class="big" id="times">0</div></div>
    </div>
    <div class="bar" style="margin-top:14px"><i id="pbar" style="width:0%"></i></div>
    <p class="muted" id="next" style="margin-top:8px"></p>
  </section>
  <section class="card">
    <h2>记录明细 <small id="cnt"></small></h2>
    <div id="list"></div>
    <button class="btn btn-ghost btn-sm" id="export" type="button" style="margin-top:10px">导出文本</button>
  </section>`,
    init: `
  var list = AK.store.get('zy.list', []);
  var TIERS = [20, 50, 100, 200, 400];
  function save() { AK.store.set('zy.list', list); }
  function render() {
    list.sort(function (a, b) { return b.d.localeCompare(a.d); });
    var total = list.reduce(function (s, r) { return s + AK.n(r.h, 0); }, 0);
    var now = new Date(), prefix = AK.ymd(now).slice(0, 7);
    var month = list.filter(function (r) { return r.d.slice(0, 7) === prefix; }).reduce(function (s, r) { return s + AK.n(r.h, 0); }, 0);
    AK.$('#total').textContent = total % 1 ? total.toFixed(1) : total;
    AK.$('#month').textContent = month % 1 ? month.toFixed(1) : month;
    AK.$('#times').textContent = list.length;
    var next = TIERS.filter(function (t) { return t > total; })[0];
    var reached = TIERS.filter(function (t) { return t <= total; }).length;
    AK.$('#lv').textContent = reached ? '已达第 ' + reached + ' 档' : '';
    if (next) {
      AK.$('#pbar').style.width = Math.round(total / next * 100) + '%';
      AK.$('#next').textContent = '距离 ' + next + ' 小时还差 ' + (Math.round((next - total) * 10) / 10) + ' 小时';
    } else {
      AK.$('#pbar').style.width = '100%';
      AK.$('#next').textContent = '已超过最高档 ' + TIERS[TIERS.length - 1] + ' 小时';
    }
    AK.$('#cnt').textContent = list.length ? list.length + ' 条' : '';
    AK.$('#list').innerHTML = list.length ? list.map(function (r, i) {
      return '<div class="item"><div class="grow"><div class="t">' + AK.esc(r.n) + '</div><div class="s">' + r.d + ' · ' + r.h + ' 小时</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-i="' + i + '" type="button">删</button></div>';
    }).join('') : '<div class="empty">还没有服务记录</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () { list.splice(Number(b.dataset.i), 1); save(); render(); };
    });
  }
  AK.on('#add', 'click', function () {
    var d = AK.$('#d').value, n = AK.$('#n').value.trim(), h = AK.n(AK.$('#h').value, 0);
    if (!d || !n || h <= 0) { AK.toast('日期、项目、时长都要填'); return; }
    list.push({ d: d, n: n, h: h });
    save(); render();
    AK.$('#n').value = '';
    AK.toast('已记录 ' + h + ' 小时');
  });
  AK.on('#export', 'click', function () {
    var txt = '志愿服务记录\\n' + list.map(function (r) { return r.d + '  ' + r.n + '  ' + r.h + ' 小时'; }).join('\\n') + '\\n合计 ' + list.reduce(function (s, r) { return s + AK.n(r.h, 0); }, 0) + ' 小时';
    AK.copy(txt);
  });
  AK.$('#d').value = AK.ymd();
  render();`
  },
  {
    name: "捐步换算",
    slug: "juanbu-huansuan",
    cat: "公益",
    icon: "👟",
    tagline: "今天走的步，能换多少公益里程",
    theme: ["#0d9488", "#0a4741"],
    bg: "#effbf9",
    desc: "把每天的步数记下来，自动折算成公里数、消耗热量和可捐出的公益金估算值，并展示近七天趋势。适合参加线上捐步活动时做记录，也能督促自己每天走够。",
    feats: [
      "输入步数自动折算公里、千卡与公益金估算",
      "近七天柱状趋势，一眼看出偷懒的日子",
      "累计步数、里程与折算金额汇总",
      "记录保存在本机，可清空重来",
    ],
    body: `
  <section class="card">
    <h2>记录今天</h2>
    <div class="row">
      <input id="steps" type="number" placeholder="今日步数" style="flex:1;min-width:130px">
      <input id="weight" type="number" placeholder="体重 kg" value="60" style="flex:1;min-width:100px">
      <button class="btn btn-main" id="add" type="button">记录</button>
    </div>
    <p class="muted" style="margin-top:8px">按步幅 0.7 米估算里程，每 1 万步折算 1 元公益金。</p>
  </section>
  <section class="card">
    <h2>今日折算</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">今日步数</div>
      <div class="big" id="today" style="color:#fff">0</div>
      <div class="lbl" id="convert" style="margin-top:6px">—</div>
    </div>
    <div id="detail"></div>
  </section>
  <section class="card">
    <h2>近七天 <small id="sum"></small></h2>
    <div id="chart" style="display:flex;align-items:flex-end;gap:8px;height:130px"></div>
    <div id="days" style="display:flex;gap:8px;margin-top:6px"></div>
    <div id="list" style="margin-top:12px"></div>
  </section>`,
    init: `
  var log = AK.store.get('juanbu.log', []);
  function save() { AK.store.set('juanbu.log', log); }
  function find(d) { return log.filter(function (r) { return r.d === d; })[0]; }
  function calc() {
    var steps = AK.n(AK.$('#steps').value, 0);
    var w = AK.n(AK.$('#weight').value, 60);
    var km = steps * 0.7 / 1000;
    var kcal = Math.round(steps * 0.04 * w / 60 * 10) / 10;
    var money = steps / 10000;
    AK.$('#today').textContent = steps.toLocaleString('zh-CN');
    AK.$('#convert').textContent = '≈ ' + km.toFixed(2) + ' 公里 · ' + kcal.toFixed(1) + ' 千卡 · 公益金 ' + money.toFixed(2) + ' 元';
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>折算里程</span><b>' + km.toFixed(2) + ' 公里</b></div>' +
      '<div class="kv"><span>消耗热量</span><b>' + kcal.toFixed(1) + ' 千卡</b></div>' +
      '<div class="kv"><span>可捐公益金</span><b>' + money.toFixed(2) + ' 元</b></div>';
  }
  function render() {
    var days = [], max = 1;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var key = AK.ymd(d);
      var r = find(key);
      var v = r ? AK.n(r.steps, 0) : 0;
      max = Math.max(max, v);
      days.push({ key: key, label: (d.getMonth() + 1) + '/' + d.getDate(), v: v, w: r ? r.w : 0 });
    }
    AK.$('#chart').innerHTML = days.map(function (d) {
      var h = Math.round(d.v / max * 110) + 4;
      return '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center">' +
        '<div style="font-size:10px;color:var(--ink3);margin-bottom:3px">' + (d.v ? Math.round(d.v / 1000) + 'k' : '') + '</div>' +
        '<div style="width:100%;height:' + h + 'px;border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,var(--a),var(--b))"></div></div>';
    }).join('');
    AK.$('#days').innerHTML = days.map(function (d) { return '<div style="flex:1;text-align:center;font-size:10px;color:var(--ink3)">' + d.label + '</div>'; }).join('');
    var totalSteps = log.reduce(function (s, r) { return s + AK.n(r.steps, 0); }, 0);
    AK.$('#sum').textContent = '累计 ' + totalSteps.toLocaleString('zh-CN') + ' 步 · ' + (totalSteps * 0.7 / 1000).toFixed(1) + ' 公里';
    var recent = log.slice().sort(function (a, b) { return b.d.localeCompare(a.d); }).slice(0, 7);
    AK.$('#list').innerHTML = recent.length ? recent.map(function (r, i) {
      return '<div class="item"><div class="grow"><div class="t">' + r.d + '</div><div class="s">' + AK.n(r.steps, 0).toLocaleString('zh-CN') + ' 步 · ' + (AK.n(r.steps, 0) * 0.7 / 1000).toFixed(2) + ' 公里</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-d="' + r.d + '" type="button">删</button></div>';
    }).join('') : '<div class="empty">还没有记录，先记今天的步数</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        log = log.filter(function (r) { return r.d !== b.dataset.d; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var steps = AK.n(AK.$('#steps').value, 0);
    if (steps <= 0) { AK.toast('填一下步数'); return; }
    var w = AK.n(AK.$('#weight').value, 60);
    var key = AK.ymd();
    log = log.filter(function (r) { return r.d !== key; });
    log.push({ d: key, steps: steps, w: w });
    save(); render(); calc();
    AK.toast('已记录今天 ' + steps + ' 步');
  });
  ['#steps', '#weight'].forEach(function (s) { AK.on(s, 'input', calc); });
  var today = find(AK.ymd());
  if (today) { AK.$('#steps').value = today.steps; if (today.w) AK.$('#weight').value = today.w; }
  calc(); render();`
  },
  {
    name: "旧物交换板",
    slug: "jiuwu-jiaohuanban",
    cat: "公益",
    icon: "🔁",
    tagline: "闲置清单列出来，换掉比扔掉好",
    theme: ["#8e6cd1", "#3d2a6b"],
    bg: "#f7f4fd",
    desc: "把家里闲置的物品登记进来，标注成色和想换的东西，标记已换出后自动归档。适合小区、宿舍、办公室内部流转闲置，先记账再换物，避免东西越堆越多。",
    feats: [
      "登记物品名、成色、想换什么，列表按状态分组",
      "一键标记「已换出」，自动从待换列表移除",
      "统计累计换出件数，成就感看得见",
      "数据保存在本机，可随时增删",
    ],
    body: `
  <section class="card">
    <h2>登记闲置</h2>
    <div class="grid2">
      <div><label>物品</label><input id="n" placeholder="如 台灯"></div>
      <div><label>成色</label><select id="c"><option>几乎全新</option><option>九成新</option><option>正常使用痕迹</option><option>有瑕疵</option></select></div>
    </div>
    <div class="field" style="margin-top:12px"><label>想换什么</label><input id="w" placeholder="如 换一本小说 / 换绿植"></div>
    <button class="btn btn-main" id="add" type="button">加入清单</button>
  </section>
  <section class="card">
    <h2>待交换 <small id="cnt"></small></h2>
    <div id="open"></div>
  </section>
  <section class="card">
    <h2>已换出 <small id="done"></small></h2>
    <div id="closed"></div>
  </section>`,
    init: `
  var list = AK.store.get('swap.list', []);
  function save() { AK.store.set('swap.list', list); }
  function render() {
    var open = list.filter(function (x) { return !x.done; });
    var closed = list.filter(function (x) { return x.done; });
    AK.$('#cnt').textContent = open.length + ' 件待换';
    AK.$('#done').textContent = closed.length ? '已换出 ' + closed.length + ' 件' : '';
    AK.$('#open').innerHTML = open.length ? open.map(function (x) {
      return '<div class="item"><div class="grow"><div class="t">' + AK.esc(x.n) + '</div>' +
        '<div class="s">' + AK.esc(x.c) + ' · ' + (x.w ? '想换：' + AK.esc(x.w) : '不限交换物') + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-id="' + x.id + '" type="button">已换出</button></div>';
    }).join('') : '<div class="empty">还没有闲置，先把不用但还好的东西记下来</div>';
    AK.$('#closed').innerHTML = closed.length ? closed.map(function (x) {
      return '<div class="item done"><div class="grow"><div class="t">' + AK.esc(x.n) + '</div><div class="s">已换出</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-del="' + x.id + '" type="button">删除</button></div>';
    }).join('') : '<div class="empty">换出去的会出现在这里</div>';
    AK.$$('#open button').forEach(function (b) {
      b.onclick = function () {
        list.forEach(function (x) { if (x.id === b.dataset.id) x.done = true; });
        save(); render();
        AK.toast('已标记换出');
      };
    });
    AK.$$('#closed button').forEach(function (b) {
      b.onclick = function () {
        list = list.filter(function (x) { return x.id !== b.dataset.del; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var n = AK.$('#n').value.trim();
    if (!n) { AK.toast('填一下物品名'); return; }
    list.unshift({ id: AK.uid(), n: n, c: AK.$('#c').value, w: AK.$('#w').value.trim(), done: false });
    save(); render();
    AK.$('#n').value = ''; AK.$('#w').value = '';
    AK.toast('已加入清单');
  });
  render();`
  },
  {
    name: "低碳打卡",
    slug: "ditan-daka",
    cat: "公益",
    icon: "🌱",
    tagline: "每天勾几件小事，攒出减排量",
    theme: ["#3f9c35", "#184d13"],
    bg: "#f3fbf1",
    desc: "把步行代替开车、少点外卖、自带杯、空调调高一度等低碳行为做成每日清单，勾选后按经验值折算减排量，累计显示本月减排与连续打卡天数。",
    feats: [
      "八项常见低碳行为，按减排系数折算克数",
      "每日打卡进度、连续天数、本月累计减排",
      "历史打卡日历，一眼看出坚持情况",
      "数据保存在本机，不需登录",
    ],
    body: `
  <section class="card">
    <h2>今天做到了吗 <small id="today"></small></h2>
    <div id="acts"></div>
  </section>
  <section class="card">
    <h2>累计 <small>折算为减排量</small></h2>
    <div class="grid3">
      <div><div class="muted">本月减排</div><div class="big" id="month">0</div></div>
      <div><div class="muted">连续打卡</div><div class="big" id="streak">0</div></div>
      <div><div class="muted">累计天数</div><div class="big" id="days">0</div></div>
    </div>
    <p class="muted" style="margin-top:8px">单位：千克二氧化碳当量，按常见减排经验值估算，仅作记录参考。</p>
  </section>
  <section class="card">
    <h2>最近 14 天</h2>
    <div id="cal" style="display:flex;gap:5px;flex-wrap:wrap"></div>
  </section>`,
    init: `
  var ACTS = [
    { k: 'walk', n: '步行 / 骑行代替开车', v: 1.2 },
    { k: 'veg', n: '今天有一餐是素食', v: 0.8 },
    { k: 'cup', n: '自带杯或餐具', v: 0.1 },
    { k: 'bag', n: '不用一次性塑料袋', v: 0.05 },
    { k: 'ac', n: '空调调高 1 度', v: 0.6 },
    { k: 'light', n: '离开时关灯关空调', v: 0.2 },
    { k: 'order', n: '没点外卖', v: 0.4 },
    { k: 'recycle', n: '垃圾分类与回收', v: 0.3 }
  ];
  var data = AK.store.get('lowcarbon.data', {});
  function save() { AK.store.set('lowcarbon.data', data); }
  function todayKey() { return AK.ymd(); }
  function render() {
    var tk = todayKey();
    var cur = data[tk] || {};
    AK.$('#acts').innerHTML = ACTS.map(function (a) {
      var on = Boolean(cur[a.k]);
      return '<div class="item" style="' + (on ? 'border-color:#bfe6c3;background:#f4fcf3' : '') + '">' +
        '<div class="grow"><div class="t">' + a.n + '</div><div class="s">约减排 ' + a.v + ' kg</div></div>' +
        '<button class="btn ' + (on ? 'btn-main' : 'btn-ghost') + ' btn-sm" data-k="' + a.k + '" type="button">' + (on ? '已做到' : '打卡') + '</button></div>';
    }).join('');
    var doneCount = ACTS.filter(function (a) { return cur[a.k]; }).length;
    AK.$('#today').textContent = doneCount + ' / ' + ACTS.length + ' 项';
    AK.$$('#acts button').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        data[tk] = data[tk] || {};
        data[tk][k] = !data[tk][k];
        save(); render();
      };
    });
    var keys = Object.keys(data);
    var monthPrefix = tk.slice(0, 7);
    var monthSum = 0, dayCount = 0;
    keys.forEach(function (k) {
      var s = ACTS.reduce(function (acc, a) { return acc + (data[k][a.k] ? a.v : 0); }, 0);
      if (s > 0) dayCount++;
      if (k.slice(0, 7) === monthPrefix) monthSum += s;
    });
    AK.$('#month').textContent = monthSum.toFixed(1);
    AK.$('#days').textContent = dayCount;
    var streak = 0, d = new Date();
    for (var i = 0; i < 400; i++) {
      var k2 = AK.ymd(d);
      var s2 = data[k2] ? ACTS.reduce(function (acc, a) { return acc + (data[k2][a.k] ? a.v : 0); }, 0) : 0;
      if (s2 > 0) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    AK.$('#streak').textContent = streak;
    var cells = [];
    for (var j = 13; j >= 0; j--) {
      var dd = new Date(); dd.setDate(dd.getDate() - j);
      var kk = AK.ymd(dd);
      var ss = data[kk] ? ACTS.reduce(function (acc, a) { return acc + (data[kk][a.k] ? a.v : 0); }, 0) : 0;
      var lvl = ss === 0 ? 0 : ss < 1 ? 1 : ss < 2 ? 2 : 3;
      var colors = ['#eef0f8', '#d6f0d4', '#96d791', '#3f9c35'];
      cells.push('<div title="' + kk + ' 减排 ' + ss.toFixed(1) + ' kg" style="width:calc(100% / 7 - 5px);aspect-ratio:1;border-radius:8px;background:' + colors[lvl] + ';display:grid;place-items:center;font-size:10px;color:' + (lvl > 1 ? '#fff' : 'var(--ink3)') + '">' + (dd.getMonth() + 1) + '/' + dd.getDate() + '</div>');
    }
    AK.$('#cal').innerHTML = cells.join('');
  }
  render();`
  },
  {
    name: "领养前检查清单",
    slug: "lingyang-qian-qingdan",
    cat: "公益",
    icon: "🐾",
    tagline: "接它回家之前，先逐条问过自己",
    theme: ["#c2703d", "#6b3410"],
    bg: "#fdf6f0",
    desc: "把领养宠物前最容易被忽略的十件事做成检查清单：居住条件、家人同意、每月开支、出差安排、十年陪伴等。全部勾选后生成一份领养承诺卡，减少冲动领养与二次遗弃。",
    feats: [
      "十项领养前必查项，逐条勾选并显示进度",
      "按每月开支估算列出养宠成本区间",
      "全部勾选后生成可复制的领养承诺卡",
      "勾选状态保存在本机",
    ],
    body: `
  <section class="card">
    <h2>逐项确认 <small id="prog"></small></h2>
    <div id="list"></div>
    <div class="bar" style="margin-top:12px"><i id="pbar" style="width:0%"></i></div>
  </section>
  <section class="card">
    <h2>每月大致开支 <small>按常见区间估算</small></h2>
    <div class="kv"><span>主粮与零食</span><b>150–300 元</b></div>
    <div class="kv"><span>猫砂 / 尿垫</span><b>60–120 元</b></div>
    <div class="kv"><span>疫苗驱虫（年均摊）</span><b>50–100 元</b></div>
    <div class="kv"><span>医疗备用金建议</span><b>每月存 100 元</b></div>
    <div class="kv"><span>合计</span><b>360–620 元 / 月</b></div>
  </section>
  <section class="card">
    <h2>领养承诺卡</h2>
    <pre id="card" class="muted" style="white-space:pre-wrap;font-family:inherit;line-height:1.9;background:#fbf7f3;border-radius:12px;padding:14px">全部勾选后生成承诺卡</pre>
    <button class="btn btn-main btn-sm" id="copy" type="button" style="margin-top:12px">复制承诺卡</button>
  </section>`,
    init: `
  var ITEMS = [
    '家里人（含室友、房东）都同意养',
    '未来十年搬家、出差、生孩子都不打算送走它',
    '每月 400 元以上的固定开支不会影响生活',
    '知道它可能生病，看病一次可能要花上千元',
    '能接受掉毛、抓家具、半夜叫、打扫异味',
    '每天能留出至少半小时陪它、清理',
    '住处允许养宠，且已做好防坠窗、收好电线',
    '已经选好附近的宠物医院并了解疫苗时间表',
    '了解它可能活 12–18 年，不是一时的陪伴',
    '决定了就负责到底，不用「送人」当退路'
  ];
  var checked = AK.store.get('adopt.checked', []);
  function save() { AK.store.set('adopt.checked', checked); }
  function render() {
    AK.$('#list').innerHTML = ITEMS.map(function (t, i) {
      var on = checked.indexOf(i) >= 0;
      return '<label class="item" style="cursor:pointer;' + (on ? 'border-color:#e2c9b3;background:#fffaf5' : '') + '">' +
        '<input type="checkbox" data-i="' + i + '" ' + (on ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#c2703d;flex:0 0 auto">' +
        '<div class="grow"><div class="t" style="font-weight:600;' + (on ? 'text-decoration:line-through;opacity:.65' : '') + '">' + t + '</div></div></label>';
    }).join('');
    AK.$$('#list input').forEach(function (inp) {
      inp.onchange = function () {
        var i = Number(inp.dataset.i);
        if (inp.checked) { if (checked.indexOf(i) < 0) checked.push(i); }
        else checked = checked.filter(function (x) { return x !== i; });
        save(); render();
      };
    });
    var pct = Math.round(checked.length / ITEMS.length * 100);
    AK.$('#prog').textContent = checked.length + ' / ' + ITEMS.length + ' 项';
    AK.$('#pbar').style.width = pct + '%';
    var card = AK.$('#card');
    if (checked.length === ITEMS.length) {
      card.textContent = '领养承诺卡\\n\\n我已经认真考虑过居住、开支、时间和十年陪伴，\\n确认可以为一个小生命负责到底。\\n\\n不因搬家、怀孕、生病、变丑而遗弃，\\n不把它当成礼物转送他人。\\n\\n日期：' + AK.ymd();
    } else {
      card.textContent = '还有 ' + (ITEMS.length - checked.length) + ' 项没有确认，全部勾选后生成承诺卡。';
    }
  }
  AK.on('#copy', 'click', function () {
    if (checked.length < ITEMS.length) { AK.toast('还有没确认的项'); return; }
    AK.copy(AK.$('#card').textContent);
  });
  render();`
  },
  {
    name: "流浪猫投喂记录",
    slug: "liulangmao-touwei-jilu",
    cat: "公益",
    icon: "🐈",
    tagline: "喂过哪只、什么时候喂的，都记清楚",
    theme: ["#c9772b", "#6b3a0d"],
    bg: "#fdf7ee",
    desc: "记录固定投喂点的位置、猫咪特征、喂食内容和时间，方便多人接力时不重复投喂。还能标注是否绝育、是否需要送医，让社区喂养更有秩序。",
    feats: [
      "按投喂点记录猫咪特征、食物与时间",
      "标注绝育 / 待送医状态，方便接力照顾",
      "按最近投喂时间排序，久未投喂的排前面",
      "记录保存在本机，支持增删",
    ],
    body: `
  <section class="card">
    <h2>记录一次投喂</h2>
    <div class="grid2">
      <div><label>投喂点</label><input id="place" placeholder="如 3 号楼后门"></div>
      <div><label>猫咪特征</label><input id="cat" placeholder="如 三花，右耳缺角"></div>
      <div><label>喂了什么</label><input id="food" placeholder="如 干粮 + 水"></div>
      <div><label>状态</label><select id="state"><option>正常</option><option>待绝育</option><option>需送医</option><option>新出现</option></select></div>
    </div>
    <button class="btn btn-main" id="add" type="button" style="margin-top:12px">记录投喂</button>
  </section>
  <section class="card">
    <h2>投喂点清单 <small id="cnt"></small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var list = AK.store.get('cat.list', []);
  function save() { AK.store.set('cat.list', list); }
  function ago(ts) {
    var diff = Math.round((Date.now() - ts) / 3600000);
    if (diff < 1) return '刚刚';
    if (diff < 24) return diff + ' 小时前';
    return Math.round(diff / 24) + ' 天前';
  }
  function render() {
    list.sort(function (a, b) { return a.ts - b.ts; });
    AK.$('#cnt').textContent = list.length ? list.length + ' 条记录' : '';
    AK.$('#list').innerHTML = list.length ? list.map(function (x) {
      var stale = Date.now() - x.ts > 24 * 3600000;
      var badge = x.state && x.state !== '正常' ? '<span class="tag" style="margin-left:6px;background:#fdeaea;color:#b03a24">' + x.state + '</span>' : '';
      return '<div class="item" style="' + (stale ? 'border-color:#f2ddc2;background:#fffdf8' : '') + '">' +
        '<div class="grow"><div class="t">' + AK.esc(x.cat) + badge + '</div>' +
        '<div class="s">' + AK.esc(x.place) + ' · ' + AK.esc(x.food) + ' · ' + ago(x.ts) + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-i="' + x.id + '" type="button">删</button></div>';
    }).join('') : '<div class="empty">还没有投喂记录</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        list = list.filter(function (x) { return x.id !== b.dataset.i; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var place = AK.$('#place').value.trim(), cat = AK.$('#cat').value.trim();
    if (!place || !cat) { AK.toast('投喂点和猫咪特征都要填'); return; }
    list.push({ id: AK.uid(), place: place, cat: cat, food: AK.$('#food').value.trim() || '干粮', state: AK.$('#state').value, ts: Date.now() });
    save(); render();
    AK.$('#cat').value = ''; AK.$('#food').value = '';
    AK.toast('已记录');
  });
  render();`
  },
  {
    name: "BMI 与体脂估算",
    slug: "bmi-tizhi-gusuan",
    cat: "健身",
    icon: "⚖️",
    tagline: "身高体重腰围，算出体脂与理想体重",
    theme: ["#3a7bd5", "#123a6b"],
    bg: "#f1f6fd",
    desc: "输入身高、体重、腰围与性别，算出 BMI、用美国海军公式估算体脂率、理想体重区间和每日基础代谢。比单看体重更能判断身材状态，适合减脂期做参考。",
    feats: [
      "BMI 计算与国标分级（偏瘦 / 正常 / 超重 / 肥胖）",
      "美国海军公式估算体脂率，附男女分档评价",
      "理想体重区间与减重目标所需热量差",
      "基础代谢（Mifflin-St Jeor）同步算出",
    ],
    body: `
  <section class="card">
    <h2>身体数据</h2>
    <div class="grid2">
      <div><label>性别</label><select id="sex"><option value="m">男</option><option value="f">女</option></select></div>
      <div><label>年龄</label><input id="age" type="number" value="28" min="10" max="90"></div>
      <div><label>身高 cm</label><input id="h" type="number" value="172"></div>
      <div><label>体重 kg</label><input id="w" type="number" value="68" step="0.1"></div>
      <div><label>腰围 cm</label><input id="waist" type="number" value="82"></div>
      <div><label>颈围 cm</label><input id="neck" type="number" value="37"></div>
    </div>
  </section>
  <section class="card">
    <h2>结果</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">BMI</div>
      <div class="big" id="bmi" style="color:#fff">—</div>
      <div class="lbl" id="bmiTag" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
  </section>`,
    init: `
  function calc() {
    var sex = AK.$('#sex').value;
    var h = AK.n(AK.$('#h').value, 172), w = AK.n(AK.$('#w').value, 68);
    var waist = AK.n(AK.$('#waist').value, 82), neck = AK.n(AK.$('#neck').value, 37);
    var age = AK.n(AK.$('#age').value, 28);
    var m = h / 100;
    var bmi = w / (m * m);
    AK.$('#bmi').textContent = bmi.toFixed(1);
    var tag = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
    AK.$('#bmiTag').textContent = '国标分级：' + tag + '（正常区间 18.5–23.9）';
    var bf;
    if (sex === 'm') bf = 86.01 * Math.log10(Math.max(1, waist - neck)) - 70.041 * Math.log10(h) + 36.76;
    else bf = 163.205 * Math.log10(Math.max(1, waist + 0)) - 97.684 * Math.log10(h) - 78.387;
    bf = AK.clamp(bf, 3, 60);
    var bfTag = sex === 'm' ? (bf < 10 ? '偏低' : bf < 20 ? '健康' : bf < 25 ? '偏高' : '肥胖') : (bf < 18 ? '偏低' : bf < 28 ? '健康' : bf < 34 ? '偏高' : '肥胖');
    var idealMin = 18.5 * m * m, idealMax = 23.9 * m * m;
    var bmr = sex === 'm' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
    var lose = w - idealMax;
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>体脂率估算</span><b>' + bf.toFixed(1) + '% · ' + bfTag + '</b></div>' +
      '<div class="kv"><span>理想体重区间</span><b>' + idealMin.toFixed(1) + ' – ' + idealMax.toFixed(1) + ' kg</b></div>' +
      '<div class="kv"><span>基础代谢</span><b>' + Math.round(bmr) + ' 千卡 / 天</b></div>' +
      '<div class="kv"><span>减脂建议</span><b>' + (lose > 0.5 ? '先减 ' + lose.toFixed(1) + ' kg，约需 ' + Math.round(lose / 0.5) + ' 周' : '体重已在理想区间') + '</b></div>' +
      '<p class="muted" style="margin-top:10px">体脂为公式估算值，误差约 ±3–5%，仅作趋势参考，不作为医学诊断。</p>';
  }
  ['#sex', '#age', '#h', '#w', '#waist', '#neck'].forEach(function (s) {
    AK.on(s, 'input', calc);
    AK.on(s, 'change', calc);
  });
  calc();`
  },
  {
    name: "七分钟训练",
    slug: "qifen-zhong-xunlian",
    cat: "健身",
    icon: "🔥",
    tagline: "十二个动作，七分钟练遍全身",
    theme: ["#e05252", "#7a1616"],
    bg: "#fdf2f2",
    desc: "经典的七分钟高强度循环训练：十二个自重动作，每个 30 秒、间歇 10 秒，跟随倒计时自动切换。无需器械，在宿舍或办公室就能完成一轮。",
    feats: [
      "12 个自重动作按标准顺序自动轮转",
      "每个动作 30 秒 + 10 秒间歇，倒计时自动切换",
      "练习中有动作要领提示与下一动作预览",
      "支持暂停、跳过与重新开始",
    ],
    body: `
  <section class="card">
    <div class="result" style="text-align:center">
      <div class="lbl" id="phase">准备开始</div>
      <div class="big" id="clock" style="color:#fff;font-size:52px">30</div>
      <div class="lbl" id="round">第 1 / 12 个动作</div>
    </div>
    <div style="text-align:center;margin-top:14px">
      <div style="font-size:20px;font-weight:900" id="name">开合跳</div>
      <p class="muted" id="tip" style="margin-top:6px">双脚开合，手臂上举，保持节奏</p>
    </div>
    <div class="bar" style="margin-top:16px"><i id="pbar" style="width:0%"></i></div>
    <div class="row" style="margin-top:14px;justify-content:center">
      <button class="btn btn-main" id="start" type="button">开始训练</button>
      <button class="btn btn-ghost" id="skip" type="button">跳过</button>
      <button class="btn btn-ghost" id="reset" type="button">重置</button>
    </div>
  </section>
  <section class="card">
    <h2>动作顺序</h2>
    <div id="plan" class="muted" style="line-height:2.1"></div>
  </section>`,
    init: `
  var PLAN = [
    ['开合跳', '双脚开合，手臂上举，保持节奏'],
    ['靠墙静蹲', '背贴墙，大腿平行地面，膝盖不超过脚尖'],
    ['俯卧撑', '手略宽于肩，身体成一条直线'],
    ['卷腹', '下背贴地，用腹部把肩胛卷起'],
    ['台阶踏步', '找一级台阶，左右交替上下'],
    ['深蹲', '臀部向后坐，膝盖对准脚尖'],
    ['三头肌撑体', '手撑椅面，屈肘下压'],
    ['平板支撑', '肘撑地，臀不塌不翘'],
    ['高抬腿', '原地交替抬膝至腰高，加快频率'],
    ['弓步蹲', '左右交替，前膝不超过脚尖'],
    ['俯身侧转', '俯撑状态下左右转体'],
    ['侧平板', '左右各 15 秒，身体成直线']
  ];
  var idx = 0, left = 30, phase = 'idle', timer;
  AK.$('#plan').innerHTML = PLAN.map(function (p, i) { return (i + 1) + '. ' + p[0]; }).join('　·　');
  function paint() {
    AK.$('#name').textContent = PLAN[idx][0];
    AK.$('#tip').textContent = PLAN[idx][1];
    AK.$('#clock').textContent = left;
    AK.$('#round').textContent = phase === 'rest' ? '间歇' : '第 ' + (idx + 1) + ' / ' + PLAN.length + ' 个动作';
    AK.$('#phase').textContent = phase === 'idle' ? '准备开始' : phase === 'work' ? '训练中' : phase === 'rest' ? '休息一下' : '完成';
    AK.$('#pbar').style.width = Math.round((phase === 'work' ? (idx + (30 - left) / 30) / PLAN.length : idx / PLAN.length) * 100) + '%';
  }
  function tick() {
    left--;
    if (left > 0) { paint(); return; }
    if (phase === 'work') {
      if (idx >= PLAN.length - 1) { done(); return; }
      phase = 'rest'; left = 10;
    } else if (phase === 'rest') {
      idx++; phase = 'work'; left = 30;
    }
    paint();
  }
  function start() {
    clearInterval(timer);
    phase = 'work'; left = 30;
    paint();
    timer = setInterval(tick, 1000);
  }
  function done() {
    clearInterval(timer);
    phase = 'done'; left = 0;
    AK.$('#clock').textContent = '✓';
    AK.$('#phase').textContent = '完成一轮，共用时约 7 分钟';
    AK.$('#pbar').style.width = '100%';
    AK.toast('完成！记得拉伸');
  }
  AK.on('#start', 'click', start);
  AK.on('#skip', 'click', function () {
    if (phase === 'idle') return;
    if (idx >= PLAN.length - 1) { done(); return; }
    idx++; left = 30; phase = 'work'; paint();
  });
  AK.on('#reset', 'click', function () {
    clearInterval(timer);
    idx = 0; left = 30; phase = 'idle';
    paint();
  });
  paint();`
  },
  {
    name: "热量缺口计算",
    slug: "reliang-quekou-jisuan",
    cat: "健身",
    icon: "🍚",
    tagline: "每天吃多少，才能稳稳掉秤",
    theme: ["#e0833c", "#7a3d0e"],
    bg: "#fdf5ee",
    desc: "按性别、年龄、身高体重和活动量算出每日消耗（TDEE），再按减脂、维持、增肌三种目标给出建议摄入热量与三大营养素分配。想减脂的人最容易错在吃得过少。",
    feats: [
      "Mifflin 公式算基础代谢，乘活动系数得 TDEE",
      "减脂 / 维持 / 增肌三档目标，给出每日建议摄入",
      "蛋白质、碳水、脂肪按克数分配",
      "估算达到目标体重大约需要几周",
    ],
    body: `
  <section class="card">
    <h2>基础数据</h2>
    <div class="grid2">
      <div><label>性别</label><select id="sex"><option value="m">男</option><option value="f">女</option></select></div>
      <div><label>年龄</label><input id="age" type="number" value="28"></div>
      <div><label>身高 cm</label><input id="h" type="number" value="172"></div>
      <div><label>体重 kg</label><input id="w" type="number" value="68" step="0.1"></div>
      <div><label>活动量</label><select id="act">
        <option value="1.2">久坐（几乎不运动）</option>
        <option value="1.375">轻度（每周 1–3 次）</option>
        <option value="1.55" selected>中度（每周 3–5 次）</option>
        <option value="1.725">高强度（每周 6–7 次）</option>
      </select></div>
      <div><label>目标体重 kg</label><input id="goal" type="number" value="63" step="0.1"></div>
    </div>
    <div class="row" style="margin-top:12px" id="modes">
      <span class="chip on" data-k="cut">减脂</span>
      <span class="chip" data-k="keep">维持</span>
      <span class="chip" data-k="bulk">增肌</span>
    </div>
  </section>
  <section class="card">
    <h2>每日建议 <small id="tdee"></small></h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">建议摄入</div>
      <div class="big" id="target" style="color:#fff">—</div>
      <div class="lbl" id="delta" style="margin-top:4px"></div>
    </div>
    <div id="macros"></div>
    <p class="muted" id="eta" style="margin-top:10px"></p>
  </section>`,
    init: `
  var mode = 'cut';
  function calc() {
    var sex = AK.$('#sex').value;
    var age = AK.n(AK.$('#age').value, 28), h = AK.n(AK.$('#h').value, 172), w = AK.n(AK.$('#w').value, 68);
    var act = AK.n(AK.$('#act').value, 1.55), goal = AK.n(AK.$('#goal').value, w);
    var bmr = sex === 'm' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
    var tdee = bmr * act;
    var delta = mode === 'cut' ? -450 : mode === 'bulk' ? 300 : 0;
    var target = Math.max(1200, Math.round(tdee + delta));
    AK.$('#tdee').textContent = 'TDEE ' + Math.round(tdee) + ' 千卡';
    AK.$('#target').innerHTML = target + ' <span style="font-size:14px;font-weight:700">千卡</span>';
    AK.$('#delta').textContent = (delta === 0 ? '维持体重，不增不减' : (delta < 0 ? '比消耗少 ' + (-delta) + ' 千卡 / 天' : '比消耗多 ' + delta + ' 千卡 / 天'));
    var pRatio = mode === 'bulk' ? 1.8 : 2.0;
    var protein = Math.round(w * pRatio);
    var fat = Math.round(target * 0.27 / 9);
    var carb = Math.round((target - protein * 4 - fat * 9) / 4);
    AK.$('#macros').innerHTML =
      '<div class="kv"><span>蛋白质</span><b>' + protein + ' g（' + protein * 4 + ' 千卡）</b></div>' +
      '<div class="kv"><span>碳水</span><b>' + Math.max(0, carb) + ' g（' + Math.max(0, carb) * 4 + ' 千卡）</b></div>' +
      '<div class="kv"><span>脂肪</span><b>' + fat + ' g（' + fat * 9 + ' 千卡）</b></div>';
    var diff = w - goal;
    if (mode === 'cut' && diff > 0) {
      var weeks = Math.ceil(diff / (450 * 7 / 7700));
      AK.$('#eta').textContent = '按每天 450 千卡缺口，约 ' + weeks + ' 周到目标体重 ' + goal + ' kg（理想情况下每周掉 0.4 公斤左右）。';
    } else if (mode === 'bulk' && diff < 0) {
      AK.$('#eta').textContent = '按每天 300 千卡盈余，增重 1 公斤大约需要 3–4 周，建议配合力量训练。';
    } else {
      AK.$('#eta').textContent = '保持当前摄入，体重会稳定在 ' + w + ' kg 附近；想改变体型请调整目标。';
    }
  }
  AK.$$('#modes .chip').forEach(function (c) {
    c.onclick = function () {
      mode = c.dataset.k;
      AK.$$('#modes .chip').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
      calc();
    };
  });
  ['#sex', '#age', '#h', '#w', '#act', '#goal'].forEach(function (s) {
    AK.on(s, 'input', calc); AK.on(s, 'change', calc);
  });
  calc();`
  },
  {
    name: "跑步配速换算",
    slug: "paobu-peisu-huansuan",
    cat: "健身",
    icon: "🏃",
    tagline: "配速、时速、完赛时间一次算清",
    theme: ["#f26b3a", "#7d2a0c"],
    bg: "#fdf4ef",
    desc: "输入距离和用时，算出每公里配速与时速，并推算 5 公里、10 公里、半马、全马的预计完赛时间。跑步训练安排配速时随手一查，不用记公式。",
    feats: [
      "距离 + 用时算出配速（分/公里）与时速",
      "反查模式：给定配速算目标距离需要的用时",
      "推算 5K / 10K / 半马 / 全马完赛时间",
      "常用配速区间对照，方便安排训练强度",
    ],
    body: `
  <section class="card">
    <h2>输入</h2>
    <div class="row" style="margin-bottom:12px">
      <span class="chip on" id="m1">按距离算配速</span>
      <span class="chip" id="m2">按配速算用时</span>
    </div>
    <div class="grid3">
      <div><label>距离 km</label><input id="dist" type="number" value="10" step="0.1"></div>
      <div><label>用时 时</label><input id="hh" type="number" value="0" min="0"></div>
      <div><label>用时 分</label><input id="mm" type="number" value="55" min="0" max="59"></div>
    </div>
    <div class="grid2" style="margin-top:10px">
      <div><label>目标配速 分</label><input id="pm" type="number" value="5" min="0"></div>
      <div><label>目标配速 秒</label><input id="ps" type="number" value="30" min="0" max="59"></div>
    </div>
  </section>
  <section class="card">
    <h2>结果</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl" id="lbl">配速</div>
      <div class="big" id="pace" style="color:#fff">—</div>
      <div class="lbl" id="sub" style="margin-top:4px"></div>
    </div>
    <div id="pred" style="margin-bottom:10px"></div>
    <h2 style="font-size:13px;margin:14px 0 8px">常用配速对照</h2>
    <table id="tbl"><thead><tr><th>配速</th><th>5K</th><th>10K</th><th>半马</th><th>全马</th></tr></thead><tbody></tbody></table>
  </section>`,
    init: `
  function two(n) { return n < 10 ? '0' + n : String(n); }
  function secToHMS(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? h + ':' + two(m) + ':' + two(s) : m + ':' + two(s);
  }
  var mode = 'pace';
  function calc() {
    var dist = AK.n(AK.$('#dist').value, 10);
    var secs = AK.n(AK.$('#hh').value, 0) * 3600 + AK.n(AK.$('#mm').value, 0) * 60;
    var psec = AK.n(AK.$('#pm').value, 5) * 60 + AK.n(AK.$('#ps').value, 0);
    if (mode === 'pace') {
      if (dist <= 0 || secs <= 0) { AK.$('#pace').textContent = '—'; return; }
      var per = secs / dist;
      AK.$('#lbl').textContent = '平均配速';
      AK.$('#pace').innerHTML = Math.floor(per / 60) + "'" + two(Math.round(per % 60)) + '" <span style="font-size:14px">/ 公里</span>';
      AK.$('#sub').textContent = '时速 ' + (3600 / per).toFixed(2) + ' km/h · 总里程 ' + dist + ' 公里 · 总用时 ' + secToHMS(secs);
      psec = per;
    } else {
      if (psec <= 0) { AK.$('#pace').textContent = '—'; return; }
      var need = psec * dist;
      AK.$('#lbl').textContent = '所需用时（' + dist + ' 公里）';
      AK.$('#pace').innerHTML = secToHMS(need);
      AK.$('#sub').textContent = '配速 ' + Math.floor(psec / 60) + "'" + two(Math.round(psec % 60)) + '" / 公里 · 时速 ' + (3600 / psec).toFixed(2) + ' km/h';
      secs = need;
    }
    var races = [['5 公里', 5], ['10 公里', 10], ['半程马拉松', 21.0975], ['全程马拉松', 42.195]];
    AK.$('#pred').innerHTML = races.map(function (r) {
      return '<div class="kv"><span>按此配速跑 ' + r[0] + '</span><b>' + secToHMS(psec * r[1]) + '</b></div>';
    }).join('');
    var rows = '';
    for (var p = 240; p <= 480; p += 30) {
      rows += '<tr><td>' + Math.floor(p / 60) + "'" + two(p % 60) + '"</td>' +
        [5, 10, 21.0975, 42.195].map(function (d) { return '<td>' + secToHMS(p * d) + '</td>'; }).join('') + '</tr>';
    }
    AK.$('#tbl tbody').innerHTML = rows;
  }
  AK.$('#m1').onclick = function () { mode = 'pace'; this.classList.add('on'); AK.$('#m2').classList.remove('on'); calc(); };
  AK.$('#m2').onclick = function () { mode = 'time'; this.classList.add('on'); AK.$('#m1').classList.remove('on'); calc(); };
  ['#dist', '#hh', '#mm', '#pm', '#ps'].forEach(function (s) { AK.on(s, 'input', calc); });
  calc();`
  },
  {
    name: "睡眠周期计算",
    slug: "shuimian-zhouqi-jisuan",
    cat: "健身",
    icon: "😴",
    tagline: "按 90 分钟周期倒推，几点睡几点起最合适",
    theme: ["#4c5bd4", "#1b2360"],
    bg: "#f2f3fd",
    desc: "以 90 分钟为一个睡眠周期，按入睡时间和起床时间两种方式倒推：给出最适合的入睡时刻或闹钟时间，避开深睡期被打断造成的起床昏沉。",
    feats: [
      "以 90 分钟周期为基准，给出 4/5/6 个周期的时刻表",
      "支持按起床时间倒推入睡，或按入睡时间推起床",
      "自动计入 15 分钟入睡缓冲",
      "附睡眠时长与对应建议",
    ],
    body: `
  <section class="card">
    <h2>计算方式</h2>
    <div class="row" style="margin-bottom:12px">
      <span class="chip on" id="m1">我要几点起</span>
      <span class="chip" id="m2">我现在几点睡</span>
    </div>
    <div class="grid2">
      <div><label>时间</label><input id="t" type="time" value="07:00"></div>
      <div><label>入睡缓冲（分钟）</label><input id="buffer" type="number" value="15" min="0" max="60"></div>
    </div>
  </section>
  <section class="card">
    <h2>推荐时刻 <small id="hint"></small></h2>
    <div id="list"></div>
    <p class="muted" style="margin-top:10px">建议优先选 5 个周期（7.5 小时）；少于 4 个周期长期会影响状态，偶尔一晚问题不大。</p>
  </section>`,
    init: `
  var mode = 'wake';
  function fmt(minutes) {
    var m = ((minutes % 1440) + 1440) % 1440;
    return AK.pad(Math.floor(m / 60)) + ':' + AK.pad(m % 60);
  }
  function calc() {
    var v = AK.$('#t').value || '07:00';
    var parts = v.split(':');
    var base = Number(parts[0]) * 60 + Number(parts[1]);
    var buffer = AK.n(AK.$('#buffer').value, 15);
    var rows = [];
    for (var cycles = 6; cycles >= 3; cycles--) {
      var dur = cycles * 90;
      var time = mode === 'wake' ? base - dur - buffer : base + dur + buffer;
      rows.push({ cycles: cycles, dur: dur, time: time });
    }
    AK.$('#hint').textContent = mode === 'wake' ? '按起床时间倒推，该在这个点睡' : '按入睡时间往后推，该在这个点起';
    AK.$('#list').innerHTML = rows.map(function (r) {
      var h = Math.floor(r.dur / 60), m = r.dur % 60;
      var best = r.cycles === 5 ? ' style="border-color:var(--a);background:#f6f7ff"' : '';
      return '<div class="item"' + best + '><div class="grow"><div class="t">' + r.cycles + ' 个周期 · ' + h + ' 小时' + (m ? ' ' + m + ' 分' : '') + (r.cycles === 5 ? '（推荐）' : '') + '</div>' +
        '<div class="s">' + (mode === 'wake' ? '入睡时间' : '起床时间') + '</div></div>' +
        '<b style="font-size:22px;color:var(--a);font-variant-numeric:tabular-nums">' + fmt(r.time) + '</b></div>';
    }).join('');
  }
  AK.$('#m1').onclick = function () { mode = 'wake'; this.classList.add('on'); AK.$('#m2').classList.remove('on'); calc(); };
  AK.$('#m2').onclick = function () { mode = 'sleep'; this.classList.add('on'); AK.$('#m1').classList.remove('on'); calc(); };
  AK.on('#t', 'input', calc); AK.on('#buffer', 'input', calc);
  calc();`
  },
  {
    name: "组间休息计时器",
    slug: "zujian-xiuxi-jishiqi",
    cat: "健身",
    icon: "⏱️",
    tagline: "练几秒、歇几秒，自动帮你数",
    theme: ["#2f3742", "#12161c"],
    bg: "#f4f5f7",
    desc: "力量训练专用计时器：设置组数、每组时长和组间休息，开始后自动在训练与休息之间切换，并用提示音提醒，不必一边举铁一边看手机。",
    feats: [
      "自定义组数、每组秒数与组间休息秒数",
      "训练 / 休息自动切换，倒计时大字显示",
      "每组结束有提示音，可随时暂停与跳过",
      "进度条与已完成组数实时显示",
    ],
    body: `
  <section class="card">
    <h2>训练参数</h2>
    <div class="grid3">
      <div><label>组数</label><input id="sets" type="number" value="4" min="1" max="30"></div>
      <div><label>每组秒数</label><input id="work" type="number" value="40" min="5" max="300"></div>
      <div><label>休息秒数</label><input id="rest" type="number" value="60" min="5" max="300"></div>
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-main" id="start" type="button">开始</button>
      <button class="btn btn-ghost" id="pause" type="button">暂停</button>
      <button class="btn btn-ghost" id="skip" type="button">跳过</button>
    </div>
  </section>
  <section class="card">
    <div class="result" style="text-align:center">
      <div class="lbl" id="phase">准备</div>
      <div class="big" id="clock" style="color:#fff;font-size:56px">--</div>
      <div class="lbl" id="setinfo">共 4 组</div>
    </div>
    <div class="bar" style="margin-top:16px"><i id="pbar" style="width:0%"></i></div>
  </section>`,
    init: `
  var phase = 'idle', left = 0, doneSets = 0, timer = null, paused = false;
  var audioCtx = null;
  function beep(freq, dur) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq || 880;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.18));
      o.start(); o.stop(audioCtx.currentTime + (dur || 0.18));
    } catch (e) {}
  }
  function cfg() {
    return {
      sets: AK.clamp(AK.n(AK.$('#sets').value, 4), 1, 30),
      work: AK.clamp(AK.n(AK.$('#work').value, 40), 5, 300),
      rest: AK.clamp(AK.n(AK.$('#rest').value, 60), 5, 300)
    };
  }
  function paint() {
    var c = cfg();
    AK.$('#clock').textContent = phase === 'idle' ? '--' : AK.hm(left);
    AK.$('#phase').textContent = phase === 'idle' ? '准备' : phase === 'work' ? '训练中' : phase === 'rest' ? '休息' : '完成';
    AK.$('#setinfo').textContent = phase === 'idle' ? '共 ' + c.sets + ' 组' : '第 ' + Math.min(doneSets + 1, c.sets) + ' / ' + c.sets + ' 组';
    var total = c.sets * (c.work + c.rest);
    var elapsed = doneSets * (c.work + c.rest) + (phase === 'work' ? c.work - left : phase === 'rest' ? c.work + (c.rest - left) : 0);
    AK.$('#pbar').style.width = Math.round(AK.clamp(elapsed / total, 0, 1) * 100) + '%';
  }
  function tick() {
    if (paused) return;
    left--;
    if (left <= 0) {
      var c = cfg();
      if (phase === 'work') { beep(660); phase = 'rest'; left = c.rest; }
      else if (phase === 'rest') {
        doneSets++;
        beep(990);
        if (doneSets >= c.sets) { finish(); return; }
        phase = 'work'; left = c.work;
      }
    }
    paint();
  }
  function finish() {
    clearInterval(timer); timer = null;
    phase = 'done'; left = 0;
    beep(1200, 0.4);
    AK.$('#clock').textContent = '✓';
    AK.$('#phase').textContent = '全部完成';
    AK.$('#setinfo').textContent = '共 ' + doneSets + ' 组';
    AK.$('#pbar').style.width = '100%';
    AK.toast('训练完成，记得拉伸');
  }
  AK.on('#start', 'click', function () {
    clearInterval(timer);
    var c = cfg();
    phase = 'work'; left = c.work; doneSets = 0; paused = false;
    paint();
    timer = setInterval(tick, 1000);
  });
  AK.on('#pause', 'click', function () {
    paused = !paused;
    AK.$('#pause').textContent = paused ? '继续' : '暂停';
  });
  AK.on('#skip', 'click', function () {
    if (phase === 'idle' || phase === 'done') return;
    left = 1;
    tick();
  });
  ['#sets', '#work', '#rest'].forEach(function (s) { AK.on(s, 'input', paint); });
  paint();`
  }
];
