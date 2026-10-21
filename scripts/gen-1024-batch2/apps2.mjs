/* 第二批 · 游戏七个 */
export default [
  {
    name: "五子棋人机对战",
    slug: "wuziqi-renji-duizhan",
    cat: "游戏",
    icon: "⚫",
    tagline: "15 路棋盘，跟电脑下一盘",
    theme: ["#3b4351", "#151922"],
    bg: "#f4f5f7",
    desc: "标准 15 路五子棋，你执黑先行，电脑按连线评分应招：先堵你的活三，再铺自己的进攻。高亮最后一手，五连立刻判胜，支持悔棋与重新开局。",
    feats: [
      "15×15 标准棋盘，鼠标点击或手指点按落子",
      "电脑按连子数与活眼评分选点，会堵活三冲四",
      "高亮最后一手，胜负即时判定并提示",
      "支持悔棋一步、重新开局，战绩存在本机",
    ],
    css: ".board{width:100%;max-width:480px;display:block;margin:0 auto;border-radius:14px;touch-action:manipulation}",
    body: `
  <section class="card">
    <canvas id="cv" class="board" width="480" height="480"></canvas>
    <div class="row spread" style="margin-top:12px">
      <span id="status" style="font-weight:800;font-size:13.5px">你先走，执黑</span>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="undo" type="button">悔棋</button>
        <button class="btn btn-main btn-sm" id="restart" type="button">重新开局</button>
      </div>
    </div>
  </section>
  <section class="card">
    <h2>战绩 <small>保存在本机</small></h2>
    <div class="grid2">
      <div><div class="muted">胜</div><div class="big" id="w">0</div></div>
      <div><div class="muted">负</div><div class="big" id="l">0</div></div>
    </div>
  </section>`,
    init: `
  var N = 15, cv = AK.$('#cv'), ctx = cv.getContext('2d'), cell = cv.width / N, PAD = cell / 2;
  var board, over, last, history, stat = AK.store.get('wuziqi.stat', { w: 0, l: 0 });
  function init() {
    board = [];
    for (var i = 0; i < N; i++) board.push(new Array(N).fill(0));
    over = false; last = null; history = [];
    AK.$('#status').textContent = '你先走，执黑';
    draw();
  }
  function draw() {
    ctx.fillStyle = '#e8c88f'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(90,60,20,.45)'; ctx.lineWidth = 1;
    for (var i = 0; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(PAD + i * cell, PAD); ctx.lineTo(PAD + i * cell, cv.height - PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, PAD + i * cell); ctx.lineTo(cv.width - PAD, PAD + i * cell); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(90,60,20,.6)';
    [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]].forEach(function (p) {
      ctx.beginPath(); ctx.arc(PAD + p[0] * cell, PAD + p[1] * cell, 4, 0, 7); ctx.fill();
    });
    for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
      if (!board[x][y]) continue;
      var cx = PAD + x * cell, cy = PAD + y * cell, r = cell * 0.42;
      var g = ctx.createRadialGradient(cx - r / 3, cy - r / 3, r / 6, cx, cy, r);
      if (board[x][y] === 1) { g.addColorStop(0, '#5a6270'); g.addColorStop(1, '#14171d'); }
      else { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd4dc'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    }
    if (last) {
      ctx.strokeStyle = '#e8452c'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(PAD + last[0] * cell, PAD + last[1] * cell, cell * 0.47, 0, 7); ctx.stroke();
    }
  }
  function cellAt(e) {
    var r = cv.getBoundingClientRect();
    var px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    var x = Math.round(px / r.width * N - 0.5), y = Math.round(py / r.height * N - 0.5);
    if (x < 0 || y < 0 || x >= N || y >= N) return null;
    return [x, y];
  }
  function win(x, y, role) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (var d = 0; d < 4; d++) {
      var c = 1;
      for (var s = 1; s < 5; s++) { var nx = x + dirs[d][0] * s, ny = y + dirs[d][1] * s; if (nx < 0 || ny < 0 || nx >= N || ny >= N || board[nx][ny] !== role) break; c++; }
      for (var s2 = 1; s2 < 5; s2++) { var mx = x - dirs[d][0] * s2, my = y - dirs[d][1] * s2; if (mx < 0 || my < 0 || mx >= N || my >= N || board[mx][my] !== role) break; c++; }
      if (c >= 5) return true;
    }
    return false;
  }
  function lineScore(x, y, role) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]], total = 0;
    for (var d = 0; d < 4; d++) {
      var c = 1, open = 0;
      for (var s = 1; s < 5; s++) { var nx = x + dirs[d][0] * s, ny = y + dirs[d][1] * s; if (nx < 0 || ny < 0 || nx >= N || ny >= N) break; if (board[nx][ny] === role) c++; else { if (board[nx][ny] === 0) open++; break; } }
      for (var s2 = 1; s2 < 5; s2++) { var mx = x - dirs[d][0] * s2, my = y - dirs[d][1] * s2; if (mx < 0 || my < 0 || mx >= N || my >= N) break; if (board[mx][my] === role) c++; else { if (board[mx][my] === 0) open++; break; } }
      if (c >= 5) total += 1000000;
      else total += Math.pow(9, c) * (open ? 1.2 : 1);
    }
    return total;
  }
  function ai() {
    var best = null, bestScore = -1;
    for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
      if (board[x][y]) continue;
      var near = false;
      for (var dx = -2; dx <= 2 && !near; dx++) for (var dy = -2; dy <= 2; dy++) {
        var nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && board[nx][ny]) { near = true; break; }
      }
      if (!near) continue;
      var s = lineScore(x, y, 2) * 1.08 + lineScore(x, y, 1) + Math.random() * 4;
      if (s > bestScore) { bestScore = s; best = [x, y]; }
    }
    return best || [7, 7];
  }
  function place(x, y, role) {
    board[x][y] = role; last = [x, y]; history.push([x, y, role]); draw();
    if (win(x, y, role)) {
      over = true;
      if (role === 1) { stat.w = (stat.w || 0) + 1; AK.$('#status').textContent = '你赢了'; AK.toast('五连，漂亮'); }
      else { stat.l = (stat.l || 0) + 1; AK.$('#status').textContent = '电脑赢了'; }
      AK.store.set('wuziqi.stat', stat); paint();
      return true;
    }
    return false;
  }
  function paint() {
    AK.$('#w').textContent = stat.w || 0;
    AK.$('#l').textContent = stat.l || 0;
  }
  function play(e) {
    if (over) return;
    var p = cellAt(e);
    if (!p || board[p[0]][p[1]]) return;
    if (e.preventDefault) e.preventDefault();
    if (place(p[0], p[1], 1)) return;
    AK.$('#status').textContent = '电脑思考中…';
    setTimeout(function () {
      var a = ai();
      if (place(a[0], a[1], 2)) return;
      AK.$('#status').textContent = '轮到你了，执黑';
    }, 120);
  }
  cv.addEventListener('click', play);
  AK.on('#restart', 'click', function () { init(); paint(); });
  AK.on('#undo', 'click', function () {
    over = false;
    var n = 0;
    while (history.length && n < 2) { var h = history.pop(); board[h[0]][h[1]] = 0; n++; }
    last = history.length ? [history[history.length - 1][0], history[history.length - 1][1]] : null;
    AK.$('#status').textContent = '轮到你了，执黑';
    draw();
  });
  paint(); init();`
  },
  {
    name: "合成 2048",
    slug: "hecheng-2048",
    cat: "游戏",
    icon: "🔢",
    tagline: "上下左右滑动，合成 2048",
    theme: ["#f0b429", "#8a5b00"],
    bg: "#fdf8ec",
    desc: "经典 2048 规则的网页版：相同数字碰撞即合并，每步随机补一个 2 或 4，目标合出 2048。支持键盘方向键与手机滑动，最高分记录在本机，走错可以撤销一步。",
    feats: [
      "4×4 棋盘，键盘方向键与触摸滑动都能操作",
      "合并即时结算得分，最高分自动保存",
      "支持一步撤销，走错不必重开",
      "达成 2048 后可继续挑战更高分",
    ],
    css: ".g2048{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#bbada0;padding:8px;border-radius:14px;user-select:none}.g2048 div{aspect-ratio:1;border-radius:9px;display:grid;place-items:center;font-size:26px;font-weight:900;background:#cdc1b4;color:#776e65}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <div><div class="muted">得分</div><div class="big" id="score">0</div></div>
      <div style="text-align:right"><div class="muted">最高分</div><div class="big" id="best">0</div></div>
    </div>
    <div class="g2048" id="grid"></div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="undo" type="button">撤销</button>
      <button class="btn btn-main btn-sm" id="restart" type="button">重新开始</button>
      <span class="muted" id="msg"></span>
    </div>
  </section>`,
    init: `
  var COLORS = { 2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'], 32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'], 512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff'] };
  var g, score, best = AK.store.get('g2048.best', 0), prev = null, dead = false;
  function init() {
    g = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    score = 0; prev = null; dead = false;
    add(); add();
    AK.$('#msg').textContent = '';
    paint();
  }
  function add() {
    var empty = [];
    for (var x = 0; x < 4; x++) for (var y = 0; y < 4; y++) if (!g[x][y]) empty.push([x, y]);
    if (!empty.length) return;
    var p = empty[Math.floor(Math.random() * empty.length)];
    g[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
  }
  function paint() {
    var box = AK.$('#grid');
    if (box.children.length !== 16) {
      box.innerHTML = '';
      for (var i = 0; i < 16; i++) box.appendChild(document.createElement('div'));
    }
    for (var x = 0; x < 4; x++) for (var y = 0; y < 4; y++) {
      var v = g[x][y], el = box.children[x * 4 + y];
      el.textContent = v || '';
      var c = COLORS[v] || ['#3c3a32', '#fff'];
      el.style.background = c[0]; el.style.color = c[1];
      el.style.fontSize = v > 999 ? '20px' : v > 99 ? '23px' : '26px';
    }
    AK.$('#score').textContent = score;
    if (score > best) { best = score; AK.store.set('g2048.best', best); }
    AK.$('#best').textContent = best;
  }
  function move(dir) {
    if (dead) return;
    var snapshot = JSON.stringify(g), oldScore = score;
    var vec = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
    var moved = false;
    for (var pass = 0; pass < 4; pass++) {
      for (var x = 0; x < 4; x++) for (var y = 0; y < 4; y++) {
        var nx = x + vec[0], ny = y + vec[1];
        if (nx < 0 || ny < 0 || nx > 3 || ny > 3) continue;
        if (g[nx][ny] === 0 && g[x][y] !== 0) { g[nx][ny] = g[x][y]; g[x][y] = 0; moved = true; }
        else if (g[nx][ny] === g[x][y] && g[x][y] !== 0) { g[nx][ny] = g[x][y] * 2; g[x][y] = 0; score += g[nx][ny]; moved = true; }
      }
    }
    if (!moved) return;
    prev = { g: snapshot, score: oldScore };
    add(); paint();
    if (g.some(function (r) { return r.indexOf(2048) >= 0; })) AK.$('#msg').textContent = '达成 2048，可以继续冲更高分';
    if (isDead()) { dead = true; AK.$('#msg').textContent = '没有可走的步了，得分 ' + score; }
  }
  function isDead() {
    for (var x = 0; x < 4; x++) for (var y = 0; y < 4; y++) {
      if (!g[x][y]) return false;
      if (x < 3 && g[x][y] === g[x + 1][y]) return false;
      if (y < 3 && g[x][y] === g[x][y + 1]) return false;
    }
    return true;
  }
  window.addEventListener('keydown', function (e) {
    var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  });
  var sx = 0, sy = 0;
  AK.on('#grid', 'touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; });
  AK.on('#grid', 'touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  AK.on('#undo', 'click', function () {
    if (!prev) { AK.toast('没有可撤销的步数'); return; }
    g = JSON.parse(prev.g); score = prev.score; prev = null; dead = false;
    AK.$('#msg').textContent = '';
    paint();
  });
  AK.on('#restart', 'click', init);
  init();`
  },
  {
    name: "贪吃蛇",
    slug: "tandoushe-xiaoyouxi",
    cat: "游戏",
    icon: "🐍",
    tagline: "越吃越长，别撞墙也别咬到自己",
    theme: ["#2ea44f", "#0e4626"],
    bg: "#f1faf3",
    desc: "20×20 网格上的经典贪吃蛇：吃到果子身体加长、分数增加，每吃 5 个提速一档。支持方向键与手机滑动，撞墙或咬到自己即结束，最高分与最近三局成绩记录在本机。",
    feats: [
      "20×20 网格，方向键与滑动操作，禁止 180° 回头",
      "每 5 分自动提速一档，难度逐级提升",
      "最高分与最近三局成绩记录在本机",
      "支持暂停与一键重开",
    ],
    css: ".snake{width:100%;max-width:440px;display:block;margin:0 auto;border-radius:14px;background:#0b1b12;touch-action:none}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:10px">
      <div><div class="muted">得分</div><div class="big" id="score">0</div></div>
      <div style="text-align:right"><div class="muted">最高分</div><div class="big" id="best">0</div></div>
    </div>
    <canvas id="cv" class="snake" width="440" height="440"></canvas>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-main btn-sm" id="start" type="button">开始 / 重开</button>
      <button class="btn btn-ghost btn-sm" id="pause" type="button">暂停</button>
      <span class="muted" id="msg">按方向键开始</span>
    </div>
  </section>`,
    init: `
  var N = 20, cv = AK.$('#cv'), ctx = cv.getContext('2d'), c = cv.width / N;
  var snake, dir, nextDir, food, timer, score, dead, paused, speed;
  var best = AK.store.get('snake.best', 0), runs = AK.store.get('snake.runs', []);
  function init() {
    snake = [[10, 10], [9, 10], [8, 10]];
    dir = [1, 0]; nextDir = [1, 0];
    score = 0; dead = false; paused = false; speed = 160;
    food = spawn();
    AK.$('#msg').textContent = '按方向键开始';
    AK.$('#score').textContent = '0';
    AK.$('#best').textContent = best;
    clearInterval(timer); timer = null;
    draw();
  }
  function spawn() {
    var p;
    do { p = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; }
    while (snake.some(function (s) { return s[0] === p[0] && s[1] === p[1]; }));
    return p;
  }
  function draw() {
    ctx.fillStyle = '#0b1b12'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ff6b5b';
    ctx.beginPath(); ctx.arc(food[0] * c + c / 2, food[1] * c + c / 2, c * 0.34, 0, 7); ctx.fill();
    snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? '#8bf59d' : 'rgba(46,164,79,' + Math.max(0.28, 0.92 - i * 0.02) + ')';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(s[0] * c + 1.5, s[1] * c + 1.5, c - 3, c - 3, 5);
      else ctx.rect(s[0] * c + 1.5, s[1] * c + 1.5, c - 3, c - 3);
      ctx.fill();
    });
  }
  function step() {
    if (paused || dead) return;
    dir = nextDir;
    var head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N) return over();
    if (snake.some(function (s) { return s[0] === head[0] && s[1] === head[1]; })) return over();
    snake.unshift(head);
    if (head[0] === food[0] && head[1] === food[1]) {
      score++; AK.$('#score').textContent = score; food = spawn();
      if (score % 5 === 0) { speed = Math.max(70, speed - 14); restartTimer(); }
    } else snake.pop();
    draw();
  }
  function over() {
    dead = true; clearInterval(timer); timer = null;
    if (score > best) { best = score; AK.store.set('snake.best', best); }
    runs = [score].concat(runs).slice(0, 3); AK.store.set('snake.runs', runs);
    AK.$('#best').textContent = best;
    AK.$('#msg').textContent = '撞到了，本局 ' + score + ' 分 · 最近 ' + runs.join(' / ');
    AK.toast('游戏结束，得分 ' + score);
  }
  function restartTimer() { clearInterval(timer); if (!dead) timer = setInterval(step, speed); }
  function turn(nx, ny) {
    if (nx === -dir[0] && ny === -dir[1]) return;
    nextDir = [nx, ny];
    if (dead) { init(); }
    if (!timer) { timer = setInterval(step, speed); AK.$('#msg').textContent = '游戏中'; }
  }
  window.addEventListener('keydown', function (e) {
    var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (m) { e.preventDefault(); turn(m[0], m[1]); }
    if (e.key === ' ') { e.preventDefault(); paused = !paused; AK.$('#msg').textContent = paused ? '已暂停' : '游戏中'; }
  });
  var sx = 0, sy = 0;
  cv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; e.preventDefault(); });
  cv.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
  });
  AK.on('#start', 'click', function () { init(); timer = setInterval(step, speed); AK.$('#msg').textContent = '游戏中'; });
  AK.on('#pause', 'click', function () { paused = !paused; AK.$('#msg').textContent = paused ? '已暂停' : '游戏中'; });
  init();`
  },
  {
    name: "记忆翻牌",
    slug: "jiyi-fanpai",
    cat: "游戏",
    icon: "🃏",
    tagline: "八对图案，考验短时记忆",
    theme: ["#8a4bd6", "#3d1a6b"],
    bg: "#f8f3fe",
    desc: "4×4 共 16 张牌，两两配对。翻牌即时判定，配对成功保持翻开，失败一秒后盖回。记录步数、用时与历史最佳成绩，是测试短时记忆的轻量小游戏。",
    feats: [
      "16 张牌随机打乱，8 对图案每局不同",
      "步数与计时同步统计，配错自动盖回",
      "最佳成绩（步数 / 用时）保存在本机",
      "支持重开一局，进度实时显示",
    ],
    css: ".mem{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.mem button{aspect-ratio:1;border:none;border-radius:12px;font-size:26px;cursor:pointer;background:linear-gradient(150deg,var(--a),var(--b));color:transparent;transition:.18s;font-family:inherit}.mem button.open{background:#fff;color:var(--ink);box-shadow:inset 0 0 0 2px var(--line)}.mem button.done{background:#f0eafd;color:var(--ink);opacity:.75}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <div class="row" style="gap:18px">
        <div><div class="muted">步数</div><div class="big" id="moves">0</div></div>
        <div><div class="muted">用时</div><div class="big" id="time">0:00</div></div>
      </div>
      <button class="btn btn-main btn-sm" id="restart" type="button">重开一局</button>
    </div>
    <div class="mem" id="grid"></div>
    <p class="muted" id="msg" style="margin-top:12px">点开两张相同的图案即可配对</p>
  </section>
  <section class="card">
    <h2>历史最佳 <small>保存在本机</small></h2>
    <div class="kv"><span>最少步数</span><b id="bestm">—</b></div>
    <div class="kv"><span>最快用时</span><b id="bestt">—</b></div>
  </section>`,
    init: `
  var ICONS = ['🍀', '🌵', '🍉', '🎈', '🐳', '🎧', '🍜', '🚀'];
  var deck, first, lock, moves, sec, timer, left;
  var best = AK.store.get('mem.best', { moves: 0, sec: 0 });
  function init() {
    deck = ICONS.concat(ICONS).sort(function () { return Math.random() - 0.5; });
    first = null; lock = false; moves = 0; sec = 0; left = 8;
    clearInterval(timer);
    timer = setInterval(function () { sec++; AK.$('#time').textContent = AK.hm(sec); }, 1000);
    AK.$('#moves').textContent = '0';
    AK.$('#time').textContent = '0:00';
    AK.$('#msg').textContent = '点开两张相同的图案即可配对';
    paintBest();
    var box = AK.$('#grid');
    box.innerHTML = '';
    deck.forEach(function (icon, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = icon;
      b.dataset.icon = icon;
      b.onclick = function () { flip(b); };
      box.appendChild(b);
    });
  }
  function flip(b) {
    if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
    b.classList.add('open');
    if (!first) { first = b; return; }
    moves++;
    AK.$('#moves').textContent = moves;
    if (first.dataset.icon === b.dataset.icon) {
      first.classList.add('done'); b.classList.add('done');
      first.classList.remove('open'); b.classList.remove('open');
      first = null; left--;
      if (!left) finish();
    } else {
      lock = true;
      var a = first;
      first = null;
      setTimeout(function () {
        a.classList.remove('open'); b.classList.remove('open');
        lock = false;
      }, 700);
    }
  }
  function finish() {
    clearInterval(timer);
    AK.$('#msg').textContent = '全部配对完成：' + moves + ' 步，用时 ' + AK.hm(sec);
    if (!best.moves || moves < best.moves) best.moves = moves;
    if (!best.sec || sec < best.sec) best.sec = sec;
    AK.store.set('mem.best', best);
    paintBest();
    AK.toast('完成，用时 ' + AK.hm(sec));
  }
  function paintBest() {
    AK.$('#bestm').textContent = best.moves ? best.moves + ' 步' : '—';
    AK.$('#bestt').textContent = best.sec ? AK.hm(best.sec) : '—';
  }
  AK.on('#restart', 'click', init);
  init();`
  },
  {
    name: "扫雷经典版",
    slug: "saolei-jingdianban",
    cat: "游戏",
    icon: "💣",
    tagline: "九乘九十个雷，第一次点绝对安全",
    theme: ["#4a5568", "#1a202c"],
    bg: "#f5f6f8",
    desc: "经典扫雷玩法：9×9 网格埋 10 颗雷，左键翻开、右键插旗，数字表示周围雷数。第一次点击保证安全，踩雷立即结束，翻开全部安全格即获胜，含计时与最佳成绩。",
    feats: [
      "9×9 / 10 雷，首次点击保证安全不炸",
      "左键翻开、右键插旗，手机长按也能插旗",
      "计时与最快纪录、胜局统计保存在本机",
      "踩雷后显示全部雷位，方便复盘",
    ],
    css: ".mine{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;background:#c9ced8;padding:6px;border-radius:12px}.mine button{aspect-ratio:1;border:none;border-radius:5px;background:#eef0f5;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;color:#2d3748;padding:0}.mine button.open{background:#fff;cursor:default}.mine button.flag{background:#fff3d6}.mine button.boom{background:#ffd9d4}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:12px">
      <div class="row" style="gap:18px">
        <div><div class="muted">剩余雷数</div><div class="big" id="left">10</div></div>
        <div><div class="muted">用时</div><div class="big" id="time">0:00</div></div>
      </div>
      <button class="btn btn-main btn-sm" id="restart" type="button">重开</button>
    </div>
    <div class="mine" id="grid"></div>
    <p class="muted" id="msg" style="margin-top:12px">左键翻开，右键插旗。首次点击一定安全。</p>
  </section>
  <section class="card">
    <h2>战绩 <small>保存在本机</small></h2>
    <div class="kv"><span>最快通关</span><b id="best">—</b></div>
    <div class="kv"><span>累计胜利</span><b id="wins">0</b></div>
  </section>`,
    init: `
  var N = 9, MINES = 10;
  var cells, opened, flags, started, over, sec, timer, minesPlaced;
  var stat = AK.store.get('mine.stat', { best: 0, wins: 0 });
  function init() {
    cells = []; opened = 0; flags = 0; started = false; over = false; sec = 0; minesPlaced = false;
    clearInterval(timer); timer = null;
    AK.$('#time').textContent = '0:00';
    AK.$('#left').textContent = MINES;
    AK.$('#msg').textContent = '左键翻开，右键插旗。首次点击一定安全。';
    paintStat();
    var box = AK.$('#grid');
    box.innerHTML = '';
    for (var i = 0; i < N * N; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.i = i;
      cells.push({ mine: false, num: 0, open: false, flag: false });
      b.addEventListener('click', function (e) { reveal(Number(e.currentTarget.dataset.i)); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); toggleFlag(Number(e.currentTarget.dataset.i)); });
      var lp = null;
      b.addEventListener('touchstart', function (e) { lp = setTimeout(function () { toggleFlag(Number(e.currentTarget.dataset.i)); lp = null; }, 420); });
      b.addEventListener('touchend', function () { if (lp) clearTimeout(lp); });
      box.appendChild(b);
    }
  }
  function placeMines(safe) {
    var pool = [];
    for (var i = 0; i < N * N; i++) if (i !== safe) pool.push(i);
    for (var m = 0; m < MINES; m++) {
      var k = Math.floor(Math.random() * pool.length);
      cells[pool[k]].mine = true;
      pool.splice(k, 1);
    }
    for (var i2 = 0; i2 < N * N; i2++) {
      if (cells[i2].mine) continue;
      cells[i2].num = neighbors(i2).filter(function (j) { return cells[j].mine; }).length;
    }
    minesPlaced = true;
  }
  function neighbors(i) {
    var x = Math.floor(i / N), y = i % N, out = [];
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      var nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(nx * N + ny);
    }
    return out;
  }
  function startTimer() {
    if (timer) return;
    timer = setInterval(function () { sec++; AK.$('#time').textContent = AK.hm(sec); }, 1000);
  }
  function reveal(i) {
    if (over) return;
    var c = cells[i];
    if (c.open || c.flag) return;
    if (!minesPlaced) { placeMines(i); started = true; startTimer(); }
    var el = AK.$('#grid').children[i];
    if (c.mine) {
      over = true; clearInterval(timer);
      el.classList.add('open', 'boom'); el.textContent = '💥';
      cells.forEach(function (cc, j) {
        if (cc.mine) { var e2 = AK.$('#grid').children[j]; e2.classList.add('open'); e2.textContent = '💣'; }
      });
      AK.$('#msg').textContent = '踩雷了，按「重开」再来一局';
      return;
    }
    c.open = true; opened++;
    el.classList.add('open');
    el.textContent = c.num ? c.num : '';
    if (c.num) el.style.color = ['', '#2b6cb0', '#2f855a', '#b7791f', '#c05621', '#9b2c2c', '#702459', '#4a5568', '#1a202c'][c.num];
    if (!c.num) neighbors(i).forEach(function (j) { if (!cells[j].open && !cells[j].flag) reveal(j); });
    if (opened === N * N - MINES) winGame();
  }
  function winGame() {
    over = true; clearInterval(timer);
    stat.wins = (stat.wins || 0) + 1;
    if (!stat.best || sec < stat.best) stat.best = sec;
    AK.store.set('mine.stat', stat);
    paintStat();
    AK.$('#msg').textContent = '通关！用时 ' + AK.hm(sec);
    AK.toast('扫雷通关，用时 ' + AK.hm(sec));
  }
  function toggleFlag(i) {
    if (over) return;
    var c = cells[i];
    if (c.open) return;
    c.flag = !c.flag;
    flags += c.flag ? 1 : -1;
    var el = AK.$('#grid').children[i];
    el.classList.toggle('flag', c.flag);
    el.textContent = c.flag ? '🚩' : '';
    AK.$('#left').textContent = MINES - flags;
  }
  function paintStat() {
    AK.$('#best').textContent = stat.best ? AK.hm(stat.best) : '—';
    AK.$('#wins').textContent = stat.wins || 0;
  }
  AK.on('#restart', 'click', init);
  init();`
  },
  {
    name: "反应速度测试",
    slug: "fanying-sudu-ceshi",
    cat: "游戏",
    icon: "⚡",
    tagline: "五轮点击，测出你的反应毫秒数",
    theme: ["#e05252", "#7a1515"],
    bg: "#fdf3f3",
    desc: "屏幕由红变绿的瞬间立刻点击，共五轮，记录每轮反应毫秒并给出平均值。抢跑会被判犯规重来，成绩分档给出评价，是朋友间比拼反应速度的轻量小工具。",
    feats: [
      "五轮测试，逐轮显示毫秒数并计算平均值",
      "抢跑自动判犯规，避免蒙答案",
      "成绩分档评价：职业级 / 优秀 / 常人 / 慢半拍",
      "历史最好成绩保存在本机",
    ],
    css: ".pad{height:240px;border-radius:16px;display:grid;place-items:center;text-align:center;color:#fff;font-size:19px;font-weight:800;cursor:pointer;transition:background .08s;padding:20px;user-select:none;background:#7a1515}",
    body: `
  <section class="card">
    <div class="pad" id="pad">点击开始</div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="reset" type="button">重新测试</button>
      <span class="muted" id="msg">共 5 轮，取平均</span>
    </div>
  </section>
  <section class="card">
    <h2>成绩 <small id="best">最好 —</small></h2>
    <div id="runs" class="muted" style="line-height:2">还没有测试记录</div>
    <div class="kv" style="margin-top:8px"><span>平均反应</span><b id="avg">—</b></div>
    <div class="kv"><span>评价</span><b id="rank">—</b></div>
  </section>`,
    init: `
  var pad = AK.$('#pad'), state = 'idle', t0 = 0, timer, list = [], best = AK.store.get('react.best', 0);
  function paintBest() {
    AK.$('#best').textContent = best ? '最好 ' + best + ' ms' : '最好 —';
  }
  function setPad(text, bg) {
    pad.textContent = text;
    pad.style.background = bg;
  }
  function start() {
    if (state === 'wait') { clearTimeout(timer); state = 'idle'; setPad('抢跑了，点一下重来', '#7a1515'); return; }
    if (state === 'go') { hit(); return; }
    list = [];
    AK.$('#runs').textContent = '第 1 轮准备…';
    AK.$('#avg').textContent = '—';
    AK.$('#rank').textContent = '—';
    round();
  }
  function round() {
    state = 'wait';
    setPad('等待变绿…', '#7a1515');
    AK.$('#runs').textContent = '第 ' + (list.length + 1) + ' / 5 轮';
    timer = setTimeout(function () {
      state = 'go';
      t0 = performance.now();
      setPad('点击！', '#1f9d55');
    }, 900 + Math.random() * 2200);
  }
  function hit() {
    var ms = Math.round(performance.now() - t0);
    state = 'idle';
    list.push(ms);
    setPad(ms + ' ms', '#0f5d33');
    if (!best || ms < best) { best = ms; AK.store.set('react.best', best); paintBest(); }
    AK.$('#runs').innerHTML = list.map(function (v, i) { return '第 ' + (i + 1) + ' 轮：<b>' + v + '</b> ms'; }).join('<br>');
    if (list.length < 5) {
      setTimeout(function () { if (state === 'idle') round(); }, 900);
    } else {
      var avg = Math.round(list.reduce(function (a, b) { return a + b; }, 0) / list.length);
      AK.$('#avg').textContent = avg + ' ms';
      AK.$('#rank').textContent = avg < 180 ? '职业级' : avg < 240 ? '优秀' : avg < 320 ? '常人水平' : '慢半拍';
      setPad('平均 ' + avg + ' ms，点一下再来', '#7a1515');
      AK.toast('平均 ' + avg + ' ms');
    }
  }
  pad.addEventListener('click', function () {
    if (state === 'wait' || state === 'go') { start(); return; }
    start();
  });
  AK.on('#reset', 'click', function () {
    clearTimeout(timer); state = 'idle'; list = [];
    setPad('点击开始', '#7a1515');
    AK.$('#runs').textContent = '还没有测试记录';
    AK.$('#avg').textContent = '—';
    AK.$('#rank').textContent = '—';
  });
  paintBest();`
  },
  {
    name: "打字速度测试",
    slug: "dazi-sudu-ceshi",
    cat: "游戏",
    icon: "⌨️",
    tagline: "三十秒，测出你每分钟打多少字",
    theme: ["#2c7be5", "#123a75"],
    bg: "#f1f6fe",
    desc: "三十秒内照着句子输入，逐字比对实时标出对错，结束时给出每分钟正确字数与准确率。内置中英文混合句子，支持重新开始，成绩保存在本机。",
    feats: [
      "30 秒计时，逐字高亮比对，打错立刻看得见",
      "输出每分钟正确字数（CPM）与准确率",
      "中英文句子随机抽取，长度适中",
      "历史最好成绩保存在本机",
    ],
    css: ".target{font-size:19px;line-height:2;letter-spacing:.5px;background:#f7f9fd;border-radius:12px;padding:14px;word-break:break-word}.target s{text-decoration:none;color:#c0392b;background:#fdeaea}.target em{font-style:normal;color:#1f9d55}.target u{text-decoration:none;background:#eef0f8;border-radius:3px}",
    body: `
  <section class="card">
    <div class="row spread" style="margin-bottom:10px">
      <div><div class="muted">剩余时间</div><div class="big" id="left">30</div></div>
      <div style="text-align:right"><div class="muted">正确字数</div><div class="big" id="ok">0</div></div>
    </div>
    <div class="target" id="target">点「开始」后计时</div>
    <input id="inp" placeholder="在这里照着打…" style="margin-top:12px" disabled>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-main btn-sm" id="start" type="button">开始测试</button>
      <span class="muted" id="msg">30 秒内尽量打对</span>
    </div>
  </section>
  <section class="card">
    <h2>成绩 <small id="best">最好 —</small></h2>
    <div class="kv"><span>速度</span><b id="cpm">—</b></div>
    <div class="kv"><span>准确率</span><b id="acc">—</b></div>
  </section>`,
    init: `
  var SENTS = [
    '今天的代码比昨天更好读一点。',
    '把复杂的问题拆成可以验证的小步骤。',
    '写文档的时间总比修 bug 的时间便宜。',
    '先让程序跑起来，再让它跑得漂亮。',
    '发布之前多看一眼日志和边界条件。',
    '好的工具让人忘记工具本身的存在。',
    '一次只改一件事，出问题也容易回滚。',
    '中文输入法和键盘同样需要练习。'
  ];
  var target = '', started = false, left = 30, timer, okCount = 0, typed = 0;
  var best = AK.store.get('typing.best', 0);
  var inp = AK.$('#inp');
  function pick() { return SENTS[Math.floor(Math.random() * SENTS.length)]; }
  function paintBest() { AK.$('#best').textContent = best ? '最好 ' + best + ' 字/分' : '最好 —'; }
  function render() {
    var v = inp.value;
    var html = '';
    for (var i = 0; i < target.length; i++) {
      var ch = target[i] === ' ' ? '&nbsp;' : AK.esc(target[i]);
      if (i < v.length) {
        html += v[i] === target[i] ? '<em>' + ch + '</em>' : '<s>' + AK.esc(v[i]) + '</s>';
      } else if (i === v.length) {
        html += '<u>' + ch + '</u>';
      } else html += ch;
    }
    AK.$('#target').innerHTML = html;
    var ok = 0;
    for (var j = 0; j < Math.min(v.length, target.length); j++) if (v[j] === target[j]) ok++;
    okCount = ok;
    AK.$('#ok').textContent = ok;
  }
  function start() {
    target = pick();
    started = true; left = 30; okCount = 0; typed = 0;
    inp.disabled = false; inp.value = ''; inp.focus();
    AK.$('#left').textContent = 30;
    AK.$('#ok').textContent = '0';
    AK.$('#cpm').textContent = '—';
    AK.$('#acc').textContent = '—';
    AK.$('#msg').textContent = '开始打吧';
    render();
    clearInterval(timer);
    timer = setInterval(function () {
      left--;
      AK.$('#left').textContent = left;
      if (left <= 0) finish();
    }, 1000);
  }
  function finish() {
    clearInterval(timer);
    started = false;
    inp.disabled = true;
    var cpm = okCount * 2;
    var acc = inp.value.length ? Math.round(okCount / inp.value.length * 100) : 0;
    AK.$('#cpm').textContent = cpm + ' 字/分';
    AK.$('#acc').textContent = acc + '%';
    if (cpm > best) { best = cpm; AK.store.set('typing.best', best); paintBest(); }
    AK.$('#msg').textContent = '时间到，再点「开始测试」换一句';
    AK.toast('正确率 ' + acc + '%，速度 ' + cpm + ' 字/分');
  }
  inp.addEventListener('input', function () {
    if (!started) return;
    typed = inp.value.length;
    render();
    if (typed >= target.length) {
      target = pick();
      inp.value = '';
      render();
    }
  });
  AK.on('#start', 'click', start);
  paintBest();`
  }
];
