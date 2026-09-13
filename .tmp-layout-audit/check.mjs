/**
 * Layout check via system Chrome + CDP (no npm install).
 * Usage: node .tmp-layout-audit/check.mjs
 */
import { spawn } from "child_process";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9229;
const W = 390;
const H = 844;
const APPS = [
  "fandazi",
  "zhaoling-radar",
  "landa",
  "liuchong",
  "bensha",
  "sijiao-pinda",
  "zhiyuan-shichang",
  "shitang-pintuan",
  "reliang",
  "shushi-radar",
  "jiuwu-juanzeng",
  "liulang-zhuyang",
  "paoxian",
  "tubo",
  "luying-zhuangbei",
  "qixing",
];

const PROFILE = path.join(__dirname, "chrome-profile");
fs.mkdirSync(PROFILE, { recursive: true });
fs.mkdirSync(path.join(__dirname, "shots"), { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function waitPort(ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      await getJSON(`http://127.0.0.1:${PORT}/json/version`);
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome CDP not ready");
}

async function cdp(wsUrl, method, params = {}) {
  const { default: WebSocket } = await import("ws").catch(() => ({ default: null }));
  if (!WebSocket) {
    // Minimal WS via undici not available — use chrome-remote-interface pattern with raw ws from node 22?
    throw new Error("ws package missing");
  }
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.on("open", () => {
      id += 1;
      const msg = { id, method, params };
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify(msg));
    });
    ws.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
        ws.close();
      }
    });
    ws.on("error", reject);
  });
}

// Prefer node built-in if available; else use chrome DevTools HTTP /json/new + evaluate via Runtime through a tiny CDP client without ws pkg
async function cdpSession(wsUrl) {
  // Dynamic import of 'ws' may fail — implement with undici WebSocket if Node >= 22
  const WS = globalThis.WebSocket;
  if (!WS) throw new Error("No WebSocket in this Node runtime");

  const ws = new WS(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  async function send(method, params = {}) {
    const id = ++nextId;
    const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ id, method, params }));
    return p;
  }
  return {
    send,
    close: () => ws.close(),
  };
}

const EVAL = `(() => {
  const issues = [];
  const vh = innerHeight, vw = innerWidth;
  const root =
    document.querySelector("#phone") ||
    document.querySelector("#app") ||
    document.querySelector(".app") ||
    document.querySelector("#workspace") ||
    document.body;

  function box(el) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      el, r, s,
      cls: String(el.className || el.id || el.tagName).slice(0, 50),
      text: (el.innerText || "").replace(/\\s+/g, " ").slice(0, 36),
    };
  }
  function overlaps(a, b) {
    return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  }
  function inter(a, b) {
    const l = Math.max(a.left, b.left), t = Math.max(a.top, b.top);
    const r = Math.min(a.right, b.right), bot = Math.min(a.bottom, b.bottom);
    return Math.max(0, r - l) * Math.max(0, bot - t);
  }

  // text nodes / labels covered by absolute siblings in risky parents
  const parents = [...document.querySelectorAll(
    ".viewfinder,.radar-wrap,.card-stack,.table,.stage,.hero,.poster,.court-card,.map-box,#map"
  )];
  for (const p of parents) {
    const kids = [...p.children].map(box).filter(x => x.r.width > 4 && x.r.height > 4 && x.s.display !== "none" && Number(x.s.opacity) !== 0);
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const A = kids[i], B = kids[j];
        if (!overlaps(A.r, B.r)) continue;
        const ia = inter(A.r, B.r);
        if (ia < 900) continue;
        const abs =
          ["absolute","fixed"].includes(A.s.position) ||
          ["absolute","fixed"].includes(B.s.position);
        if (!abs) continue;
        // ignore decorative layers
        const deco = /grid|corner|cam-feed|scan|ring|glow|bg|cloud|decor|sweep/i;
        if (deco.test(A.cls) && deco.test(B.cls)) continue;
        issues.push({
          type: "stack-overlap",
          parent: String(p.className || p.id).slice(0, 40),
          a: A.cls, b: B.cls, ta: A.text, tb: B.text, ia: Math.round(ia)
        });
      }
    }
  }

  // fixed/absolute bottom bars covering interactive content
  const bars = [...document.querySelectorAll(
    ".fab,.bottom-nav,.dock,.join-bar,.compose,.ctrl.mine,.sheet-handle"
  )].map(box);
  const content = [...document.querySelectorAll(
    "button,a,.item,.card,.chip,.hist-row,.entry,.row,.seat"
  )].map(box).filter(x => x.r.width > 8 && x.r.height > 8);
  for (const bar of bars) {
    if (!["absolute","fixed"].includes(bar.s.position)) continue;
    for (const c of content) {
      if (bar.el.contains(c.el) || c.el.contains(bar.el)) continue;
      if (!overlaps(bar.r, c.r)) continue;
      const ia = inter(bar.r, c.r);
      if (ia < 400) continue;
      issues.push({
        type: "bar-cover",
        a: bar.cls, b: c.cls, tb: c.text, ia: Math.round(ia)
      });
    }
  }

  // overflow hidden clipping on phone shell
  let clipped = false;
  if (root && root !== document.body) {
    const s = getComputedStyle(root);
    if (/(hidden|clip)/.test(s.overflow + s.overflowY)) {
      clipped = root.scrollHeight > root.clientHeight + 28;
    }
  }

  // elements with text but zero visible area / offscreen
  const off = [];
  for (const el of document.querySelectorAll("h1,h2,.dish-name,.title,.brand,button.log-btn,.rc-kcal")) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) {
      off.push({ cls: String(el.className||el.tagName).slice(0,40), text:(el.innerText||"").slice(0,30) });
    }
  }

  return {
    title: document.title,
    vw, vh,
    docH: document.documentElement.scrollHeight,
    rootTag: root?.id || root?.className || "body",
    rootH: root ? Math.round(root.getBoundingClientRect().height) : null,
    rootScrollH: root ? root.scrollHeight : null,
    clipped,
    issues: issues.slice(0, 12),
    off: off.slice(0, 6),
  };
})()`;

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error("Chrome not found");
    process.exit(1);
  }
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      `--window-size=${W},${H}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  try {
    await waitPort();
    const version = await getJSON(`http://127.0.0.1:${PORT}/json/version`);
    const browserWs = version.webSocketDebuggerUrl;
    const browser = await cdpSession(browserWs);

    const results = {};
    for (const slug of APPS) {
      const url = `http://127.0.0.1:3001/apps/${slug}/`;
      try {
        // open target
        const created = await getJSON(
          `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`
        ).catch(async () => {
          // fallback PUT
          return await new Promise((resolve, reject) => {
            const req = http.request(
              {
                hostname: "127.0.0.1",
                port: PORT,
                path: "/json/new?" + encodeURIComponent(url),
                method: "PUT",
              },
              (res) => {
                let d = "";
                res.on("data", (c) => (d += c));
                res.on("end", () => {
                  try {
                    resolve(JSON.parse(d));
                  } catch (e) {
                    reject(e);
                  }
                });
              }
            );
            req.on("error", reject);
            req.end();
          });
        });
        await sleep(900);
        const targets = await getJSON(`http://127.0.0.1:${PORT}/json/list`);
        const target =
          targets.find((t) => t.url && t.url.includes(`/apps/${slug}`)) ||
          created;
        if (!target?.webSocketDebuggerUrl) {
          results[slug] = { error: "no target ws" };
          console.log(slug.padEnd(18), "NO_TARGET");
          continue;
        }
        const page = await cdpSession(target.webSocketDebuggerUrl);
        await page.send("Emulation.setDeviceMetricsOverride", {
          width: W,
          height: H,
          deviceScaleFactor: 2,
          mobile: true,
        });
        await page.send("Page.enable");
        await page.send("Runtime.enable");
        // navigate again to be sure
        await page.send("Page.navigate", { url });
        await sleep(1200);
        const ev = await page.send("Runtime.evaluate", {
          expression: EVAL,
          returnByValue: true,
          awaitPromise: true,
        });
        const data = ev.result?.value || { error: ev };
        results[slug] = data;
        const flags = [];
        if (data.clipped) flags.push("CLIPPED");
        if (data.issues?.length) flags.push("ISSUE(" + data.issues.length + ")");
        if (data.off?.length) flags.push("OFF(" + data.off.length + ")");
        console.log(
          slug.padEnd(18),
          flags.join(" ") || "ok",
          `doc=${data.docH}`,
          data.issues?.[0]
            ? `${data.issues[0].type}:${data.issues[0].a}|${data.issues[0].b}`
            : ""
        );
        // screenshot
        try {
          const shot = await page.send("Page.captureScreenshot", {
            format: "png",
          });
          fs.writeFileSync(
            path.join(__dirname, "shots", `${slug}.png`),
            Buffer.from(shot.data, "base64")
          );
        } catch {}
        page.close();
      } catch (e) {
        results[slug] = { error: String(e) };
        console.log(slug.padEnd(18), "ERROR", e.message);
      }
    }
    browser.close();
    fs.writeFileSync(
      path.join(__dirname, "results.json"),
      JSON.stringify(results, null, 2)
    );
    console.log("wrote results.json");
  } finally {
    chrome.kill("SIGKILL");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
