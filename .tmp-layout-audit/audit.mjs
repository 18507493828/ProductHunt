import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
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
const W = 390;
const H = 700;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    `--window-size=${W},${H}`,
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});
const page = await browser.newPage();
await page.setViewport({
  width: W,
  height: H,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const results = {};

for (const slug of APPS) {
  const url = `http://127.0.0.1:3001/apps/${slug}/`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 700));
    const data = await page.evaluate(() => {
      const issues = [];
      const vw = innerWidth;
      const vh = innerHeight;
      const phone = document.querySelector("#phone");
      const scrollable =
        document.documentElement.scrollHeight > vh + 8 ||
        [...document.querySelectorAll("*")].some((el) => {
          const s = getComputedStyle(el);
          return (
            (s.overflowY === "auto" || s.overflowY === "scroll") &&
            el.scrollHeight > el.clientHeight + 20
          );
        });
      const nodes = [
        ...document.querySelectorAll(
          "h1,h2,h3,button,a,.item,.card,.entry,.chip,.seat,.fab,.compose,.bottom-nav,.dock,nav.tabs,.brand,.ctrl,.join-bar,.mine-strip,.list-panel,.dish-name,.dish-sub,.gauge-wrap"
        ),
      ];
      const boxes = nodes
        .map((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return {
            el,
            r,
            s,
            text: (el.innerText || "").slice(0, 40).replace(/\s+/g, " "),
          };
        })
        .filter(
          (x) =>
            x.r.width > 2 &&
            x.r.height > 2 &&
            x.s.visibility !== "hidden" &&
            x.s.display !== "none" &&
            Number(x.s.opacity) !== 0
        );

      function overlaps(a, b) {
        return !(
          a.right <= b.left ||
          b.right <= a.left ||
          a.bottom <= b.top ||
          b.bottom <= a.top
        );
      }
      function inter(a, b) {
        const l = Math.max(a.left, b.left);
        const t = Math.max(a.top, b.top);
        const r = Math.min(a.right, b.right);
        const bot = Math.min(a.bottom, b.bottom);
        return Math.max(0, r - l) * Math.max(0, bot - t);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const A = boxes[i];
          const B = boxes[j];
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          if (!overlaps(A.r, B.r)) continue;
          const ia = inter(A.r, B.r);
          if (ia < 600) continue;
          if (
            A.el.classList.contains("swipe-card") &&
            B.el.classList.contains("swipe-card")
          )
            continue;
          const posA = A.s.position;
          const posB = B.s.position;
          if (
            !["absolute", "fixed"].includes(posA) &&
            !["absolute", "fixed"].includes(posB)
          )
            continue;
          issues.push({
            type: "overlap",
            a: (A.el.className || A.el.tagName).toString().slice(0, 60),
            b: (B.el.className || B.el.tagName).toString().slice(0, 60),
            ta: A.text,
            tb: B.text,
            ia: Math.round(ia),
          });
        }
      }
      const bars = [
        ...document.querySelectorAll(
          ".fab,.compose,.bottom-nav,.dock,nav.tabs,.join-bar,.ctrl.mine"
        ),
      ].map((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          cls: String(el.className).slice(0, 40),
          pos: s.position,
          t: Math.round(r.top),
          b: Math.round(r.bottom),
          h: Math.round(r.height),
        };
      });
      let clipped = false;
      if (phone) {
        const ps = getComputedStyle(phone);
        if (ps.overflow === "hidden" || ps.overflowY === "hidden") {
          clipped = phone.scrollHeight > phone.clientHeight + 24;
        }
      }
      const fab = document.querySelector(".fab");
      const lastItem = document.querySelector(
        ".list-panel .item:last-child, .walk-list .item:last-child, .list .item:last-child"
      );
      let fabCovers = null;
      if (fab && lastItem) {
        const fr = fab.getBoundingClientRect();
        const ir = lastItem.getBoundingClientRect();
        fabCovers = !(
          fr.right <= ir.left ||
          ir.right <= fr.left ||
          fr.bottom <= ir.top ||
          ir.bottom <= fr.top
        );
      }
      // absolute center content overlapped by absolute bottom overlay inside same parent
      const riskyParents = [
        ...document.querySelectorAll(
          ".viewfinder,.radar-wrap,.card-stack,.table,.stage"
        ),
      ];
      const parentIssues = [];
      for (const p of riskyParents) {
        const kids = [...p.children].map((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return { el, r, s, cls: String(el.className).slice(0, 40) };
        });
        for (let i = 0; i < kids.length; i++) {
          for (let j = i + 1; j < kids.length; j++) {
            const A = kids[i];
            const B = kids[j];
            if (!overlaps(A.r, B.r)) continue;
            const ia = inter(A.r, B.r);
            if (ia < 800) continue;
            if (
              !["absolute", "fixed", "relative"].includes(A.s.position) &&
              !["absolute", "fixed", "relative"].includes(B.s.position)
            )
              continue;
            parentIssues.push({
              parent: String(p.className).slice(0, 30),
              a: A.cls,
              b: B.cls,
              ia: Math.round(ia),
            });
          }
        }
      }
      return {
        title: document.title,
        scrollable,
        phoneOverflow: phone ? getComputedStyle(phone).overflow : null,
        clippedByPhone: clipped,
        phoneH: phone
          ? Math.round(phone.getBoundingClientRect().height)
          : null,
        phoneScrollH: phone ? phone.scrollHeight : null,
        docScrollH: document.documentElement.scrollHeight,
        vh,
        vw,
        bars,
        overlaps: issues.slice(0, 10),
        parentIssues: parentIssues.slice(0, 8),
        fabCoversLastItem: fabCovers,
      };
    });
    results[slug] = data;
    const flags = [];
    if (data.clippedByPhone) flags.push("CLIPPED");
    if (data.fabCoversLastItem) flags.push("FAB_COVER");
    if (data.overlaps?.length) flags.push("OVERLAP(" + data.overlaps.length + ")");
    if (data.parentIssues?.length)
      flags.push("STACK(" + data.parentIssues.length + ")");
    if (!data.scrollable && data.docScrollH > data.vh + 40) flags.push("NOSCROLL");
    console.log(
      slug.padEnd(18),
      flags.join(" ") || "ok",
      `doc=${data.docScrollH}`,
      `phone=${data.phoneScrollH}/${data.phoneH}`
    );
  } catch (e) {
    results[slug] = { error: String(e) };
    console.log(slug.padEnd(18), "ERROR", e.message);
  }
}
await browser.close();
fs.writeFileSync(
  new URL("./results.json", import.meta.url),
  JSON.stringify(results, null, 2)
);
console.log("done");
