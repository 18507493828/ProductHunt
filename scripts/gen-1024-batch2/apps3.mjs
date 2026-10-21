/* 第二批 · 校园六个 + 社交六个 */
export default [
  {
    name: "课程表冲突检测",
    slug: "kechengbiao-chongtu-jiance",
    cat: "校园",
    icon: "📅",
    tagline: "选课之前先查一遍，别撞在同一节",
    theme: ["#3a6ff0", "#17357a"],
    bg: "#f2f6fe",
    desc: "把选好的课按星期、节次和上课周次录进去，系统自动检测时间冲突并标出冲突的两门课，同时生成一张按星期排列的课表。选课季用来核对时间，比翻教务系统快。",
    feats: [
      "录入课程名、星期、起止节次与周次范围",
      "自动检测同日节次重叠 + 周次重叠的双重冲突",
      "按星期生成课表视图，冲突课程标红提示",
      "课程数据保存在本机，随时增删",
    ],
    body: `
  <section class="card">
    <h2>添加课程</h2>
    <div class="grid2">
      <div><label>课程名</label><input id="name" placeholder="如 高等数学"></div>
      <div><label>星期</label><select id="day"><option>周一</option><option>周二</option><option>周三</option><option>周四</option><option>周五</option><option>周六</option><option>周日</option></select></div>
      <div><label>起始节次</label><input id="from" type="number" min="1" max="12" value="1"></div>
      <div><label>结束节次</label><input id="to" type="number" min="1" max="12" value="2"></div>
      <div><label>起始周</label><input id="w1" type="number" min="1" max="30" value="1"></div>
      <div><label>结束周</label><input id="w2" type="number" min="1" max="30" value="16"></div>
    </div>
    <button class="btn btn-main" id="add" type="button" style="margin-top:12px">加入课表</button>
  </section>
  <section class="card">
    <h2>冲突检查 <small id="cnt"></small></h2>
    <div id="warn"></div>
  </section>
  <section class="card">
    <h2>课表视图</h2>
    <div style="overflow-x:auto"><table id="tbl"><thead></thead><tbody></tbody></table></div>
  </section>`,
    init: `
  var DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  var list = AK.store.get('kcb.list', []);
  function save() { AK.store.set('kcb.list', list); }
  function overlap(a, b) {
    return a.day === b.day && a.from <= b.to && b.from <= a.to && a.w1 <= b.w2 && b.w1 <= a.w2;
  }
  function render() {
    var warnBox = AK.$('#warn');
    var pairs = [];
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
      if (overlap(list[i], list[j])) pairs.push([list[i], list[j]]);
    }
    AK.$('#cnt').textContent = list.length ? list.length + ' 门课 · ' + (pairs.length ? pairs.length + ' 处冲突' : '无冲突') : '';
    if (!list.length) {
      warnBox.innerHTML = '<div class="empty">还没有课程，先在上面添加一门</div>';
    } else if (!pairs.length) {
      warnBox.innerHTML = '<div class="item" style="border-color:#bfe6d6;background:#f2fbf7"><div class="grow"><div class="t" style="color:#1f7a55">时间不冲突，可以放心选</div><div class="s">' + list.length + ' 门课均已检查星期、节次与周次</div></div></div>';
    } else {
      warnBox.innerHTML = pairs.map(function (p) {
        return '<div class="item" style="border-color:#f6cfc7;background:#fdf1ef"><div class="grow"><div class="t" style="color:#b03a24">' + AK.esc(p[0].name) + ' × ' + AK.esc(p[1].name) + '</div><div class="s">' + p[0].day + ' 第 ' + p[0].from + '-' + p[0].to + ' 节 vs 第 ' + p[1].from + '-' + p[1].to + ' 节 · 周次 ' + p[0].w1 + '-' + p[0].w2 + ' / ' + p[1].w1 + '-' + p[1].w2 + '</div></div></div>';
      }).join('');
    }
    var head = '<tr><th>节次</th>' + DAYS.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr>';
    AK.$('#tbl thead').innerHTML = head;
    var rows = [];
    for (var p = 1; p <= 12; p++) {
      var tds = '<td style="color:var(--ink3)">' + p + '</td>';
      for (var d2 = 0; d2 < 7; d2++) {
        var hit = list.filter(function (c) { return c.day === DAYS[d2] && p >= c.from && p <= c.to; });
        tds += '<td>' + hit.map(function (c) {
          var bad = list.some(function (o) { return o !== c && overlap(c, o); });
          return '<div style="font-size:11.5px;font-weight:700;color:' + (bad ? '#c0392b' : 'var(--a)') + '">' + AK.esc(c.name) + (bad ? ' ⚠' : '') + '</div>';
        }).join('') + '</td>';
      }
      rows.push('<tr>' + tds + '</tr>');
    }
    AK.$('#tbl tbody').innerHTML = rows.join('');
  }
  AK.on('#add', 'click', function () {
    var name = AK.$('#name').value.trim();
    if (!name) { AK.toast('先填课程名'); return; }
    var c = {
      name: name,
      day: AK.$('#day').value,
      from: AK.clamp(AK.n(AK.$('#from').value, 1), 1, 12),
      to: AK.clamp(AK.n(AK.$('#to').value, 2), 1, 12),
      w1: AK.clamp(AK.n(AK.$('#w1').value, 1), 1, 30),
      w2: AK.clamp(AK.n(AK.$('#w2').value, 16), 1, 30)
    };
    if (c.to < c.from) { var t = c.to; c.to = c.from; c.from = t; }
    if (c.w2 < c.w1) { var t2 = c.w2; c.w2 = c.w1; c.w1 = t2; }
    list.push(c);
    save(); render();
    AK.$('#name').value = '';
    AK.toast('已加入课表');
  });
  render();`
  },
  {
    name: "考试倒计时",
    slug: "kaoshi-daojishi",
    cat: "校园",
    icon: "⏳",
    tagline: "每一场考试，还剩多少天",
    theme: ["#e0603c", "#8a2b14"],
    bg: "#fdf4f1",
    desc: "把考试名称、日期和科目录进去，按剩余天数排序展示，临近七天标红提醒。支持删除与恢复，数据存在本机，打开就能看到最近要考什么。",
    feats: [
      "录入考试名称与日期，自动计算剩余天数",
      "按日期排序，7 天内标红、已过期待办灰显",
      "显示距今天数与星期几，方便安排复习",
      "数据保存在本机，随时增删",
    ],
    body: `
  <section class="card">
    <h2>添加考试</h2>
    <div class="row">
      <input id="name" placeholder="考试名称，如 数据结构期末" style="flex:2;min-width:150px">
      <input id="date" type="date" style="flex:1;min-width:140px">
      <button class="btn btn-main" id="add" type="button">添加</button>
    </div>
  </section>
  <section class="card">
    <h2>倒计时 <small id="cnt"></small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var list = AK.store.get('exam.list', []);
  function save() { AK.store.set('exam.list', list); }
  function daysTo(d) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  }
  function render() {
    list.sort(function (a, b) { return a.date.localeCompare(b.date); });
    AK.$('#cnt').textContent = list.length ? list.length + ' 场' : '';
    var box = AK.$('#list');
    if (!list.length) { box.innerHTML = '<div class="empty">还没有考试安排</div>'; return; }
    box.innerHTML = list.map(function (e, i) {
      var d = new Date(e.date + 'T00:00:00');
      var left = daysTo(d);
      var color = left < 0 ? 'var(--ink3)' : left <= 7 ? '#c0392b' : 'var(--a)';
      var txt = left < 0 ? '已结束' : left === 0 ? '就是今天' : '还剩 ' + left + ' 天';
      return '<div class="item"><div class="grow"><div class="t">' + AK.esc(e.name) + '</div>' +
        '<div class="s">' + e.date + ' · ' + '周' + '日一二三四五六'[d.getDay()] + '</div></div>' +
        '<b style="color:' + color + ';font-size:14px;white-space:nowrap">' + txt + '</b>' +
        '<button class="btn btn-ghost btn-sm" data-i="' + i + '" type="button">删除</button></div>';
    }).join('');
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        list.splice(Number(b.dataset.i), 1);
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var name = AK.$('#name').value.trim(), date = AK.$('#date').value;
    if (!name || !date) { AK.toast('名称和日期都要填'); return; }
    list.push({ name: name, date: date });
    save(); render();
    AK.$('#name').value = '';
    AK.toast('已添加');
  });
  render();`
  },
  {
    name: "宿舍水电分摊",
    slug: "sushe-shuidian-fentan",
    cat: "校园",
    icon: "🚿",
    tagline: "谁住得久谁多出，分摊算得明白",
    theme: ["#1a9ec4", "#0a4d63"],
    bg: "#f0f9fc",
    desc: "输入本期水费电费总额、宿舍人数和各自在寝天数，按天数加权算每人应摊金额，自动抹平尾差保证合计等于总额。开学、放假交替时最实用。",
    feats: [
      "按在寝天数加权分摊，也可切换为平均分摊",
      "自动处理尾差，保证每人金额合计等于账单总额",
      "宿舍人数可随时增减，天数默认为满勤",
      "一键复制分摊结果，方便发群里",
    ],
    body: `
  <section class="card">
    <h2>账单</h2>
    <div class="grid3">
      <div><label>水费（元）</label><input id="water" type="number" value="60" step="0.01"></div>
      <div><label>电费（元）</label><input id="power" type="number" value="180" step="0.01"></div>
      <div><label>本期总天数</label><input id="totalDays" type="number" value="30" min="1"></div>
    </div>
    <div class="row" style="margin-top:12px">
      <span class="chip on" id="mode-day">按天数分摊</span>
      <span class="chip" id="mode-eq">平均分摊</span>
    </div>
  </section>
  <section class="card">
    <h2>宿舍成员 <small>填写在寝天数</small></h2>
    <div id="members"></div>
    <button class="btn btn-ghost btn-sm" id="add" type="button" style="margin-top:8px">加一个人</button>
  </section>
  <section class="card">
    <h2>分摊结果 <small id="sum"></small></h2>
    <div id="out"></div>
    <button class="btn btn-main btn-sm" id="copy" type="button" style="margin-top:12px">复制结果</button>
  </section>`,
    init: `
  var members = AK.store.get('dorm.members', [
    { name: '室友 A', days: 30 }, { name: '室友 B', days: 30 }, { name: '室友 C', days: 24 }, { name: '室友 D', days: 18 }
  ]);
  var byDay = true;
  function save() { AK.store.set('dorm.members', members); }
  function render() {
    var box = AK.$('#members');
    box.innerHTML = members.map(function (m, i) {
      return '<div class="row" style="margin-bottom:8px">' +
        '<input value="' + AK.esc(m.name) + '" data-i="' + i + '" data-k="name" style="flex:2;min-width:110px">' +
        '<input type="number" min="0" value="' + m.days + '" data-i="' + i + '" data-k="days" style="flex:1;min-width:80px">' +
        '<button class="btn btn-ghost btn-sm" data-del="' + i + '" type="button">删</button></div>';
    }).join('');
    AK.$$('#members input').forEach(function (inp) {
      inp.oninput = function () {
        var i = Number(inp.dataset.i);
        members[i][inp.dataset.k] = inp.dataset.k === 'days' ? AK.n(inp.value, 0) : inp.value;
        save(); calc();
      };
    });
    AK.$$('#members button').forEach(function (b) {
      b.onclick = function () { members.splice(Number(b.dataset.del), 1); save(); render(); };
    });
    calc();
  }
  function calc() {
    var total = AK.n(AK.$('#water').value, 0) + AK.n(AK.$('#power').value, 0);
    var totalDays = Math.max(1, AK.n(AK.$('#totalDays').value, 30));
    var weightSum = byDay ? members.reduce(function (s, m) { return s + Math.max(0, AK.n(m.days, 0)); }, 0) : members.length;
    if (!members.length || weightSum <= 0) {
      AK.$('#out').innerHTML = '<div class="empty">先添加宿舍成员</div>';
      AK.$('#sum').textContent = '';
      return;
    }
    var rows = members.map(function (m) {
      var w = byDay ? Math.max(0, AK.n(m.days, 0)) : 1;
      return { name: m.name || '未命名', days: AK.n(m.days, 0), w: w, val: total * w / weightSum };
    });
    var rounded = rows.map(function (r) { return Math.round(r.val * 100) / 100; });
    var diff = Math.round((total - rounded.reduce(function (a, b) { return a + b; }, 0)) * 100) / 100;
    rounded[0] = Math.round((rounded[0] + diff) * 100) / 100;
    AK.$('#sum').textContent = '合计 ' + total.toFixed(2) + ' 元';
    AK.$('#out').innerHTML = '<div class="kv"><span>分摊方式</span><b>' + (byDay ? '按在寝天数加权' : '平均分摊') + '</b></div>' +
      rows.map(function (r, i) {
        return '<div class="kv"><span>' + AK.esc(r.name) + (byDay ? ' · ' + r.days + ' 天（' + Math.round(weightSum ? r.w / weightSum * 100 : 0) + '%）' : '') + '</span><b>' + rounded[i].toFixed(2) + ' 元</b></div>';
      }).join('');
    AK._share = '本期水电共 ' + total.toFixed(2) + ' 元（水 ' + AK.n(AK.$('#water').value, 0).toFixed(2) + ' + 电 ' + AK.n(AK.$('#power').value, 0).toFixed(2) + '），' + (byDay ? '按在寝天数分摊' : '平均分摊') + '：\\n' +
      rows.map(function (r, i) { return r.name + ' ' + rounded[i].toFixed(2) + ' 元'; }).join('\\n');
  }
  AK.on('#mode-day', 'click', function () { byDay = true; this.classList.add('on'); AK.$('#mode-eq').classList.remove('on'); calc(); });
  AK.on('#mode-eq', 'click', function () { byDay = false; this.classList.add('on'); AK.$('#mode-day').classList.remove('on'); calc(); });
  AK.on('#add', 'click', function () { members.push({ name: '室友 ' + (members.length + 1), days: 30 }); save(); render(); });
  ['#water', '#power', '#totalDays'].forEach(function (s) { AK.on(s, 'input', calc); });
  AK.on('#copy', 'click', function () { calc(); AK.copy(AK._share || ''); });
  render();`
  },
  {
    name: "实验报告生成器",
    slug: "shiyan-baogao-shengchengqi",
    cat: "校园",
    icon: "🧪",
    tagline: "填几个空，报告骨架自动排好",
    theme: ["#5a67d8", "#2a3182"],
    bg: "#f3f4fe",
    desc: "按实验名称、目的、器材、步骤、数据和结论逐项填写，自动生成格式统一的实验报告文本，可一键复制到 Word。省掉每次从上一份作业复制粘贴再改的麻烦。",
    feats: [
      "按实验报告标准结构填写，自动编号排版",
      "步骤与数据支持多行输入，按序号输出",
      "一键复制全文，可直接粘进 Word",
      "内容保存在本机，下次接着改",
    ],
    body: `
  <section class="card">
    <h2>填写内容</h2>
    <div class="field"><label>实验名称</label><input id="f-name" placeholder="如 单摆测重力加速度"></div>
    <div class="field"><label>实验目的</label><textarea id="f-goal" rows="2" placeholder="用单摆测定当地重力加速度"></textarea></div>
    <div class="field"><label>实验器材</label><input id="f-tools" placeholder="单摆装置、秒表、米尺"></div>
    <div class="field"><label>实验步骤（每行一步）</label><textarea id="f-step" rows="4" placeholder="组装单摆并测量摆长&#10;拉开小角度释放并计时 30 次全振动"></textarea></div>
    <div class="field"><label>实验数据（每行一条）</label><textarea id="f-data" rows="3" placeholder="摆长 L = 1.000 m&#10;30 次全振动 t = 60.2 s"></textarea></div>
    <div class="field"><label>结论</label><textarea id="f-res" rows="2" placeholder="g ≈ 9.79 m/s²，与当地标准值偏差 0.4%"></textarea></div>
    <button class="btn btn-main" id="gen" type="button">生成报告</button>
  </section>
  <section class="card">
    <h2>报告预览 <small>可直接复制</small></h2>
    <pre id="out" class="muted" style="white-space:pre-wrap;font-family:inherit;line-height:1.9;background:#f8f9fd;border-radius:12px;padding:14px;min-height:120px">点击「生成报告」查看结果</pre>
    <button class="btn btn-ghost btn-sm" id="copy" type="button" style="margin-top:12px">复制全文</button>
  </section>`,
    init: `
  var FIELDS = [['f-name', 'name'], ['f-goal', 'goal'], ['f-tools', 'tools'], ['f-step', 'step'], ['f-data', 'data'], ['f-res', 'res']];
  var saved = AK.store.get('lab.form', {});
  FIELDS.forEach(function (f) { if (saved[f[1]]) AK.$('#' + f[0]).value = saved[f[1]]; });
  function lines(v) {
    return String(v || '').split(/\\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function build() {
    var d = {};
    FIELDS.forEach(function (f) { d[f[1]] = AK.$('#' + f[0]).value.trim(); });
    AK.store.set('lab.form', d);
    var out = [];
    out.push('实验报告');
    out.push('');
    out.push('一、实验名称');
    out.push(d.name || '（未填写）');
    out.push('');
    out.push('二、实验目的');
    out.push(d.goal || '（未填写）');
    out.push('');
    out.push('三、实验器材');
    out.push(d.tools || '（未填写）');
    out.push('');
    out.push('四、实验步骤');
    var st = lines(d.step);
    out.push(st.length ? st.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\\n') : '（未填写）');
    out.push('');
    out.push('五、实验数据与处理');
    var dt = lines(d.data);
    out.push(dt.length ? dt.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\\n') : '（未填写）');
    out.push('');
    out.push('六、结论与分析');
    out.push(d.res || '（未填写）');
    return out.join('\\n');
  }
  AK.on('#gen', 'click', function () {
    AK.$('#out').textContent = build();
    AK.toast('已生成，可复制到 Word');
  });
  AK.on('#copy', 'click', function () { AK.copy(build()); });
  if (saved.name) AK.$('#out').textContent = build();`
  },
  {
    name: "四六级分数换算",
    slug: "siliuji-fenshu-huansuan",
    cat: "校园",
    icon: "📝",
    tagline: "按各部分得分，算出 710 分制总分",
    theme: ["#2b8a6e", "#0d4a3b"],
    bg: "#f1faf6",
    desc: "四六级总分 710 分，听力、阅读各 249 分，写作与翻译合计 212 分。填入各部分得分即可得到 710 分制总分，判断是否过线，并给出差距分析与提分建议。",
    feats: [
      "三部分得分直接换算为 710 分制总分",
      "自动判定是否达到 425 分及格线",
      "显示与目标的差距，指出哪部分最该补",
      "支持四级 / 六级两套分值标准",
    ],
    body: `
  <section class="card">
    <h2>各部分得分</h2>
    <div class="grid3">
      <div><label>听力（0–249）</label><input id="a" type="number" value="180" min="0" max="249"></div>
      <div><label>阅读（0–249）</label><input id="b" type="number" value="175" min="0" max="249"></div>
      <div><label>写作翻译（0–212）</label><input id="c" type="number" value="150" min="0" max="212"></div>
    </div>
    <div class="row" style="margin-top:12px">
      <span class="chip on" id="m4">四级</span>
      <span class="chip" id="m6">六级</span>
      <span class="muted" id="hint">四级 425 分及格</span>
    </div>
  </section>
  <section class="card">
    <h2>换算结果</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">710 分制总分</div>
      <div class="big" id="total" style="color:#fff">0</div>
      <div class="lbl" id="pass" style="margin-top:6px">—</div>
    </div>
    <div id="detail"></div>
  </section>`,
    init: `
  var mode = 4;
  function calc() {
    var a = AK.clamp(AK.n(AK.$('#a').value, 0), 0, 249);
    var b = AK.clamp(AK.n(AK.$('#b').value, 0), 0, 249);
    var c = AK.clamp(AK.n(AK.$('#c').value, 0), 0, 212);
    var total = Math.round(a + b + c);
    AK.$('#total').textContent = total;
    var pass = total >= 425;
    AK.$('#pass').textContent = pass ? '已达 ' + (mode === 4 ? '四级' : '六级') + ' 425 分及格线' : '距离 425 分还差 ' + (425 - total) + ' 分';
    var parts = [['听力', a, 249], ['阅读', b, 249], ['写作翻译', c, 212]];
    var worst = parts.slice().sort(function (x, y) { return x[1] / x[2] - y[1] / y[2]; })[0];
    AK.$('#detail').innerHTML = parts.map(function (p) {
      var pct = Math.round(p[1] / p[2] * 100);
      return '<div style="margin-bottom:10px"><div class="row spread" style="font-size:12.5px;font-weight:700"><span>' + p[0] + '</span><span>' + p[1] + ' / ' + p[2] + '（' + pct + '%）</span></div>' +
        '<div class="bar" style="margin-top:5px"><i style="width:' + pct + '%"></i></div></div>';
    }).join('') +
      '<p class="muted" style="margin-top:6px">得分率最低的是「' + worst[0] + '」（' + Math.round(worst[1] / worst[2] * 100) + '%），优先补这一项提升最快。' +
      (pass ? '' : '如按当前比例，需要每部分再提高约 ' + Math.ceil((425 - total) / 3) + ' 分。') + '</p>';
  }
  AK.on('#m4', 'click', function () { mode = 4; this.classList.add('on'); AK.$('#m6').classList.remove('on'); AK.$('#hint').textContent = '四级 425 分及格'; calc(); });
  AK.on('#m6', 'click', function () { mode = 6; this.classList.add('on'); AK.$('#m4').classList.remove('on'); AK.$('#hint').textContent = '六级 425 分及格'; calc(); });
  ['#a', '#b', '#c'].forEach(function (s) { AK.on(s, 'input', calc); });
  calc();`
  },
  {
    name: "课堂座位表生成",
    slug: "zuoweibiao-shengcheng",
    cat: "校园",
    icon: "🪑",
    tagline: "名单打乱，一键排成座位表",
    theme: ["#b7791f", "#6b3d08"],
    bg: "#fdf8ef",
    desc: "填写行列数与班级名单，随机打乱后生成座位表，支持按列或按行顺序落座、避开同桌熟人（同姓不邻座）。生成的表格可一键复制，打印或贴到讲台上都行。",
    feats: [
      "自定义行列数，名单自动打乱排座",
      "支持「同姓不同桌」开关，减少扎堆",
      "座位表以表格呈现，空位自动留白",
      "一键复制为文本，直接贴进 Word 或群消息",
    ],
    body: `
  <section class="card">
    <h2>排座设置</h2>
    <div class="grid2">
      <div><label>行数</label><input id="rows" type="number" value="6" min="1" max="12"></div>
      <div><label>列数</label><input id="cols" type="number" value="6" min="1" max="12"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>名单（每行一个，或用逗号分隔）</label><textarea id="names" rows="5" placeholder="张三&#10;李四&#10;王五"></textarea></div>
    <div class="row">
      <span class="chip on" id="tog">同姓不同桌</span>
      <button class="btn btn-main" id="gen" type="button">生成座位表</button>
    </div>
  </section>
  <section class="card">
    <h2>座位表 <small id="info"></small></h2>
    <div style="overflow-x:auto"><table id="tbl"></table></div>
    <button class="btn btn-ghost btn-sm" id="copy" type="button" style="margin-top:12px">复制文本</button>
  </section>`,
    init: `
  var avoidSame = true, last = null;
  function parseNames() {
    return String(AK.$('#names').value || '').split(/[\\n,，、\\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gen() {
    var rows = AK.clamp(AK.n(AK.$('#rows').value, 6), 1, 12);
    var cols = AK.clamp(AK.n(AK.$('#cols').value, 6), 1, 12);
    var names = shuffle(parseNames());
    var cap = rows * cols;
    if (!names.length) { AK.toast('先填名单'); return; }
    if (names.length > cap) { AK.toast('座位只有 ' + cap + ' 个，名单多了 ' + (names.length - cap) + ' 人'); names = names.slice(0, cap); }
    if (avoidSame) {
      for (var pass = 0; pass < 60; pass++) {
        var bad = false;
        for (var r = 0; r < rows && !bad; r++) for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          if (!names[i]) continue;
          if (c + 1 < cols && names[i + 1] && names[i][0] === names[i + 1][0]) bad = true;
          if (r + 1 < rows && names[i + cols] && names[i][0] === names[i + cols][0]) bad = true;
        }
        if (!bad) break;
        shuffle(names);
      }
    }
    var head = '<tr><th style="width:44px">#</th>';
    for (var c2 = 1; c2 <= cols; c2++) head += '<th>第 ' + c2 + ' 列</th>';
    head += '</tr>';
    var body = '';
    var txt = [];
    for (var r2 = 0; r2 < rows; r2++) {
      var tr = '<tr><td style="color:var(--ink3)">' + (r2 + 1) + '</td>';
      var line = [];
      for (var c3 = 0; c3 < cols; c3++) {
        var nm = names[r2 * cols + c3] || '';
        tr += '<td style="' + (nm ? 'font-weight:700' : 'color:var(--ink3)') + '">' + (nm || '空位') + '</td>';
        line.push(nm || '空位');
      }
      tr += '</tr>';
      body += tr;
      txt.push('第 ' + (r2 + 1) + ' 排：' + line.join(' | '));
    }
    AK.$('#tbl').innerHTML = head + body;
    AK.$('#info').textContent = names.length + ' 人 · ' + rows + ' 行 ' + cols + ' 列';
    last = txt.join('\\n');
  }
  AK.on('#tog', 'click', function () { avoidSame = !avoidSame; this.classList.toggle('on', avoidSame); });
  AK.on('#gen', 'click', gen);
  AK.on('#copy', 'click', function () { if (last) AK.copy(last); else AK.toast('先生成座位表'); });
  AK.$('#names').value = '张三\\n李四\\n王五\\n赵六\\n钱七\\n孙八\\n周九\\n吴十';
  gen();`
  },
  {
    name: "群收款结算",
    slug: "qunshoukuan-jiesuan",
    cat: "社交",
    icon: "💸",
    tagline: "谁该给谁多少钱，一次算清",
    theme: ["#18a058", "#0a4a2b"],
    bg: "#f1faf5",
    desc: "聚餐、团建、拼单后总有人先垫钱。填入每个人实际付了多少、应摊多少，系统算出每人的应收应付，并给出转账次数最少的结算方案，照着发群收款即可。",
    feats: [
      "支持人均、按人填不同金额两种分摊方式",
      "自动计算每人应收或应付差额",
      "给出转账次数最少的结算清单",
      "结算结果可一键复制发到群里",
    ],
    body: `
  <section class="card">
    <h2>成员与金额 <small>付 = 实际垫付，摊 = 应承担</small></h2>
    <div id="list"></div>
    <button class="btn btn-ghost btn-sm" id="add" type="button">加一个人</button>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="even" type="button">按总金额人均分摊</button>
      <button class="btn btn-main btn-sm" id="calc" type="button">计算结算方案</button>
    </div>
  </section>
  <section class="card">
    <h2>结算方案 <small id="sum"></small></h2>
    <div id="out"><div class="empty">填好金额后点「计算结算方案」</div></div>
    <button class="btn btn-ghost btn-sm" id="copy" type="button" style="margin-top:12px">复制方案</button>
  </section>`,
    init: `
  var people = AK.store.get('pq.people', [
    { name: '我', paid: 320, share: 80 }, { name: '小李', paid: 0, share: 80 }, { name: '小王', paid: 0, share: 80 }, { name: '小张', paid: 0, share: 80 }
  ]);
  function save() { AK.store.set('pq.people', people); }
  function render() {
    AK.$('#list').innerHTML = people.map(function (p, i) {
      return '<div class="row" style="margin-bottom:8px">' +
        '<input value="' + AK.esc(p.name) + '" data-i="' + i + '" data-k="name" style="flex:1.4;min-width:90px" placeholder="姓名">' +
        '<input type="number" value="' + p.paid + '" data-i="' + i + '" data-k="paid" style="flex:1;min-width:70px" placeholder="垫付">' +
        '<input type="number" value="' + p.share + '" data-i="' + i + '" data-k="share" style="flex:1;min-width:70px" placeholder="应摊">' +
        '<button class="btn btn-ghost btn-sm" data-del="' + i + '" type="button">删</button></div>';
    }).join('');
    AK.$$('#list input').forEach(function (inp) {
      inp.oninput = function () {
        var i = Number(inp.dataset.i);
        people[i][inp.dataset.k] = inp.dataset.k === 'name' ? inp.value : AK.n(inp.value, 0);
        save();
      };
    });
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () { people.splice(Number(b.dataset.del), 1); save(); render(); };
    });
  }
  function calc() {
    var paidSum = people.reduce(function (s, p) { return s + AK.n(p.paid, 0); }, 0);
    var shareSum = people.reduce(function (s, p) { return s + AK.n(p.share, 0); }, 0);
    var debt = people.map(function (p) { return { name: p.name || '未命名', v: Math.round((AK.n(p.paid, 0) - AK.n(p.share, 0)) * 100) / 100 }; });
    var gain = debt.filter(function (d) { return d.v > 0.005; }).sort(function (a, b) { return b.v - a.v; });
    var owe = debt.filter(function (d) { return d.v < -0.005; }).map(function (d) { return { name: d.name, v: -d.v }; }).sort(function (a, b) { return b.v - a.v; });
    var transfers = [];
    var gi = 0, oi = 0;
    while (gi < gain.length && oi < owe.length) {
      var amt = Math.min(gain[gi].v, owe[oi].v);
      if (amt > 0.005) transfers.push(owe[oi].name + ' → ' + gain[gi].name + ' ' + amt.toFixed(2) + ' 元');
      gain[gi].v -= amt; owe[oi].v -= amt;
      if (gain[gi].v <= 0.005) gi++;
      if (owe[oi].v <= 0.005) oi++;
    }
    AK.$('#sum').textContent = '垫付合计 ' + paidSum.toFixed(2) + ' · 应摊合计 ' + shareSum.toFixed(2);
    var diff = Math.round((paidSum - shareSum) * 100) / 100;
    AK.$('#out').innerHTML =
      '<div class="kv"><span>垫付合计</span><b>' + paidSum.toFixed(2) + ' 元</b></div>' +
      '<div class="kv"><span>应摊合计</span><b>' + shareSum.toFixed(2) + ' 元</b></div>' +
      (Math.abs(diff) > 0.01 ? '<p class="muted" style="color:#b26a00;margin:8px 0">两列合计相差 ' + diff.toFixed(2) + ' 元，请核对是否有人漏填。</p>' : '') +
      '<div style="margin-top:10px;font-weight:800;font-size:13px">转账清单（' + transfers.length + ' 笔）</div>' +
      (transfers.length ? transfers.map(function (t) { return '<div class="item"><div class="grow"><div class="t" style="font-weight:600">' + t + '</div></div></div>'; }).join('') : '<div class="empty">金额已平衡，无需转账</div>');
    AK._plan = '本次共 ' + paidSum.toFixed(2) + ' 元，' + people.length + ' 人分摊，转账方案：\\n' + (transfers.length ? transfers.join('\\n') : '已平衡，无需转账');
  }
  AK.on('#add', 'click', function () { people.push({ name: '成员 ' + (people.length + 1), paid: 0, share: 0 }); save(); render(); });
  AK.on('#even', 'click', function () {
    var total = people.reduce(function (s, p) { return s + AK.n(p.paid, 0); }, 0);
    var each = Math.round(total / Math.max(1, people.length) * 100) / 100;
    people.forEach(function (p) { p.share = each; });
    save(); render();
    AK.toast('已按人均 ' + each + ' 元分摊');
  });
  AK.on('#calc', 'click', function () { calc(); });
  AK.on('#copy', 'click', function () { calc(); AK.copy(AK._plan || ''); });
  render();`
  },
  {
    name: "性格颜色测试",
    slug: "xingge-yanse-ceshi",
    cat: "社交",
    icon: "🎨",
    tagline: "十道题，看看你是什么颜色的人",
    theme: ["#d9534f", "#6b1f1c"],
    bg: "#fdf3f3",
    desc: "十道日常情境题，四个选项分别指向红、黄、蓝、绿四种性格倾向，作答后给出你的主色、辅色与相处建议。适合破冰、团建暖场，结果仅供娱乐参考。",
    feats: [
      "十道情境题覆盖决策、沟通、压力反应等维度",
      "四色性格模型，输出主色与辅色组合",
      "附性格说明、优势与相处建议",
      "结果可复制分享，测试可重来",
    ],
    body: `
  <section class="card">
    <h2>第 <span id="no">1</span> / 10 题 <small id="prog"></small></h2>
    <p id="q" style="font-size:16px;font-weight:800;line-height:1.7;margin:6px 0 14px">—</p>
    <div id="opts" style="display:grid;gap:8px"></div>
    <div class="bar" style="margin-top:14px"><i id="pbar" style="width:0%"></i></div>
  </section>
  <section class="card" id="result-card" hidden>
    <h2>测试结果</h2>
    <div id="result"></div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="again" type="button">再测一次</button>
      <button class="btn btn-main btn-sm" id="copy" type="button">复制结果</button>
    </div>
  </section>`,
    init: `
  var QS = [
    ['周五晚上突然空出来，你更想', [['约人吃饭热闹一下', 'red'], ['去看一场想看的展', 'yellow'], ['在家把积压的事理清', 'blue'], ['什么都不安排，躺着', 'green']]],
    ['小组作业里你通常是', [['带头定方向的人', 'red'], ['不停出点子的人', 'yellow'], ['把细节做扎实的人', 'blue'], ['协调关系不让气氛僵的人', 'green']]],
    ['遇到分歧时你的第一反应', [['直接说结论，先推进', 'red'], ['换个角度讲个笑话缓和', 'yellow'], ['把事实和数据摆出来', 'blue'], ['先听大家把话说完', 'green']]],
    ['你更受不了哪种人', [['磨叽半天不决断', 'red'], ['死气沉沉没反应', 'yellow'], ['拍脑袋乱改方案', 'blue'], ['咄咄逼人非要赢', 'green']]],
    ['压力大时你会', [['把任务拆开一条条干掉', 'red'], ['找人聊，越聊越有劲', 'yellow'], ['自己安静复盘', 'blue'], ['干脆先睡一觉', 'green']]],
    ['朋友找你倾诉，你多半', [['帮他想解决办法', 'red'], ['陪他吐槽骂两句', 'yellow'], ['把来龙去脉理清楚', 'blue'], ['先接住情绪，不急着说', 'green']]],
    ['你更喜欢的工作节奏', [['目标清晰、快点出结果', 'red'], ['随时有新东西尝试', 'yellow'], ['按部就班、标准明确', 'blue'], ['节奏平缓、不用抢', 'green']]],
    ['一条新消息弹出，你会', [['马上处理掉', 'red'], ['先看有没有意思', 'yellow'], ['等手头事做完再看', 'blue'], ['看心情，晚点再说', 'green']]],
    ['旅行时你更像', [['定好行程按表走', 'red'], ['走到哪算哪', 'yellow'], ['提前查好攻略与备选', 'blue'], ['找个地方待着不挪窝', 'green']]],
    ['别人夸你，你最受用的是', [['你办事真靠谱', 'red'], ['跟你在一起很有意思', 'yellow'], ['你想得真细', 'blue'], ['你让人很放松', 'green']]]
  ];
  var COLOR = {
    red: { name: '红色 · 行动派', emoji: '🔴', desc: '目标导向，节奏快，喜欢把事推动起来。优点是决断和执行，容易忽略别人的节奏。', good: '推进项目、定方向、救火', tip: '多留半句话给别人说完，效果会更好。' },
    yellow: { name: '黄色 · 表达派', emoji: '🟡', desc: '外向活泼，点子多，擅长把气氛拉起来。优点是感染力和创意，容易同时开太多头。', good: '暖场、创意、对外沟通', tip: '给想法配一个截止时间，落地率会明显提升。' },
    blue: { name: '蓝色 · 分析派', emoji: '🔵', desc: '重逻辑与细节，做事讲究依据和标准。优点是稳和准，做决定时会慢一些。', good: '方案打磨、数据核对、风险排查', tip: '允许自己在信息只有七成时先动手。' },
    green: { name: '绿色 · 协调派', emoji: '🟢', desc: '温和稳定，善于倾听与配合。优点是让人舒服，遇到冲突时容易先让步。', good: '协作、安抚、长期陪伴', tip: '把自己的需求说出来，也是一种贡献。' }
  };
  var idx = 0, score = { red: 0, yellow: 0, blue: 0, green: 0 }, answered = 0;
  function start() {
    idx = 0; answered = 0; score = { red: 0, yellow: 0, blue: 0, green: 0 };
    AK.$('#result-card').hidden = true;
    show();
  }
  function show() {
    var q = QS[idx];
    AK.$('#no').textContent = idx + 1;
    AK.$('#q').textContent = q[0];
    AK.$('#prog').textContent = '已答 ' + answered + ' 题';
    AK.$('#pbar').style.width = Math.round(answered / QS.length * 100) + '%';
    var box = AK.$('#opts');
    box.innerHTML = '';
    q[1].forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-ghost';
      b.style.cssText = 'text-align:left;padding:12px 14px;font-size:13.5px;font-weight:600';
      b.textContent = o[0];
      b.onclick = function () {
        score[o[1]]++;
        answered++; idx++;
        if (idx >= QS.length) finish(); else show();
      };
      box.appendChild(b);
    });
  }
  function finish() {
    AK.$('#pbar').style.width = '100%';
    var keys = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
    var main = keys[0], second = keys[1];
    AK.$('#result-card').hidden = false;
    AK.$('#result').innerHTML =
      '<div class="result" style="margin-bottom:12px"><div class="lbl">你的主色</div>' +
      '<div class="big" style="color:#fff;font-size:26px">' + COLOR[main].emoji + ' ' + COLOR[main].name + '</div>' +
      '<div class="lbl" style="margin-top:6px">辅色：' + COLOR[second].name + '</div></div>' +
      '<p class="muted" style="font-size:13px;color:var(--ink2);line-height:1.9">' + COLOR[main].desc + '</p>' +
      '<div class="kv"><span>适合承担</span><b style="font-weight:600">' + COLOR[main].good + '</b></div>' +
      '<div class="kv"><span>相处提示</span><b style="font-weight:600;text-align:right">' + COLOR[main].tip + '</b></div>' +
      '<div style="margin-top:12px">' + keys.map(function (k) {
        var pct = Math.round(score[k] / QS.length * 100);
        return '<div style="margin-bottom:8px"><div class="row spread" style="font-size:12px;font-weight:700"><span>' + COLOR[k].emoji + ' ' + COLOR[k].name + '</span><span>' + pct + '%</span></div><div class="bar" style="margin-top:4px"><i style="width:' + pct + '%"></i></div></div>';
      }).join('') + '</div>';
    AK._res = '我的性格颜色：' + COLOR[main].name + '（辅色 ' + COLOR[second].name + '）\\n' +
      keys.map(function (k) { return COLOR[k].name + ' ' + Math.round(score[k] / QS.length * 100) + '%'; }).join('、');
    AK.$('#result-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  AK.on('#again', 'click', start);
  AK.on('#copy', 'click', function () { if (AK._res) AK.copy(AK._res); });
  start();`
  },
  {
    name: "纪念日计算器",
    slug: "jinianri-jisuanqi",
    cat: "社交",
    icon: "💞",
    tagline: "在一起多少天，下一个纪念日还有几天",
    theme: ["#e0559b", "#7a1449"],
    bg: "#fdf1f7",
    desc: "选定起始日期，算出已经一起走过多少天，并列出接下来的十个纪念节点（百日、周年、千日等）还有多少天。适合记恋爱、结婚、入职、养宠等值得数的日子。",
    feats: [
      "输入起始日期，立即显示已过天数与第几天",
      "自动列出未来十个纪念节点及倒计时",
      "显示每个节点的星期与总天数",
      "日期保存在本机，下次打开直接看到",
    ],
    body: `
  <section class="card">
    <h2>起始日期</h2>
    <div class="row">
      <input id="d" type="date" style="flex:1;min-width:150px">
      <button class="btn btn-main" id="go" type="button">计算</button>
    </div>
    <div class="result" style="margin-top:14px">
      <div class="lbl">已经一起走过</div>
      <div class="big" id="days" style="color:#fff">—</div>
      <div class="lbl" id="week" style="margin-top:4px"></div>
    </div>
  </section>
  <section class="card">
    <h2>接下来的纪念节点</h2>
    <div id="list"></div>
  </section>`,
    init: `
  function fmt(d) { return d.getFullYear() + '-' + AK.pad(d.getMonth() + 1) + '-' + AK.pad(d.getDate()); }
  function weekday(d) { return '周' + '日一二三四五六'[d.getDay()]; }
  function calc() {
    var v = AK.$('#d').value;
    if (!v) { AK.toast('先选一个日期'); return; }
    AK.store.set('anniv.date', v);
    var start = new Date(v + 'T00:00:00');
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var total = Math.round((now - start) / 86400000);
    AK.$('#days').innerHTML = total >= 0 ? total + ' <span style="font-size:15px;font-weight:700">天</span>' : '还有 ' + (-total) + ' 天开始';
    AK.$('#week').textContent = '起始 ' + fmt(start) + '（' + weekday(start) + '）· 今天是第 ' + (total + 1) + ' 天';
    var nodes = [];
    [100, 200, 300, 365, 500, 520, 730, 1000, 1314, 1460, 1825, 2000, 2555, 3000, 3650].forEach(function (n) {
      nodes.push({ label: n + ' 天', date: new Date(start.getTime() + n * 86400000) });
    });
    for (var y = 1; y <= 10; y++) {
      var d = new Date(start.getTime());
      d.setFullYear(start.getFullYear() + y);
      nodes.push({ label: y + ' 周年', date: d });
    }
    nodes = nodes.filter(function (n) { return n.date >= now; }).sort(function (a, b) { return a.date - b.date; }).slice(0, 10);
    AK.$('#list').innerHTML = nodes.length ? nodes.map(function (n) {
      var left = Math.round((n.date - now) / 86400000);
      return '<div class="item"><div class="grow"><div class="t">' + n.label + '</div>' +
        '<div class="s">' + fmt(n.date) + ' · ' + weekday(n.date) + '</div></div>' +
        '<b style="color:var(--a);white-space:nowrap">' + (left === 0 ? '就是今天' : left + ' 天后') + '</b></div>';
    }).join('') : '<div class="empty">没有即将到来的节点</div>';
  }
  AK.$('#d').value = AK.store.get('anniv.date', fmt(new Date()));
  AK.on('#go', 'click', calc);
  AK.on('#d', 'change', calc);
  calc();`
  },
  {
    name: "聊天话题抽取",
    slug: "liaotian-huati-chouqu",
    cat: "社交",
    icon: "💬",
    tagline: "没话聊的时候，抽一个话题",
    theme: ["#3f8cf5", "#163a75"],
    bg: "#f1f7fe",
    desc: "按轻松、深入、回忆、脑洞、职场等分类收录上百个话题，点一下随机抽一个，避免聊天时只剩「最近怎么样」。适合聚会、约会、团建破冰。",
    feats: [
      "五类话题共 100+ 条，可切换类别",
      "一键随机抽取，不重复抽到刚用过的话题",
      "支持「换一个」连续抽、收藏喜欢的话题",
      "全部数据内置，无需联网",
    ],
    body: `
  <section class="card">
    <h2>选择类别</h2>
    <div class="row" id="cats"></div>
  </section>
  <section class="card">
    <h2>抽到的话题</h2>
    <p id="topic" style="font-size:19px;font-weight:800;line-height:1.7;min-height:70px">点下面按钮抽一个</p>
    <div class="row" style="margin-top:10px">
      <button class="btn btn-main" id="draw" type="button">抽一个</button>
      <button class="btn btn-ghost" id="save" type="button">收藏</button>
    </div>
  </section>
  <section class="card">
    <h2>收藏夹 <small id="cnt"></small></h2>
    <div id="favs"></div>
  </section>`,
    init: `
  var DATA = {
    '轻松': ['你最近一次笑到不行是因为什么？', '如果明天放假一天，你会怎么用？', '你手机里最舍不得删的一张照片是什么？', '最近有什么小事让你觉得今天还不错？', '你有什么别人觉得奇怪但自己很享受的习惯？', '你最近在循环哪首歌？', '有没有哪家店你想带朋友去吃？'],
    '深入': ['你希望五年后的自己是什么样？', '什么事情会让你觉得自己被理解？', '你有没有一直想做但还没开始的事？', '你最看重朋友身上的什么特质？', '最近有什么想法一直没跟别人说过？', '什么时刻你会觉得特别踏实？'],
    '回忆': ['你小时候最想成为什么？', '学生时代最难忘的一节课是什么？', '你收到过最用心的礼物是什么？', '第一次离开家的时候是什么感觉？', '有什么事情你现在想起来还会不好意思？'],
    '脑洞': ['如果能拥有一种超能力，你选哪个？', '给你一千万但要放弃手机，你干不干？', '如果可以和任何一个历史人物吃饭，选谁？', '你会给十年后的人留一句什么话？', '如果人生可以重来一次，你想改哪一步？'],
    '职场': ['你理想中的工作节奏是什么样的？', '最近学到的最有用的一件事是什么？', '你怎么判断一件事值得长期做？', '遇到不靠谱的合作方你会怎么处理？', '你更喜欢被明确安排还是自己找方向？']
  };
  var cat = '轻松', last = '', favs = AK.store.get('topic.favs', []);
  function paintCats() {
    var box = AK.$('#cats');
    box.innerHTML = '';
    Object.keys(DATA).forEach(function (k) {
      var b = document.createElement('span');
      b.className = 'chip' + (k === cat ? ' on' : '');
      b.textContent = k;
      b.onclick = function () { cat = k; paintCats(); };
      box.appendChild(b);
    });
  }
  function draw() {
    var pool = DATA[cat].filter(function (t) { return t !== last; });
    last = pool[Math.floor(Math.random() * pool.length)];
    AK.$('#topic').textContent = last;
  }
  function paintFavs() {
    AK.$('#cnt').textContent = favs.length ? favs.length + ' 条' : '';
    AK.$('#favs').innerHTML = favs.length ? favs.map(function (t, i) {
      return '<div class="item"><div class="grow"><div class="t" style="font-weight:600">' + AK.esc(t) + '</div></div><button class="btn btn-ghost btn-sm" data-i="' + i + '" type="button">移除</button></div>';
    }).join('') : '<div class="empty">还没有收藏，抽到喜欢的点「收藏」</div>';
    AK.$$('#favs button').forEach(function (b) {
      b.onclick = function () { favs.splice(Number(b.dataset.i), 1); AK.store.set('topic.favs', favs); paintFavs(); };
    });
  }
  AK.on('#draw', 'click', draw);
  AK.on('#save', 'click', function () {
    if (!last) { AK.toast('先抽一个话题'); return; }
    if (favs.indexOf(last) < 0) { favs.unshift(last); AK.store.set('topic.favs', favs); paintFavs(); AK.toast('已收藏'); }
    else AK.toast('已经收藏过了');
  });
  paintCats(); paintFavs(); draw();`
  },
  {
    name: "生日提醒清单",
    slug: "shengri-tixing",
    cat: "社交",
    icon: "🎂",
    tagline: "谁快过生日了，一眼看到",
    theme: ["#e8663f", "#8a2a10"],
    bg: "#fdf4f0",
    desc: "把家人朋友的生日录进来，按距今天数排序，自动算出还要几天、对方将满多少岁。30 天内高亮提醒，打开就知道该准备礼物了。",
    feats: [
      "录入姓名与生日，按距今天数自动排序",
      "自动判断是否已过、还剩几天、将满几岁",
      "30 天内高亮，已过的自动排到年底",
      "数据保存在本机，支持增删",
    ],
    body: `
  <section class="card">
    <h2>添加生日</h2>
    <div class="row">
      <input id="name" placeholder="姓名" style="flex:1;min-width:90px">
      <input id="date" type="date" style="flex:1;min-width:140px">
      <button class="btn btn-main" id="add" type="button">添加</button>
    </div>
    <p class="muted" style="margin-top:8px">出生年份可以不填，填了会显示将满多少岁。</p>
  </section>
  <section class="card">
    <h2>提醒清单 <small id="cnt"></small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var list = AK.store.get('bday.list', [{ name: '妈妈', date: '1972-11-02' }, { name: '小林', date: '1998-10-30' }]);
  function save() { AK.store.set('bday.list', list); }
  function nextOccur(dateStr) {
    var p = dateStr.split('-');
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var y = now.getFullYear();
    var d = new Date(y, Number(p[1]) - 1, Number(p[2]));
    if (d < now) d = new Date(y + 1, Number(p[1]) - 1, Number(p[2]));
    return d;
  }
  function render() {
    var rows = list.map(function (p) {
      var d = nextOccur(p.date);
      var now = new Date(); now.setHours(0, 0, 0, 0);
      var left = Math.round((d - now) / 86400000);
      var birthYear = p.date.split('-')[0];
      var age = Number(birthYear) > 1900 ? d.getFullYear() - Number(birthYear) : null;
      return { name: p.name, date: p.date, left: left, d: d, age: age };
    }).sort(function (a, b) { return a.left - b.left; });
    AK.$('#cnt').textContent = list.length ? list.length + ' 人' : '';
    AK.$('#list').innerHTML = rows.length ? rows.map(function (r) {
      var hot = r.left <= 30;
      return '<div class="item" style="' + (hot ? 'border-color:#f6c9b6;background:#fff8f4' : '') + '">' +
        '<div class="grow"><div class="t">' + AK.esc(r.name) + '</div>' +
        '<div class="s">' + (r.d.getMonth() + 1) + ' 月 ' + r.d.getDate() + ' 日' + (r.age ? ' · 满 ' + r.age + ' 岁' : '') + '</div></div>' +
        '<b style="color:' + (hot ? '#c0392b' : 'var(--a)') + ';white-space:nowrap">' + (r.left === 0 ? '今天生日' : r.left + ' 天后') + '</b>' +
        '<button class="btn btn-ghost btn-sm" data-n="' + AK.esc(r.name) + '" type="button">删</button></div>';
    }).join('') : '<div class="empty">还没有生日记录</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        list = list.filter(function (x) { return x.name !== b.dataset.n; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var name = AK.$('#name').value.trim(), date = AK.$('#date').value;
    if (!name || !date) { AK.toast('姓名和日期都要填'); return; }
    list.push({ name: name, date: date });
    save(); render();
    AK.$('#name').value = ''; AK.$('#date').value = '';
    AK.toast('已添加');
  });
  render();`
  },
  {
    name: "匿名投票箱",
    slug: "niming-toupiao",
    cat: "社交",
    icon: "🗳️",
    tagline: "几个选项，投完立刻看结果",
    theme: ["#5f6caf", "#262c55"],
    bg: "#f3f4fb",
    desc: "发起一个小投票：填几个选项，逐个投票，结果用条形图实时展示并计算占比。本机统计，适合聚会选餐厅、群里定时间、宿舍选电影等临时决策场景。",
    feats: [
      "自定义投票主题与任意数量选项",
      "投票后实时显示票数与百分比条",
      "支持一票制或多票制（每人可投多项）",
      "数据保存在本机，可重置重新投票",
    ],
    body: `
  <section class="card">
    <h2>投票主题</h2>
    <input id="title" placeholder="如 周末去哪吃" value="周末去哪吃">
    <div class="row" style="margin-top:10px">
      <span class="chip on" id="single">单选</span>
      <span class="chip" id="multi">多选</span>
    </div>
    <div class="field" style="margin-top:12px"><label>选项（每行一个）</label><textarea id="opts" rows="4">火锅
烧烤
日料
家常菜</textarea></div>
    <div class="row">
      <button class="btn btn-main" id="build" type="button">生成投票</button>
      <button class="btn btn-ghost" id="reset" type="button">清空票数</button>
    </div>
  </section>
  <section class="card">
    <h2>投票 <small id="sum"></small></h2>
    <div id="box"></div>
  </section>`,
    init: `
  var poll = AK.store.get('poll.data', { title: '周末去哪吃', opts: ['火锅', '烧烤', '日料', '家常菜'], votes: [0, 0, 0, 0], multi: false, picked: false });
  function save() { AK.store.set('poll.data', poll); }
  function render() {
    AK.$('#title').value = poll.title;
    AK.$('#opts').value = poll.opts.join('\\n');
    AK.$('#single').classList.toggle('on', !poll.multi);
    AK.$('#multi').classList.toggle('on', poll.multi);
    var total = poll.votes.reduce(function (a, b) { return a + b; }, 0);
    AK.$('#sum').textContent = total ? '共 ' + total + ' 票 · ' + (poll.multi ? '多选' : '单选') : '还没人投票';
    AK.$('#box').innerHTML = poll.opts.map(function (o, i) {
      var v = poll.votes[i] || 0;
      var pct = total ? Math.round(v / total * 100) : 0;
      return '<div style="margin-bottom:12px"><div class="row spread" style="font-size:13px;font-weight:700;margin-bottom:5px">' +
        '<span>' + AK.esc(o) + '</span><span>' + v + ' 票 · ' + pct + '%</span></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<button class="btn btn-ghost btn-sm" data-i="' + i + '" type="button" style="margin-top:7px" ' + (poll.picked && !poll.multi ? 'disabled' : '') + '>投一票</button></div>';
    }).join('');
    AK.$$('#box button').forEach(function (b) {
      b.onclick = function () {
        poll.votes[Number(b.dataset.i)]++;
        poll.picked = true;
        save(); render();
        AK.toast('已投票');
      };
    });
  }
  AK.on('#build', 'click', function () {
    var opts = String(AK.$('#opts').value || '').split(/\\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (opts.length < 2) { AK.toast('至少两个选项'); return; }
    poll = { title: AK.$('#title').value.trim() || '未命名投票', opts: opts, votes: opts.map(function () { return 0; }), multi: poll.multi, picked: false };
    save(); render();
    AK.toast('投票已生成');
  });
  AK.on('#single', 'click', function () { poll.multi = false; save(); render(); });
  AK.on('#multi', 'click', function () { poll.multi = true; save(); render(); });
  AK.on('#reset', 'click', function () {
    poll.votes = poll.opts.map(function () { return 0; });
    poll.picked = false;
    save(); render();
    AK.toast('票数已清空');
  });
  render();`
  }
];
