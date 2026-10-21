/* 第二批 · 户外七个 + 生活六个 */
export default [
  {
    name: "露营装备清单",
    slug: "luying-zhuangbei-qingdan",
    cat: "户外",
    icon: "⛺",
    tagline: "按天数和天气，生成该带的装备",
    theme: ["#3d7a5a", "#153a29"],
    bg: "#f2f9f5",
    desc: "选好天数、人数、天气和露营方式，自动生成一份分模块的装备清单：住宿、炊具、衣物、照明、药品、证件。勾选状态会保存，出发前照着划一遍就不会漏东西。",
    feats: [
      "按天数、人数、天气、露营方式动态生成清单",
      "六大模块分组，雨雪降温自动追加对应装备",
      "勾选状态保存在本机，可分次打包",
      "一键复制清单发到群里分工",
    ],
    body: `
  <section class="card">
    <h2>行程条件</h2>
    <div class="grid2">
      <div><label>天数</label><input id="days" type="number" value="2" min="1" max="15"></div>
      <div><label>人数</label><input id="people" type="number" value="2" min="1" max="20"></div>
      <div><label>天气</label><select id="weather"><option>晴好</option><option>有雨</option><option>寒冷</option><option>大风</option></select></div>
      <div><label>方式</label><select id="way"><option>自驾营地</option><option>徒步露营</option><option>房车 / 车宿</option></select></div>
    </div>
    <button class="btn btn-main" id="gen" type="button" style="margin-top:12px">生成清单</button>
  </section>
  <section class="card">
    <h2>装备清单 <small id="prog"></small></h2>
    <div id="list"></div>
    <button class="btn btn-ghost btn-sm" id="copy" type="button" style="margin-top:10px">复制清单</button>
  </section>`,
    init: `
  var cfg = AK.store.get('camp.cfg', { days: 2, people: 2, weather: '晴好', way: '自驾营地' });
  var checked = AK.store.get('camp.checked', {});
  var current = [];
  function save() { AK.store.set('camp.checked', checked); AK.store.set('camp.cfg', cfg); }
  function build() {
    var days = AK.n(cfg.days, 2), people = AK.n(cfg.people, 2), w = cfg.weather, way = cfg.way;
    var groups = [
      ['住宿', ['帐篷' + (people > 4 ? '（大号）' : ''), '睡袋 × ' + people, '防潮垫 × ' + people, '地钉与风绳', '充气枕', '天幕 / 遮阳棚']],
      ['炊具', ['炉头 + 气罐', '锅具套装', '餐具 × ' + people, '打火机 / 火柴', '垃圾袋 × ' + Math.max(2, days), '饮用水 ' + (days * people * 1.5).toFixed(1) + ' 升', '食材与调料']],
      ['衣物', ['换洗衣物 × ' + Math.min(days, 3) + ' 套', '备用袜 × ' + people, '速干外套', '拖鞋与徒步鞋']],
      ['照明与电', ['头灯 + 备用电池', '营地灯', '充电宝']],
      ['药品', ['创可贴与碘伏', '驱蚊液', '常用药（个人）', '肠胃药']],
      ['证件与其他', ['身份证件', '现金少量', '纸巾 / 湿巾', '防晒霜']]
    ];
    if (w === '有雨') groups[0][1].push('天幕加强固定', '防水收纳袋'); groups[3][1].push('雨衣 / 雨披');
    if (w === '寒冷') groups[2][1].push('抓绒或羽绒保暖层', '保暖帽与手套'); groups[0][1].push('暖宝宝');
    if (w === '大风') groups[0][1].push('加长地钉', '防风绳');
    if (way === '徒步露营') groups[3][1].push('轻量化头灯（备用）', '登山杖'); groups[0][1].push('轻量帐篷（≤2kg）');
    if (way === '房车 / 车宿') groups[0][1] = ['枕头被子', '车载遮光帘', '便携马桶'];
    if (days >= 3) groups[1][1].push('折叠水桶', '备用气罐');
    return groups;
  }
  function render() {
    AK.$('#days').value = cfg.days; AK.$('#people').value = cfg.people;
    AK.$('#weather').value = cfg.weather; AK.$('#way').value = cfg.way;
    current = build();
    var total = 0, done = 0;
    AK.$('#list').innerHTML = current.map(function (g, gi) {
      var items = g[1].map(function (name, ii) {
        var key = gi + '-' + ii + '-' + name;
        var on = Boolean(checked[key]);
        total++; if (on) done++;
        return '<label class="item" style="cursor:pointer;margin-bottom:6px;' + (on ? 'opacity:.6' : '') + '">' +
          '<input type="checkbox" data-key="' + key + '" ' + (on ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:#3d7a5a;flex:0 0 auto">' +
          '<div class="grow"><div class="t" style="font-weight:600;' + (on ? 'text-decoration:line-through' : '') + '">' + name + '</div></div></label>';
      }).join('');
      return '<div style="margin-bottom:14px"><div style="font-size:12.5px;font-weight:800;color:var(--a);margin-bottom:7px">' + g[0] + '</div>' + items + '</div>';
    }).join('');
    AK.$('#prog').textContent = done + ' / ' + total + ' 项';
    AK.$$('#list input').forEach(function (inp) {
      inp.onchange = function () {
        checked[inp.dataset.key] = inp.checked;
        save();
        render();
      };
    });
  }
  AK.on('#gen', 'click', function () {
    cfg = { days: AK.n(AK.$('#days').value, 2), people: AK.n(AK.$('#people').value, 2), weather: AK.$('#weather').value, way: AK.$('#way').value };
    checked = {};
    save(); render();
    AK.toast('清单已按条件生成');
  });
  AK.on('#copy', 'click', function () {
    var txt = '露营装备清单（' + cfg.days + ' 天 / ' + cfg.people + ' 人 / ' + cfg.weather + ' / ' + cfg.way + '）\\n' +
      current.map(function (g) { return '【' + g[0] + '】' + g[1].join('、'); }).join('\\n');
    AK.copy(txt);
  });
  render();`
  },
  {
    name: "徒步用时估算",
    slug: "tubu-yongshi-gusuan",
    cat: "户外",
    icon: "🥾",
    tagline: "多少公里多少爬升，大概走多久",
    theme: ["#4a7c3f", "#1e3a19"],
    bg: "#f4faf1",
    desc: "用登山界常用的 Naismith 法则估算徒步时间：按水平距离和累计爬升分别计时，再按体能水平修正。同时给出出发时间建议，避免天黑还在山上。",
    feats: [
      "Naismith 法则：距离 + 爬升 + 体能系数算总用时",
      "显示平路时间、爬升时间与休息占比",
      "给定出发时间，推算到达与是否摸黑",
      "附不同体能档位的对比参考",
    ],
    body: `
  <section class="card">
    <h2>路线数据</h2>
    <div class="grid2">
      <div><label>距离 km</label><input id="dist" type="number" value="12" step="0.1"></div>
      <div><label>累计爬升 m</label><input id="up" type="number" value="700"></div>
      <div><label>体能水平</label><select id="fit">
        <option value="1.25">新手（常休息）</option>
        <option value="1" selected>一般（每周运动）</option>
        <option value="0.85">较强（常徒步）</option>
      </select></div>
      <div><label>出发时间</label><input id="start" type="time" value="08:00"></div>
    </div>
  </section>
  <section class="card">
    <h2>用时估算</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">预计总用时</div>
      <div class="big" id="total" style="color:#fff">—</div>
      <div class="lbl" id="arrive" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
    <p class="muted" id="warn" style="margin-top:10px"></p>
  </section>`,
    init: `
  function fmtTime(min) {
    var m = ((min % 1440) + 1440) % 1440;
    return AK.pad(Math.floor(m / 60)) + ':' + AK.pad(m % 60);
  }
  function calc() {
    var dist = AK.n(AK.$('#dist').value, 0), up = AK.n(AK.$('#up').value, 0);
    var fit = AK.n(AK.$('#fit').value, 1);
    var startP = (AK.$('#start').value || '08:00').split(':');
    var startMin = Number(startP[0]) * 60 + Number(startP[1]);
    var flatMin = dist / 5 * 60;
    var climbMin = up / 600 * 60;
    var base = (flatMin + climbMin) * fit;
    var rest = base * 0.15;
    var total = base + rest;
    var arrive = startMin + total;
    AK.$('#total').innerHTML = Math.floor(total / 60) + ' <span style="font-size:15px">小时</span> ' + Math.round(total % 60) + ' <span style="font-size:15px">分</span>';
    AK.$('#arrive').textContent = '按 ' + fmtTime(startMin) + ' 出发，预计 ' + fmtTime(arrive) + ' 到达终点';
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>平路时间（5 km/h）</span><b>' + Math.round(flatMin) + ' 分钟</b></div>' +
      '<div class="kv"><span>爬升时间（每 600 m 一小时）</span><b>' + Math.round(climbMin) + ' 分钟</b></div>' +
      '<div class="kv"><span>体能修正后</span><b>' + Math.round(base) + ' 分钟</b></div>' +
      '<div class="kv"><span>休息与拍照（15%）</span><b>' + Math.round(rest) + ' 分钟</b></div>';
    var warn = '';
    if (arrive > 18 * 60) warn = '预计 18:00 后才到终点，务必带头灯并准备备用下撤方案。';
    else if (arrive > 16.5 * 60) warn = '接近天黑到达，建议提前 1 小时出发或缩短路线。';
    else warn = '时间比较宽裕，可按计划出发；山区天气变化快，仍建议带保暖层和头灯。';
    if (dist > 20 || up > 1500) warn += ' 强度偏大，建议按 8 折速度再算一遍留余量。';
    AK.$('#warn').textContent = warn;
  }
  ['#dist', '#up', '#start'].forEach(function (s) { AK.on(s, 'input', calc); });
  AK.on('#fit', 'change', calc);
  calc();`
  },
  {
    name: "风寒指数",
    slug: "fenghan-zhishu",
    cat: "户外",
    icon: "🥶",
    tagline: "几度加几级风，体感到底多冷",
    theme: ["#3b82c4", "#123a5c"],
    bg: "#f1f7fc",
    desc: "按气温与风速计算体感温度（风寒指数），给出冻伤风险时间与穿衣建议。冬天出门前先看一眼，比只看气温数字靠谱。",
    feats: [
      "输入气温与风速，算出体感温度",
      "按体感温度给出冻伤风险等级与暴露时间",
      "不同风速下的体感对照表",
      "同步给出分层穿衣建议",
    ],
    body: `
  <section class="card">
    <h2>天气条件</h2>
    <div class="grid2">
      <div><label>气温 ℃</label><input id="t" type="number" value="-2" step="0.5"></div>
      <div><label>风速 km/h</label><input id="w" type="number" value="20" min="0" max="120"></div>
    </div>
  </section>
  <section class="card">
    <h2>体感</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">体感温度</div>
      <div class="big" id="feel" style="color:#fff">—</div>
      <div class="lbl" id="risk" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
    <table id="tbl" style="margin-top:12px"><thead><tr><th>气温 \\ 风速</th><th>10</th><th>20</th><th>30</th><th>40</th></tr></thead><tbody></tbody></table>
  </section>`,
    init: `
  function chill(t, v) {
    if (t > 10 || v < 4.8) return t;
    return 13.12 + 0.6215 * t - 11.37 * Math.pow(v, 0.16) + 0.3965 * t * Math.pow(v, 0.16);
  }
  function advice(f) {
    if (f > 5) return ['体感温和', '长袖加薄外套即可', '#3b82c4'];
    if (f > -5) return ['体感偏冷', '抓绒 + 防风外套，戴手套', '#2f6e9e'];
    if (f > -15) return ['寒冷', '羽绒 + 保暖内衣 + 帽子围巾', '#245a80'];
    if (f > -25) return ['极冷，暴露皮肤 30 分钟可能冻伤', '厚羽绒 + 面罩 + 双层手套', '#1b4462'];
    return ['危险级，暴露皮肤 10 分钟内可能冻伤', '非必要不出门，全脸防护', '#123047'];
  }
  function calc() {
    var t = AK.n(AK.$('#t').value, 0), v = AK.n(AK.$('#w').value, 0);
    var f = chill(t, v);
    var a = advice(f);
    AK.$('#feel').innerHTML = f.toFixed(1) + ' <span style="font-size:16px">℃</span>';
    AK.$('#risk').textContent = a[0];
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>实际气温</span><b>' + t + ' ℃</b></div>' +
      '<div class="kv"><span>风速</span><b>' + Math.round(v) + ' km/h（约 ' + Math.round(v / 3.6) + ' m/s）</b></div>' +
      '<div class="kv"><span>体感下降</span><b>' + (t - f).toFixed(1) + ' ℃</b></div>' +
      '<div class="kv"><span>穿衣建议</span><b style="font-weight:600;text-align:right;max-width:60%">' + a[1] + '</b></div>';
    var rows = '';
    [-10, -5, 0, 5, 10].forEach(function (tt) {
      rows += '<tr><td>' + tt + ' ℃</td>' + [10, 20, 30, 40].map(function (vv) {
        var ff = chill(tt, vv);
        return '<td style="color:' + (ff < -10 ? '#1b4462' : ff < 0 ? '#245a80' : 'var(--ink)') + '">' + ff.toFixed(0) + '</td>';
      }).join('') + '</tr>';
    });
    AK.$('#tbl tbody').innerHTML = rows;
  }
  AK.on('#t', 'input', calc); AK.on('#w', 'input', calc);
  calc();`
  },
  {
    name: "雷暴距离测算",
    slug: "leibao-juli-cesu",
    cat: "户外",
    icon: "⛈️",
    tagline: "数几秒，就知道雷离你多远",
    theme: ["#5b5f7a", "#232636"],
    bg: "#f4f5f9",
    desc: "看到闪电后数到听见雷声的秒数，按声速换算出雷暴与你的距离，并给出是否需要立即撤离的判断。内置 30/30 安全法则说明，户外活动时用它判断风险更直观。",
    feats: [
      "输入秒数即算出雷暴距离（声速 343 m/s）",
      "按距离给出继续活动 / 立即撤离的判断",
      "支持连续记录多次，观察雷暴在靠近还是远离",
      "附 30/30 安全法则与避险要点",
    ],
    body: `
  <section class="card">
    <h2>闪电到雷声</h2>
    <div class="row">
      <input id="sec" type="number" placeholder="间隔秒数" value="6" style="flex:1;min-width:130px">
      <button class="btn btn-main" id="calc" type="button">测算</button>
    </div>
    <div class="result" style="margin-top:14px">
      <div class="lbl">雷暴距离</div>
      <div class="big" id="dist" style="color:#fff">—</div>
      <div class="lbl" id="risk" style="margin-top:4px"></div>
    </div>
  </section>
  <section class="card">
    <h2>本次记录 <small id="trend"></small></h2>
    <div id="list"></div>
    <button class="btn btn-ghost btn-sm" id="clear" type="button" style="margin-top:8px">清空记录</button>
  </section>
  <section class="card">
    <h2>安全要点</h2>
    <p class="muted" style="line-height:2">
      · 30/30 法则：看到闪电后 30 秒内听到雷声，必须立即寻找建筑物或汽车避险；最后一次雷声后 30 分钟再恢复户外活动。<br>
      · 不要躲在大树下、山顶、水边或空旷高地，远离金属栏杆与登山杖。<br>
      · 在野外无处躲避时，双脚并拢蹲下、降低高度，尽量避免成为最高点。
    </p>
  </section>`,
    init: `
  var recs = AK.store.get('thunder.recs', []);
  function save() { AK.store.set('thunder.recs', recs); }
  function calc() {
    var sec = AK.n(AK.$('#sec').value, 0);
    if (sec <= 0) { AK.toast('填一下间隔秒数'); return; }
    var km = sec * 343 / 1000;
    AK.$('#dist').innerHTML = km.toFixed(2) + ' <span style="font-size:15px">公里</span>';
    var risk = km < 3 ? '非常危险，立刻撤离到室内或车内' : km < 6 ? '危险，停止活动并就近避险' : km < 10 ? '较近，随时准备撤离' : '尚有一段距离，保持观察';
    AK.$('#risk').textContent = risk;
    recs.unshift({ sec: sec, km: km, ts: Date.now() });
    recs = recs.slice(0, 10);
    save(); render();
  }
  function render() {
    AK.$('#list').innerHTML = recs.length ? recs.map(function (r, i) {
      var t = new Date(r.ts);
      return '<div class="item"><div class="grow"><div class="t">' + r.sec + ' 秒 · ' + r.km.toFixed(2) + ' 公里</div>' +
        '<div class="s">' + AK.pad(t.getHours()) + ':' + AK.pad(t.getMinutes()) + ' 记录</div></div>' +
        (i === 0 ? '<span class="tag">最新</span>' : '') + '</div>';
    }).join('') : '<div class="empty">还没有记录</div>';
    if (recs.length >= 2) {
      var near = recs[0].km < recs[1].km;
      AK.$('#trend').textContent = near ? '雷暴正在靠近' : '雷暴正在远离';
    } else AK.$('#trend').textContent = '';
  }
  AK.on('#calc', 'click', calc);
  AK.on('#sec', 'keydown', function (e) { if (e.key === 'Enter') calc(); });
  AK.on('#clear', 'click', function () { recs = []; save(); render(); AK.toast('已清空'); });
  render();`
  },
  {
    name: "星空摄影曝光",
    slug: "xingkong-sheying-baoguang",
    cat: "户外",
    icon: "📷",
    tagline: "五百法则算快门，星星不拖尾",
    theme: ["#252a4a", "#0b0d1a"],
    bg: "#f2f3f8",
    desc: "按 500 法则，用焦距和传感器裁切系数算出不出现拖尾的最长快门，并给出常见焦段的曝光参考表。拍银河之前先算一遍，比现场试错省时间。",
    feats: [
      "500 法则计算最长快门，支持裁切系数修正",
      "可选严格模式（400 法则），星点更锐利",
      "常见焦段快门对照表，覆盖 14–85mm",
      "附星空拍摄参数建议：光圈、ISO、对焦方式",
    ],
    body: `
  <section class="card">
    <h2>器材参数</h2>
    <div class="grid3">
      <div><label>焦距 mm</label><input id="f" type="number" value="24" min="8" max="200"></div>
      <div><label>裁切系数</label><select id="crop">
        <option value="1">全画幅 1.0</option>
        <option value="1.5">APS-C 1.5</option>
        <option value="1.6">APS-C 1.6</option>
        <option value="2">M4/3 2.0</option>
      </select></div>
      <div><label>法则</label><select id="rule"><option value="500">500 法则</option><option value="400">400 法则（更严）</option><option value="300">300 法则（最严）</option></select></div>
    </div>
  </section>
  <section class="card">
    <h2>结果</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">最长快门</div>
      <div class="big" id="shutter" style="color:#fff">—</div>
      <div class="lbl" id="sub" style="margin-top:4px"></div>
    </div>
    <table id="tbl"><thead><tr><th>焦距</th><th>等效焦距</th><th>最长快门</th></tr></thead><tbody></tbody></table>
    <p class="muted" style="margin-top:12px">建议参数：光圈开到最大（f/1.8–f/2.8），ISO 1600–6400 试拍调整，手动对焦到远处亮星，关闭防抖与降噪，使用 2 秒延时或快门线。</p>
  </section>`,
    init: `
  function calc() {
    var f = AK.n(AK.$('#f').value, 24), crop = AK.n(AK.$('#crop').value, 1), rule = AK.n(AK.$('#rule').value, 500);
    var eq = f * crop;
    var sec = rule / eq;
    AK.$('#shutter').innerHTML = sec.toFixed(sec < 10 ? 1 : 0) + ' <span style="font-size:15px">秒</span>';
    AK.$('#sub').textContent = '等效焦距 ' + Math.round(eq) + ' mm · ' + rule + ' 法则 · 拍摄时不要超过这个快门';
    var rows = '';
    [14, 20, 24, 35, 50, 85].forEach(function (ff) {
      var e2 = ff * crop, s2 = rule / e2;
      rows += '<tr><td>' + ff + ' mm</td><td>' + Math.round(e2) + ' mm</td><td>' + s2.toFixed(s2 < 10 ? 1 : 0) + ' 秒</td></tr>';
    });
    AK.$('#tbl tbody').innerHTML = rows;
  }
  ['#f'].forEach(function (s) { AK.on(s, 'input', calc); });
  AK.on('#crop', 'change', calc);
  AK.on('#rule', 'change', calc);
  calc();`
  },
  {
    name: "徒步补水计划",
    slug: "tubu-bushui-jihua",
    cat: "户外",
    icon: "💧",
    tagline: "这段路该带多少水，别背多也别不够",
    theme: ["#2196a8", "#0a4552"],
    bg: "#f0fafb",
    desc: "按体重、徒步时长、气温和强度估算需水量，换算成瓶数并提示补水节奏与电解质补充。夏天长线不带够水是常见风险，出发前先算一遍。",
    feats: [
      "按体重、时长、气温、强度估算总需水量",
      "给出每小时的补水节奏与瓶数换算",
      "高温或长线自动提示电解质与补给点",
      "附缺水早期信号自查清单",
    ],
    body: `
  <section class="card">
    <h2>行程条件</h2>
    <div class="grid2">
      <div><label>体重 kg</label><input id="w" type="number" value="65"></div>
      <div><label>徒步时长 小时</label><input id="h" type="number" value="5" step="0.5"></div>
      <div><label>气温 ℃</label><input id="t" type="number" value="26"></div>
      <div><label>强度</label><select id="lv"><option value="0.5">轻松（平路）</option><option value="0.7" selected>中等（有爬升）</option><option value="0.9">高强度（大爬升/负重）</option></select></div>
    </div>
  </section>
  <section class="card">
    <h2>建议带水</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">总需水量</div>
      <div class="big" id="total" style="color:#fff">—</div>
      <div class="lbl" id="bottles" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
    <p class="muted" id="tip" style="margin-top:10px"></p>
  </section>`,
    init: `
  function calc() {
    var w = AK.n(AK.$('#w').value, 65), h = AK.n(AK.$('#h').value, 5);
    var t = AK.n(AK.$('#t').value, 26), lv = AK.n(AK.$('#lv').value, 0.7);
    var base = w * 5;
    var tempFactor = 1 + Math.max(0, t - 20) * 0.045;
    var perHour = base * lv * tempFactor / 1000;
    var total = perHour * h;
    AK.$('#total').innerHTML = total.toFixed(1) + ' <span style="font-size:15px">升</span>';
    AK.$('#bottles').textContent = '约 ' + Math.ceil(total / 0.5) + ' 瓶（500ml） · 每小时约 ' + (perHour * 1000).toFixed(0) + ' 毫升';
    var extraWater = total > 2.5 ? '，建议留 0.5 升作为应急备用水' : '';
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>每小时补水</span><b>' + (perHour * 1000).toFixed(0) + ' 毫升</b></div>' +
      '<div class="kv"><span>总需水量</span><b>' + total.toFixed(1) + ' 升' + extraWater + '</b></div>' +
      '<div class="kv"><span>补给节奏</span><b>每 20–30 分钟小口喝 100–150 ml</b></div>' +
      '<div class="kv"><span>电解质</span><b>' + (t > 28 || h > 4 ? '必带盐丸或电解质片' : '短程可不带，长线建议带') + '</b></div>';
    var tips = [];
    if (total > 3) tips.push('超过 3 升，优先规划沿途水源或补给点，别一次背太重。');
    if (t > 30) tips.push('高温天避免 11:00–15:00 长时间暴走，水要分多处存放。');
    tips.push('尿液发黄、头晕、口干说明已经缺水，出现这些信号要立刻休息补水。');
    AK.$('#tip').textContent = tips.join(' ');
  }
  ['#w', '#h', '#t'].forEach(function (s) { AK.on(s, 'input', calc); });
  AK.on('#lv', 'change', calc);
  calc();`
  },
  {
    name: "户外电源续航",
    slug: "huwai-dianyuan-xuhang",
    cat: "户外",
    icon: "🔋",
    tagline: "一块电池，能撑几天几夜",
    theme: ["#5b8c2a", "#2a4512"],
    bg: "#f6faf0",
    desc: "输入移动电源或户外电源的容量（Wh），加上要带的设备功率与使用时长，算出能撑多久、还剩多少余量。露营、拍摄、长途自驾前先核对，避免半路没电。",
    feats: [
      "按 Wh 容量与设备功率、使用时长算可用小时数",
      "支持多设备同时估算，自动累加每日耗电",
      "列出常见设备的功率参考值",
      "给出剩余电量与建议带的备用方案",
    ],
    body: `
  <section class="card">
    <h2>电源容量</h2>
    <div class="grid2">
      <div><label>容量 Wh</label><input id="wh" type="number" value="500"></div>
      <div><label>可用系数</label><select id="k"><option value="0.85" selected>0.85（常规）</option><option value="0.7">0.7（低温/大功率）</option><option value="0.95">0.95（轻度使用）</option></select></div>
    </div>
  </section>
  <section class="card">
    <h2>设备清单 <small>功率 × 每天用几小时</small></h2>
    <div id="devs"></div>
    <button class="btn btn-ghost btn-sm" id="add" type="button">加设备</button>
  </section>
  <section class="card">
    <h2>续航估算</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">可支撑</div>
      <div class="big" id="days" style="color:#fff">—</div>
      <div class="lbl" id="daily" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
    <p class="muted" id="tip" style="margin-top:10px"></p>
  </section>`,
    init: `
  var devs = AK.store.get('power.devs', [
    { name: '手机', w: 10, h: 3 }, { name: '相机电池', w: 8, h: 2 }, { name: '营地灯', w: 5, h: 5 }
  ]);
  function save() { AK.store.set('power.devs', devs); }
  function render() {
    AK.$('#devs').innerHTML = devs.map(function (d, i) {
      return '<div class="row" style="margin-bottom:8px">' +
        '<input value="' + AK.esc(d.name) + '" data-i="' + i + '" data-k="name" style="flex:1.4;min-width:90px">' +
        '<input type="number" value="' + d.w + '" data-i="' + i + '" data-k="w" style="flex:1;min-width:70px" placeholder="功率 W">' +
        '<input type="number" value="' + d.h + '" data-i="' + i + '" data-k="h" style="flex:1;min-width:70px" placeholder="小时/天">' +
        '<button class="btn btn-ghost btn-sm" data-del="' + i + '" type="button">删</button></div>';
    }).join('');
    AK.$$('#devs input').forEach(function (inp) {
      inp.oninput = function () {
        var i = Number(inp.dataset.i), k = inp.dataset.k;
        devs[i][k] = k === 'name' ? inp.value : AK.n(inp.value, 0);
        save(); calc();
      };
    });
    AK.$$('#devs button').forEach(function (b) {
      b.onclick = function () { devs.splice(Number(b.dataset.del), 1); save(); render(); };
    });
    calc();
  }
  function calc() {
    var wh = AK.n(AK.$('#wh').value, 0) * AK.n(AK.$('#k').value, 0.85);
    var daily = devs.reduce(function (s, d) { return s + AK.n(d.w, 0) * AK.n(d.h, 0); }, 0);
    if (daily <= 0) {
      AK.$('#days').textContent = '—';
      AK.$('#daily').textContent = '先填设备功率与使用时长';
      AK.$('#detail').innerHTML = '';
      return;
    }
    var days = wh / daily;
    AK.$('#days').innerHTML = days.toFixed(1) + ' <span style="font-size:15px">天</span>';
    AK.$('#daily').textContent = '每天耗电 ' + daily.toFixed(0) + ' Wh · 可用 ' + Math.round(wh) + ' Wh';
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>额定容量</span><b>' + AK.n(AK.$('#wh').value, 0) + ' Wh</b></div>' +
      '<div class="kv"><span>折算可用</span><b>' + Math.round(wh) + ' Wh</b></div>' +
      '<div class="kv"><span>每日总耗电</span><b>' + daily.toFixed(0) + ' Wh</b></div>' +
      '<div class="kv"><span>可支撑</span><b>' + days.toFixed(1) + ' 天（约 ' + Math.round(days * 24) + ' 小时）</b></div>';
    AK.$('#tip').textContent = days < 1 ? '不足一天，建议加大容量或减少大功率设备，低温环境还要再打七折。' : days < 2 ? '仅够一天多，建议白天用太阳能板补电。' : '余量尚可，仍建议带一条车充线或太阳能板作为备份。';
  }
  AK.on('#add', 'click', function () { devs.push({ name: '设备', w: 10, h: 1 }); save(); render(); });
  AK.on('#wh', 'input', calc); AK.on('#k', 'change', calc);
  render();`
  },
  {
    name: "家电能耗估算",
    slug: "jiadian-nenghao-gusuan",
    cat: "生活",
    icon: "🔌",
    tagline: "算清每台电器一个月吃多少电",
    theme: ["#d98b1f", "#6b3d06"],
    bg: "#fdf8ee",
    desc: "按电器功率和使用时长估算每月耗电度数与电费，支持多台累加。想省电费时，先看清到底是空调、热水器还是老旧冰箱在偷电。",
    feats: [
      "功率 × 时长估算每月度数，按电价折算电费",
      "支持多台电器累加，并按耗电排序",
      "内置常见电器功率参考值，一键填入",
      "显示每台设备占家庭总耗电的比例条",
    ],
    body: `
  <section class="card">
    <h2>电费单价</h2>
    <div class="row">
      <input id="price" type="number" value="0.6" step="0.01" style="flex:1;min-width:110px">
      <span class="muted">元 / 度（kWh）</span>
    </div>
  </section>
  <section class="card">
    <h2>电器清单 <small>功率 W · 每天小时 · 每月天数</small></h2>
    <div id="list"></div>
    <div class="row" style="margin-top:8px">
      <button class="btn btn-ghost btn-sm" id="add" type="button">加一台</button>
      <button class="btn btn-ghost btn-sm" id="preset" type="button">填入常见电器</button>
    </div>
  </section>
  <section class="card">
    <h2>月度估算 <small id="sum"></small></h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">每月电费</div>
      <div class="big" id="cost" style="color:#fff">—</div>
      <div class="lbl" id="kwh" style="margin-top:4px"></div>
    </div>
    <div id="bars"></div>
  </section>`,
    init: `
  var list = AK.store.get('power.cost', [
    { name: '空调', w: 1200, h: 6, d: 30 },
    { name: '冰箱', w: 120, h: 24, d: 30 },
    { name: '热水器', w: 2000, h: 1, d: 30 }
  ]);
  function save() { AK.store.set('power.cost', list); }
  function render() {
    AK.$('#list').innerHTML = list.map(function (x, i) {
      return '<div class="row" style="margin-bottom:8px">' +
        '<input value="' + AK.esc(x.name) + '" data-i="' + i + '" data-k="name" style="flex:1.4;min-width:80px">' +
        '<input type="number" value="' + x.w + '" data-i="' + i + '" data-k="w" style="flex:1;min-width:66px">' +
        '<input type="number" value="' + x.h + '" data-i="' + i + '" data-k="h" style="flex:1;min-width:60px">' +
        '<input type="number" value="' + x.d + '" data-i="' + i + '" data-k="d" style="flex:1;min-width:60px">' +
        '<button class="btn btn-ghost btn-sm" data-del="' + i + '" type="button">删</button></div>';
    }).join('');
    AK.$$('#list input').forEach(function (inp) {
      inp.oninput = function () {
        var i = Number(inp.dataset.i), k = inp.dataset.k;
        list[i][k] = k === 'name' ? inp.value : AK.n(inp.value, 0);
        save(); calc();
      };
    });
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () { list.splice(Number(b.dataset.del), 1); save(); render(); };
    });
    calc();
  }
  function calc() {
    var price = AK.n(AK.$('#price').value, 0.6);
    var rows = list.map(function (x) {
      return { name: x.name, kwh: AK.n(x.w, 0) * AK.n(x.h, 0) * AK.n(x.d, 0) / 1000 };
    }).sort(function (a, b) { return b.kwh - a.kwh; });
    var totalKwh = rows.reduce(function (s, r) { return s + r.kwh; }, 0);
    var cost = totalKwh * price;
    AK.$('#cost').innerHTML = cost.toFixed(1) + ' <span style="font-size:15px">元</span>';
    AK.$('#kwh').textContent = '每月用电 ' + totalKwh.toFixed(0) + ' 度 · 单价 ' + price + ' 元/度';
    AK.$('#sum').textContent = list.length + ' 台设备';
    AK.$('#bars').innerHTML = rows.map(function (r) {
      var pct = totalKwh ? Math.round(r.kwh / totalKwh * 100) : 0;
      return '<div style="margin-bottom:10px"><div class="row spread" style="font-size:12.5px;font-weight:700"><span>' + AK.esc(r.name) + '</span><span>' + r.kwh.toFixed(0) + ' 度 · ' + (r.kwh * price).toFixed(1) + ' 元（' + pct + '%）</span></div>' +
        '<div class="bar" style="margin-top:5px"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
  }
  AK.on('#price', 'input', calc);
  AK.on('#add', 'click', function () { list.push({ name: '电器', w: 100, h: 2, d: 30 }); save(); render(); });
  AK.on('#preset', 'click', function () {
    list = [{ name: '空调', w: 1200, h: 6, d: 30 }, { name: '冰箱', w: 120, h: 24, d: 30 }, { name: '洗衣机', w: 500, h: 1, d: 12 }, { name: '热水器', w: 2000, h: 1, d: 30 }, { name: '路由器', w: 10, h: 24, d: 30 }];
    save(); render();
    AK.toast('已填入常见电器');
  });
  render();`
  },
  {
    name: "多菜做饭计时器",
    slug: "duocai-zuofan-jishiqi",
    cat: "生活",
    icon: "🍳",
    tagline: "三道菜同时做，各自计时互不打扰",
    theme: ["#e2653f", "#7a2a12"],
    bg: "#fdf4f0",
    desc: "同时管理三个独立计时器：蒸、炖、烤箱可以一起开工，每个计时器单独设定分钟数，到点有提示音。做饭时不必记时间，也不用来回看手机。",
    feats: [
      "三个独立计时器并行运行，互不影响",
      "自定义分钟数，倒计时大字显示，余量进度条",
      "到点提示音，可单独暂停或重置",
      "常用时长快捷按钮（3/5/10/15/20/30 分钟）",
    ],
    body: `
  <section class="card">
    <h2>快捷时长</h2>
    <div class="row muted" style="gap:8px;margin-bottom:4px">设定分钟数后，点下方每个计时器的「开始」</div>
    <div class="row" id="quick"></div>
  </section>
  <section id="timers"></section>`,
    init: `
  var timers = [
    { name: '第一道菜', min: 10, left: 0, run: false, id: null },
    { name: '第二道菜', min: 15, left: 0, run: false, id: null },
    { name: '第三道菜', min: 20, left: 0, run: false, id: null }
  ];
  var audioCtx = null;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      for (var i = 0; i < 3; i++) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880 + i * 120;
        o.connect(g); g.connect(audioCtx.destination);
        var t0 = audioCtx.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.001, t0);
        g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
        o.start(t0); o.stop(t0 + 0.22);
      }
    } catch (e) {}
  }
  function paint() {
    AK.$('#timers').innerHTML = timers.map(function (t, i) {
      var left = t.left > 0 ? t.left : t.min * 60;
      var pct = Math.round(left / (t.min * 60) * 100);
      return '<section class="card"><div class="row spread" style="margin-bottom:8px">' +
        '<input value="' + AK.esc(t.name) + '" data-i="' + i + '" data-k="name" style="flex:1;border:none;background:none;padding:0;font-size:14px;font-weight:800;min-width:80px">' +
        '<span class="muted">' + t.min + ' 分钟</span></div>' +
        '<div class="row spread" style="align-items:baseline">' +
        '<div class="big" style="font-size:40px">' + AK.hm(left) + '</div>' +
        '<div class="row"><button class="btn btn-main btn-sm" data-act="toggle" data-i="' + i + '" type="button">' + (t.run ? '暂停' : '开始') + '</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="reset" data-i="' + i + '" type="button">重置</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="minus" data-i="' + i + '" type="button">-1分</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="plus" data-i="' + i + '" type="button">+1分</button></div></div>' +
        '<div class="bar" style="margin-top:12px"><i style="width:' + pct + '%"></i></div></section>';
    }).join('');
    AK.$$('#timers input').forEach(function (inp) {
      inp.oninput = function () { timers[Number(inp.dataset.i)].name = inp.value; };
    });
    AK.$$('#timers button').forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.dataset.i), t = timers[i];
        var act = b.dataset.act;
        if (act === 'toggle') {
          if (!t.left) t.left = t.min * 60;
          t.run = !t.run;
          if (t.run) startTimer(i); else clearInterval(t.id);
        } else if (act === 'reset') {
          clearInterval(t.id); t.run = false; t.left = t.min * 60;
        } else if (act === 'plus') {
          t.min = Math.min(90, t.min + 1); if (!t.run) t.left = t.min * 60;
        } else if (act === 'minus') {
          t.min = Math.max(1, t.min - 1); if (!t.run) t.left = t.min * 60;
        }
        paint();
      };
    });
  }
  function startTimer(i) {
    var t = timers[i];
    clearInterval(t.id);
    t.id = setInterval(function () {
      t.left--;
      if (t.left <= 0) {
        clearInterval(t.id); t.run = false; t.left = 0;
        beep();
        AK.toast(t.name + ' 时间到');
        paint();
        return;
      }
      var el = AK.$$('#timers .big')[i];
      if (el) el.textContent = AK.hm(t.left);
      var bar = AK.$$('#timers .bar i')[i];
      if (bar) bar.style.width = Math.round(t.left / (t.min * 60) * 100) + '%';
    }, 1000);
  }
  var qb = AK.$('#quick');
  [3, 5, 8, 10, 15, 20, 30].forEach(function (m) {
    var b = document.createElement('span');
    b.className = 'chip';
    b.textContent = m + ' 分钟';
    b.onclick = function () {
      timers[0].min = m; timers[0].left = m * 60; timers[0].run = false;
      clearInterval(timers[0].id);
      paint();
      AK.toast('第一个计时器设为 ' + m + ' 分钟');
    };
    qb.appendChild(b);
  });
  paint();`
  },
  {
    name: "洗护标签解读",
    slug: "xihu-biaoqian-jiedu",
    cat: "生活",
    icon: "🧺",
    tagline: "衣服上那些符号，一次看懂",
    theme: ["#3f7bd8", "#153a72"],
    bg: "#f1f6fe",
    desc: "点选衣服标签上的符号，立刻显示它的含义和正确做法：水温上限、能否漂白、能不能烘干、熨烫温度、干洗要求。洗坏一件衣服的代价，比看这一页高得多。",
    feats: [
      "收录洗、漂、烘、熨、干洗五类常见符号",
      "点符号即看含义与操作要点，支持多选组合",
      "自动汇总成一句洗涤说明，可复制",
      "附易洗坏面料的额外提醒",
    ],
    body: `
  <section class="card">
    <h2>选择符号</h2>
    <div id="groups"></div>
    <div class="row" style="margin-top:10px">
      <button class="btn btn-ghost btn-sm" id="clear" type="button">清空选择</button>
      <button class="btn btn-main btn-sm" id="copy" type="button">复制洗涤说明</button>
    </div>
  </section>
  <section class="card">
    <h2>解读结果</h2>
    <div id="out"><div class="empty">点上面的符号，这里会给出说明</div></div>
  </section>`,
    init: `
  var GROUPS = [
    ['洗涤', [
      ['30℃', '最高水温 30℃，常规机洗', '冷水或温水短时洗，深色衣物翻面'],
      ['40℃', '最高水温 40℃，常规机洗', '日常衣物常用档位'],
      ['手洗', '只能手洗，水温不超过 40℃', '轻揉，不要拧干'],
      ['不可水洗', '不能水洗，需干洗', '沾到污渍用湿布轻擦']
    ]],
    ['漂白', [
      ['可漂白', '可使用含氯或含氧漂白剂', '彩色衣物建议用氧系漂白'],
      ['仅氧漂', '只能使用氧系（非氯）漂白', '不要用 84 类含氯漂白剂'],
      ['不可漂白', '任何漂白剂都不行', '包括彩色漂白洗衣粉']
    ]],
    ['烘干', [
      ['可烘干', '可滚筒烘干，常规温度', '深色衣物低温烘，减少褪色'],
      ['低温烘', '只能低温烘干', '建议自然晾干更稳妥'],
      ['不可烘干', '不能烘干', '羊毛、真丝、弹性面料尤其注意']
    ]],
    ['熨烫', [
      ['低温熨', '熨斗底板最高 110℃', '不蒸汽，垫布熨'],
      ['中温熨', '最高 150℃', '可少量蒸汽'],
      ['高温熨', '最高 200℃', '棉麻适用'],
      ['不可熨', '不能熨烫', '包括挂烫机的蒸汽']
    ]],
    ['干洗', [
      ['可干洗', '可使用常规干洗', '告诉店家污渍位置'],
      ['仅干洗', '只能干洗，不可水洗', '西装、大衣、真丝常见'],
      ['不可干洗', '不能干洗', '水洗即可']
    ]]
  ];
  var picked = [];
  function render() {
    AK.$('#groups').innerHTML = GROUPS.map(function (g, gi) {
      return '<div style="margin-bottom:12px"><div style="font-size:12.5px;font-weight:800;color:var(--a);margin-bottom:7px">' + g[0] + '</div>' +
        '<div class="row">' + g[1].map(function (it, ii) {
          var on = picked.some(function (p) { return p.g === gi && p.i === ii; });
          return '<span class="chip' + (on ? ' on' : '') + '" data-g="' + gi + '" data-i="' + ii + '">' + it[0] + '</span>';
        }).join('') + '</div></div>';
    }).join('');
    AK.$$('#groups .chip').forEach(function (c) {
      c.onclick = function () {
        var g = Number(c.dataset.g), i = Number(c.dataset.i);
        var exists = picked.some(function (p) { return p.g === g; });
        picked = picked.filter(function (p) { return p.g !== g; });
        if (!exists) picked.push({ g: g, i: i });
        render();
      };
    });
    if (!picked.length) {
      AK.$('#out').innerHTML = '<div class="empty">点上面的符号，这里会给出说明</div>';
      return;
    }
    var sorted = picked.slice().sort(function (a, b) { return a.g - b.g; });
    AK.$('#out').innerHTML = sorted.map(function (p) {
      var g = GROUPS[p.g], it = g[1][p.i];
      return '<div class="item"><div class="grow"><div class="t">' + g[0] + '：' + it[0] + '</div>' +
        '<div class="s">' + it[1] + '。操作提示：' + it[2] + '</div></div></div>';
    }).join('') + '<p class="muted" style="margin-top:8px">羊毛、真丝、蕾丝等娇气面料，即使标着可机洗也建议装洗衣袋、选轻柔档。</p>';
  }
  AK.on('#clear', 'click', function () { picked = []; render(); });
  AK.on('#copy', 'click', function () {
    if (!picked.length) { AK.toast('先选几个符号'); return; }
    var txt = '洗涤说明：' + picked.slice().sort(function (a, b) { return a.g - b.g; }).map(function (p) {
      return GROUPS[p.g][0] + ' ' + GROUPS[p.g][1][p.i][1];
    }).join('；');
    AK.copy(txt);
  });
  render();`
  },
  {
    name: "家庭月度预算",
    slug: "jiating-yuedu-yusuan",
    cat: "生活",
    icon: "💰",
    tagline: "收入支出记一笔，月底不看糊涂账",
    theme: ["#2f855a", "#12402a"],
    bg: "#f2faf6",
    desc: "按分类记录本月收入与各项支出，实时算出结余、储蓄率和最大支出项。分类固定但可自定义金额，比记账 App 更轻，适合月底复盘家庭开销。",
    feats: [
      "收入与八大支出分类，实时汇总结余",
      "自动算储蓄率，标出占比最高的支出项",
      "每条支出右侧显示占总支出比例",
      "数据保存在本机，可随时清零重记",
    ],
    body: `
  <section class="card">
    <h2>本月收入</h2>
    <div class="row">
      <input id="income" type="number" value="18000" step="100" style="flex:1">
      <span class="muted">元</span>
    </div>
  </section>
  <section class="card">
    <h2>支出明细 <small id="sum"></small></h2>
    <div id="items"></div>
  </section>
  <section class="card">
    <h2>本月结余</h2>
    <div class="result" style="margin-bottom:12px">
      <div class="lbl">结余</div>
      <div class="big" id="balance" style="color:#fff">—</div>
      <div class="lbl" id="rate" style="margin-top:4px"></div>
    </div>
    <div id="detail"></div>
  </section>`,
    init: `
  var CATS = ['房贷/房租', '餐饮', '交通', '水电燃气', '日用采购', '教育医疗', '娱乐社交', '其他'];
  var data = AK.store.get('budget.data', {
    income: 18000,
    items: { '房贷/房租': 5000, '餐饮': 3000, '交通': 800, '水电燃气': 400, '日用采购': 1200, '教育医疗': 600, '娱乐社交': 1000, '其他': 500 }
  });
  function save() { AK.store.set('budget.data', data); }
  function render() {
    AK.$('#income').value = data.income;
    AK.$('#items').innerHTML = CATS.map(function (c) {
      return '<div class="row" style="margin-bottom:8px"><span style="flex:1;font-size:13px;font-weight:600">' + c + '</span>' +
        '<input type="number" value="' + (data.items[c] || 0) + '" data-c="' + c + '" style="flex:1;min-width:80px">' +
        '<span class="muted" data-p="' + c + '" style="width:52px;text-align:right">—</span></div>';
    }).join('');
    AK.$$('#items input').forEach(function (inp) {
      inp.oninput = function () {
        data.items[inp.dataset.c] = AK.n(inp.value, 0);
        save(); calc();
      };
    });
    calc();
  }
  function calc() {
    var income = AK.n(AK.$('#income').value, 0);
    data.income = income;
    var total = CATS.reduce(function (s, c) { return s + AK.n(data.items[c], 0); }, 0);
    var balance = income - total;
    var rate = income > 0 ? Math.round(balance / income * 100) : 0;
    AK.$('#balance').innerHTML = balance.toLocaleString('zh-CN') + ' <span style="font-size:15px">元</span>';
    AK.$('#rate').textContent = '储蓄率 ' + rate + '% · 支出 ' + total.toLocaleString('zh-CN') + ' 元';
    AK.$('#sum').textContent = total ? '支出合计 ' + total.toLocaleString('zh-CN') + ' 元' : '';
    CATS.forEach(function (c) {
      var el = AK.$$('[data-p="' + c + '"]')[0];
      if (el) el.textContent = total ? Math.round(AK.n(data.items[c], 0) / total * 100) + '%' : '—';
    });
    var top = CATS.slice().sort(function (a, b) { return AK.n(data.items[b], 0) - AK.n(data.items[a], 0); })[0];
    AK.$('#detail').innerHTML =
      '<div class="kv"><span>收入</span><b>' + income.toLocaleString('zh-CN') + ' 元</b></div>' +
      '<div class="kv"><span>支出</span><b>' + total.toLocaleString('zh-CN') + ' 元</b></div>' +
      '<div class="kv"><span>最大支出项</span><b>' + top + '（' + AK.n(data.items[top], 0).toLocaleString('zh-CN') + ' 元）</b></div>' +
      '<p class="muted" style="margin-top:10px">' + (rate >= 30 ? '储蓄率不错，可以考虑把结余分一部分做长期储备。' : rate >= 10 ? '储蓄率偏低，先看看「' + top + '」还有没有压缩空间。' : '几乎月光，建议给支出设上限，先把固定开销压下来。') + '</p>';
    save();
  }
  AK.on('#income', 'input', calc);
  render();`
  },
  {
    name: "冰箱库存管理",
    slug: "bingxiang-kucun-guanli",
    cat: "生活",
    icon: "🥬",
    tagline: "先吃快过期的，少扔一点菜",
    theme: ["#3c9e6e", "#14503a"],
    bg: "#f1faf6",
    desc: "把冰箱里的食材和保质期记下来，按临期顺序排列，过期与三天内到期分别高亮。买菜前看一眼清单，能少买重复的，也能少扔烂掉的。",
    feats: [
      "记录食材、数量与保质期，按临期排序",
      "过期标红、三天内到期标黄，一眼分清优先级",
      "统计在库件数与临期数量",
      "数据保存在本机，取用后一键移除",
    ],
    body: `
  <section class="card">
    <h2>放进冰箱</h2>
    <div class="grid2">
      <div><label>食材</label><input id="n" placeholder="如 牛奶"></div>
      <div><label>数量</label><input id="q" placeholder="如 2 盒"></div>
      <div><label>保质期</label><input id="d" type="date"></div>
      <div><label>位置</label><select id="pos"><option>冷藏</option><option>冷冻</option><option>门架</option><option>果蔬格</option></select></div>
    </div>
    <button class="btn btn-main" id="add" type="button" style="margin-top:12px">加入库存</button>
  </section>
  <section class="card">
    <h2>库存 <small id="sum"></small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var list = AK.store.get('fridge.list', []);
  function save() { AK.store.set('fridge.list', list); }
  function leftDays(d) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((new Date(d + 'T00:00:00') - now) / 86400000);
  }
  function render() {
    list.sort(function (a, b) { return a.d.localeCompare(b.d); });
    var soon = list.filter(function (x) { return leftDays(x.d) <= 3; }).length;
    AK.$('#sum').textContent = list.length + ' 件' + (soon ? ' · ' + soon + ' 件临期' : '');
    AK.$('#list').innerHTML = list.length ? list.map(function (x) {
      var left = leftDays(x.d);
      var color = left < 0 ? '#c0392b' : left <= 3 ? '#b26a00' : 'var(--a)';
      var txt = left < 0 ? '已过期 ' + (-left) + ' 天' : left === 0 ? '今天到期' : '还有 ' + left + ' 天';
      var bg = left < 0 ? '#fdeaea' : left <= 3 ? '#fff8e6' : '#fff';
      return '<div class="item" style="background:' + bg + '"><div class="grow"><div class="t">' + AK.esc(x.n) + ' <span class="tag">' + x.pos + '</span></div>' +
        '<div class="s">' + (x.q || '未填数量') + ' · 保质期至 ' + x.d + '</div></div>' +
        '<b style="color:' + color + ';white-space:nowrap;font-size:12.5px">' + txt + '</b>' +
        '<button class="btn btn-ghost btn-sm" data-id="' + x.id + '" type="button">吃掉</button></div>';
    }).join('') : '<div class="empty">冰箱是空的，先记几样</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        list = list.filter(function (x) { return x.id !== b.dataset.id; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var n = AK.$('#n').value.trim(), d = AK.$('#d').value;
    if (!n || !d) { AK.toast('食材和保质期都要填'); return; }
    list.push({ id: AK.uid(), n: n, q: AK.$('#q').value.trim(), d: d, pos: AK.$('#pos').value });
    save(); render();
    AK.$('#n').value = ''; AK.$('#q').value = '';
    AK.toast('已入库');
  });
  var t = new Date(); t.setDate(t.getDate() + 7);
  AK.$('#d').value = AK.ymd(t);
  render();`
  },
  {
    name: "水电抄表记录",
    slug: "shuidian-chaobiao-jilu",
    cat: "生活",
    icon: "📊",
    tagline: "每月抄表数字一记，用量趋势就出来了",
    theme: ["#2f7fa8", "#0e3a4d"],
    bg: "#f1f8fb",
    desc: "每月录入水表和电表读数，自动算出本期用量、环比变化与费用，并以柱状图显示近半年趋势。租房、家庭记账、核对物业账单都能用。",
    feats: [
      "录入表底数，自动算本期用量与环比涨跌",
      "水、电分别统计，按单价折算费用",
      "近六个月用量柱状趋势，异常月份一眼看出",
      "记录保存在本机，可逐条删除",
    ],
    body: `
  <section class="card">
    <h2>录入读数</h2>
    <div class="grid2">
      <div><label>月份</label><input id="m" type="month"></div>
      <div><label>类型</label><select id="type"><option value="power">电表</option><option value="water">水表</option></select></div>
      <div><label>表底数</label><input id="v" type="number" step="0.1" placeholder="如 3250"></div>
      <div><label>单价</label><input id="price" type="number" step="0.01" value="0.6"></div>
    </div>
    <button class="btn btn-main" id="add" type="button" style="margin-top:12px">保存读数</button>
  </section>
  <section class="card">
    <h2>本期用量 <small id="unit"></small></h2>
    <div id="stat"></div>
    <div id="chart" style="display:flex;align-items:flex-end;gap:8px;height:120px;margin-top:14px"></div>
    <div id="labels" style="display:flex;gap:8px;margin-top:6px"></div>
  </section>
  <section class="card">
    <h2>全部记录 <small id="cnt"></small></h2>
    <div id="list"></div>
  </section>`,
    init: `
  var recs = AK.store.get('meter.recs', []);
  function save() { AK.store.set('meter.recs', recs); }
  function render() {
    var type = AK.$('#type').value;
    var rows = recs.filter(function (r) { return r.type === type; }).sort(function (a, b) { return a.m.localeCompare(b.m); });
    var unit = type === 'power' ? '度（kWh）' : '吨（m³）';
    AK.$('#unit').textContent = unit;
    if (rows.length < 2) {
      AK.$('#stat').innerHTML = '<div class="empty">至少录入两个月的读数，才能算出用量</div>';
      AK.$('#chart').innerHTML = '';
      AK.$('#labels').innerHTML = '';
    } else {
      var last = rows[rows.length - 1], prev = rows[rows.length - 2];
      var use = Math.max(0, AK.n(last.v, 0) - AK.n(prev.v, 0));
      var prevUse = Math.max(0, AK.n(prev.v, 0) - AK.n(rows[rows.length - 3] ? rows[rows.length - 3].v : 0, 0));
      var cost = use * AK.n(last.price, type === 'power' ? 0.6 : 3.5);
      var change = prevUse > 0 ? Math.round((use - prevUse) / prevUse * 100) : 0;
      AK.$('#stat').innerHTML =
        '<div class="kv"><span>' + last.m + ' 用量</span><b>' + use.toFixed(1) + ' ' + unit + '</b></div>' +
        '<div class="kv"><span>折合费用</span><b>' + cost.toFixed(1) + ' 元</b></div>' +
        '<div class="kv"><span>环比上月</span><b style="color:' + (change > 15 ? '#c0392b' : change < -10 ? '#2f855a' : 'var(--ink)') + '">' + (change > 0 ? '+' : '') + change + '%</b></div>';
      var series = rows.slice(-6);
      var max = 1;
      var vals = series.map(function (r, i) {
        var base = i === 0 ? r.v : series[i - 1].v;
        var u = Math.max(0, AK.n(r.v, 0) - AK.n(base, 0));
        max = Math.max(max, u);
        return { m: r.m, u: u };
      });
      AK.$('#chart').innerHTML = vals.map(function (x) {
        var h = Math.round(x.u / max * 100) + 4;
        return '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center">' +
          '<div style="font-size:10px;color:var(--ink3);margin-bottom:3px">' + x.u.toFixed(0) + '</div>' +
          '<div style="width:100%;height:' + h + 'px;border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,var(--a),var(--b))"></div></div>';
      }).join('');
      AK.$('#labels').innerHTML = vals.map(function (x) {
        return '<div style="flex:1;text-align:center;font-size:10px;color:var(--ink3)">' + x.m.slice(5) + '月</div>';
      }).join('');
    }
    var all = recs.slice().sort(function (a, b) { return b.m.localeCompare(a.m); });
    AK.$('#cnt').textContent = all.length ? all.length + ' 条' : '';
    AK.$('#list').innerHTML = all.length ? all.map(function (r) {
      return '<div class="item"><div class="grow"><div class="t">' + r.m + ' · ' + (r.type === 'power' ? '电表' : '水表') + '</div>' +
        '<div class="s">表底 ' + r.v + ' · 单价 ' + r.price + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-id="' + r.id + '" type="button">删</button></div>';
    }).join('') : '<div class="empty">还没有抄表记录</div>';
    AK.$$('#list button').forEach(function (b) {
      b.onclick = function () {
        recs = recs.filter(function (x) { return x.id !== b.dataset.id; });
        save(); render();
      };
    });
  }
  AK.on('#add', 'click', function () {
    var m = AK.$('#m').value, v = AK.$('#v').value;
    if (!m || v === '') { AK.toast('月份和读数都要填'); return; }
    var type = AK.$('#type').value;
    recs = recs.filter(function (r) { return !(r.m === m && r.type === type); });
    recs.push({ id: AK.uid(), m: m, v: AK.n(v, 0), type: type, price: AK.n(AK.$('#price').value, type === 'power' ? 0.6 : 3.5) });
    save(); render();
    AK.$('#v').value = '';
    AK.toast('已保存');
  });
  AK.on('#type', 'change', render);
  AK.$('#m').value = AK.ymd().slice(0, 7);
  render();`
  }
];
