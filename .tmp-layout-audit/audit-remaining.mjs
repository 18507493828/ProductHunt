import puppeteer from "puppeteer-core";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APPS = [
  "sijiao-pinda",
  "shitang-pintuan",
  "shushi-radar",
  "jiuwu-juanzeng",
  "liulang-zhuyang",
  "paoxian",
  "tubo",
  "luying-zhuangbei",
  "qixing",
  "zhaoling-radar",
];
const W = 390;
const H = 700;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [`--window-size=${W},${H}`, "--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({
  width: W,
  height: H,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

for (const slug of APPS) {
  const url = `http://127.0.0.1:3001/apps/${slug}/`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 800));
    const data = await page.evaluate(() => {
      const issues = [];
      const vh = innerHeight;
      const vw = innerWidth;
      const phone =
        document.querySelector("#phone") ||
        document.querySelector("#app") ||
        document.querySelector(".app") ||
        document.querySelector("#workspace");
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
          "h1,h2,h3,button,a,.item,.card,.entry,.chip,.seat,.fab,.compose,.bottom-nav,.dock,nav.tabs,.brand,.ctrl,.join-bar,.mine-strip,.list-panel,.btn,.group-card,.poster,.route,.station,.crate,.pet,.book-card,.book-tile,.hero,.tab-bar,.nav-bar,.cta,.action-row,.drawer-actions,.map-wrap,.map-box"
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
      const overlapIssues = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const A = boxes[i];
          const B = boxes[j];
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          if (!overlaps(A.r, B.r)) continue;
          const ia = inter(A.r, B.r);
          if (ia < 600) continue;
          if (
            !["absolute", "fixed"].includes(A.s.position) &&
            !["absolute", "fixed"].includes(B.s.position)
          )
            continue;
          overlapIssues.push({
            type: "overlap",
            a: (A.el.className || A.el.tagName).toString().slice(0, 60),
            b: (B.el.className || B.el.tagName).toString().slice(0, 60),
            ta: A.text,
            tb: B.text,
            ia: Math.round(ia),
          });
        }
      }
      let clipped = false;
      if (phone) {
        const ps = getComputedStyle(phone);
        if (ps.overflow === "hidden" || ps.overflowY === "hidden") {
          clipped = phone.scrollHeight > phone.clientHeight + 24;
        }
      }
      const hiddenBtns = boxes
        .filter(
          (x) =>
            x.el.tagName === "BUTTON" &&
            (x.r.bottom > vh + 1 ||
              x.r.top < -2 ||
              x.r.width < 24 ||
              x.r.height < 24)
        )
        .map((x) => ({
          cls: String(x.el.className).slice(0, 50),
          t: Math.round(x.r.top),
          b: Math.round(x.r.bottom),
          w: Math.round(x.r.width),
          h: Math.round(x.r.height),
          text: x.text,
        }));
      const radar = document.querySelector(".radar-wrap");
      let radarInfo = null;
      if (radar) {
        const r = radar.getBoundingClientRect();
        const cs = getComputedStyle(radar);
        radarInfo = {
          w: Math.round(r.width),
          h: Math.round(r.height),
          bottom: Math.round(r.bottom),
          maxH: cs.maxHeight,
          width: cs.width,
          aspectRatio: cs.aspectRatio,
          overflowBottom: r.bottom > vh,
          square: Math.abs(r.width - r.height) < 3,
        };
      }
      const bottomBars = [
        ...document.querySelectorAll(
          ".fab,.compose,.bottom-nav,.dock,nav.tabs,.join-bar,.ctrl.mine,.tab-bar"
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
          offscreen: r.bottom > vh || r.top < 0,
        };
      });
      return {
        title: document.title,
        scrollable,
        phoneOverflow: phone ? getComputedStyle(phone).overflow : null,
        clippedByPhone: clipped,
        phoneH: phone ? Math.round(phone.getBoundingClientRect().height) : null,
        phoneScrollH: phone ? phone.scrollHeight : null,
        docScrollH: document.documentElement.scrollHeight,
        vh,
        vw,
        overlaps: overlapIssues.slice(0, 10),
        hiddenBtns: hiddenBtns.slice(0, 8),
        radarInfo,
        bottomBars,
      };
    });
    const flags = [];
    if (data.clippedByPhone) flags.push("CLIPPED");
    if (data.hiddenBtns?.length) flags.push("HIDDEN_BTN(" + data.hiddenBtns.length + ")");
    if (data.overlaps?.length) flags.push("OVERLAP(" + data.overlaps.length + ")");
    if (!data.scrollable && data.docScrollH > data.vh + 40) flags.push("NOSCROLL");
    if (data.radarInfo && !data.radarInfo.square) flags.push("RADAR_NOT_SQUARE");
    console.log(JSON.stringify({ slug, flags, ...data }, null, 0));
  } catch (e) {
    console.log(JSON.stringify({ slug, error: String(e) }));
  }
}
await browser.close();
