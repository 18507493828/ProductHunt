/**
 * 码上创 vibe building · 小应用真实定位 / 天气 / 地图 / 距离工具
 * 无 UI；Geolocation + Open-Meteo（免 key）+ Leaflet/高德瓦片
 */
(function (global) {
  const FALLBACK = {
    lat: 30.2741,
    lng: 120.1551,
    label: "杭州西湖附近",
  };

  const WMO = {
    0: "晴朗",
    1: "大致晴朗",
    2: "局部多云",
    3: "阴天",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "浓毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "强阵雨",
    82: "暴雨",
    95: "雷阵雨",
    96: "雷阵雨伴冰雹",
    99: "强雷暴冰雹",
  };

  const LEAFLET_CSS =
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS =
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  let leafletPromise = null;

  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  function haversine(a, b) {
    if (!a || !b) return NaN;
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function formatDist(m) {
    if (m == null || !Number.isFinite(m)) return "—";
    if (m < 1000) return Math.round(m) + "m";
    return (m / 1000).toFixed(m < 10000 ? 1 : 0) + "km";
  }

  function offsetLatLng(lat, lng, northM, eastM) {
    const dLat = northM / 111320;
    const dLng = eastM / (111320 * Math.cos(toRad(lat)));
    return { lat: lat + dLat, lng: lng + dLng };
  }

  function bearing(from, to) {
    const φ1 = toRad(from.lat);
    const φ2 = toRad(to.lat);
    const Δλ = toRad(to.lng - from.lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  function scenarioFromWeather(temp, code, precip, wind) {
    if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code) || precip >= 50)
      return "rain";
    if (temp >= 30 || [0, 1].includes(code)) return temp >= 30 ? "hot" : "clear";
    if (temp <= 16 || wind >= 25) return "cool";
    if ([0, 1, 2].includes(code)) return "clear";
    return "cool";
  }

  function locate(options) {
    const opts = Object.assign(
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
      options || {}
    );
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          ok: false,
          pos: { lat: FALLBACK.lat, lng: FALLBACK.lng },
          error: "unsupported",
          fallback: true,
        });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            ok: true,
            pos: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
            fallback: false,
          });
        },
        (err) => {
          resolve({
            ok: false,
            pos: { lat: FALLBACK.lat, lng: FALLBACK.lng },
            error: err && err.code === 1 ? "denied" : "failed",
            fallback: true,
          });
        },
        opts
      );
    });
  }

  function watch(onUpdate, options) {
    if (!navigator.geolocation) return null;
    const opts = Object.assign(
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      options || {}
    );
    return navigator.geolocation.watchPosition(
      (pos) => {
        onUpdate({
          ok: true,
          pos: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            ts: pos.timestamp,
          },
        });
      },
      () => {},
      opts
    );
  }

  async function fetchWeather(lat, lng) {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(lat) +
      "&longitude=" +
      encodeURIComponent(lng) +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index" +
      "&daily=temperature_2m_min,precipitation_probability_max,uv_index_max" +
      "&timezone=auto&forecast_days=1";
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather http " + res.status);
    const data = await res.json();
    const cur = data.current || {};
    const daily = data.daily || {};
    const code = cur.weather_code;
    const temp = Math.round(cur.temperature_2m);
    const low = Math.round(
      (daily.temperature_2m_min && daily.temperature_2m_min[0]) ?? temp - 4
    );
    const wind = Math.round(cur.wind_speed_10m || 0);
    const rainProb =
      (daily.precipitation_probability_max &&
        daily.precipitation_probability_max[0]) ??
      (cur.precipitation > 0 ? 60 : 10);
    const uv = Math.round(
      cur.uv_index != null
        ? cur.uv_index
        : (daily.uv_index_max && daily.uv_index_max[0]) || 0
    );
    const label = WMO[code] || "多云";
    const feel = Math.round(cur.apparent_temperature ?? temp);
    const scenario = scenarioFromWeather(temp, code, rainProb, wind);
    return {
      temp,
      feel,
      low,
      humidity: Math.round(cur.relative_humidity_2m || 0),
      wind: wind + " km/h",
      windKmh: wind,
      rain: rainProb + "%",
      rainProb,
      uv: String(uv),
      uvNum: uv,
      code,
      desc: label + " · 体感 " + feel + "°",
      scenario,
      raw: data,
    };
  }

  /** Open-Meteo 海拔剖面（免 key） */
  async function fetchElevations(points) {
    if (!points || !points.length) return [];
    const sample = points.slice(0, 40);
    const lats = sample.map((p) => p.lat).join(",");
    const lngs = sample.map((p) => p.lng).join(",");
    const url =
      "https://api.open-meteo.com/v1/elevation?latitude=" +
      encodeURIComponent(lats) +
      "&longitude=" +
      encodeURIComponent(lngs);
    const res = await fetch(url);
    if (!res.ok) throw new Error("elevation http " + res.status);
    const data = await res.json();
    const elev = data.elevation || [];
    return elev.map(function (e) {
      return Math.round(e);
    });
  }

  function openNav(target) {
    if (!target || target.lat == null) return;
    const name = encodeURIComponent(target.name || "目的地");
    const amap =
      "https://uri.amap.com/marker?position=" +
      target.lng +
      "," +
      target.lat +
      "&name=" +
      name +
      "&src=mashangchuang&callnative=1";
    const apple =
      "https://maps.apple.com/?daddr=" +
      target.lat +
      "," +
      target.lng +
      "&q=" +
      name;
    const isApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent || "");
    window.open(isApple ? apple : amap, "_blank", "noopener");
  }

  /** 在中心点附近按米偏移生成演示 POI，距离按真实 haversine */
  function placeNear(center, defs) {
    const origin = center || FALLBACK;
    return (defs || []).map(function (d) {
      const pos = offsetLatLng(
        origin.lat,
        origin.lng,
        d.dNorth || 0,
        d.dEast || 0
      );
      const meters = haversine(origin, pos);
      return Object.assign({}, d, {
        lat: pos.lat,
        lng: pos.lng,
        meters: meters,
        dist: formatDist(meters),
      });
    });
  }

  /** 相对日历：本周六 / 下周日 / 今天 / 明天 / 今晚 → 真实日期文案 */
  function resolveSchedule(label) {
    if (!label) return label;
    let s = String(label).trim();
    // 今晚 → 今天 + 时间
    s = s.replace(/^今晚\s*/, "今天 ");
    // 裸「周六中午」→「本周六 中午」
    if (/^周[一二三四五六日天]/.test(s) && !/^(本|下)/.test(s)) {
      s = "本" + s;
    }
    const rel = s.match(/^(今天|明天)\s*(.*)$/);
    if (rel) {
      const d = new Date();
      if (rel[1] === "明天") d.setDate(d.getDate() + 1);
      const rest = (rel[2] || "").trim();
      return formatDay(d) + (rest ? " " + rest : "");
    }
    const weekMap = {
      周一: 1,
      周二: 2,
      周三: 3,
      周四: 4,
      周五: 5,
      周六: 6,
      周日: 0,
      周天: 0,
    };
    const wm = s.match(/^(本|下|下下)?(周[一二三四五六日天])\s*(.*)$/);
    if (!wm) return label;
    const weeks = wm[1] === "下下" ? 2 : wm[1] === "下" ? 1 : 0;
    const targetDow = weekMap[wm[2]];
    if (targetDow == null) return label;
    const d = computeWeekday(targetDow, weeks);
    const rest = (wm[3] || "").trim();
    return formatDay(d) + (rest ? " " + rest : "");
  }

  function computeWeekday(dow, weeksAhead) {
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    const thisDelta = (dow - base.getDay() + 7) % 7;
    const d = new Date(base);
    d.setDate(base.getDate() + thisDelta + (weeksAhead || 0) * 7);
    return d;
  }

  function formatDay(d) {
    const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return d.getMonth() + 1 + "月" + d.getDate() + "日周" + w;
  }

  function loadLeaflet() {
    if (global.L) return Promise.resolve(global.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[data-msc-leaflet]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        link.setAttribute("data-msc-leaflet", "1");
        document.head.appendChild(link);
      }
      const s = document.createElement("script");
      s.src = LEAFLET_JS;
      s.async = true;
      s.onload = function () {
        resolve(global.L);
      };
      s.onerror = function () {
        leafletPromise = null;
        reject(new Error("leaflet load failed"));
      };
      document.head.appendChild(s);
    });
    return leafletPromise;
  }

  function addAmapTiles(map) {
    return global.L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      {
        maxZoom: 18,
        subdomains: ["1", "2", "3", "4"],
        attribution: "&copy; 高德地图",
      }
    ).addTo(map);
  }

  /**
   * 创建真实底图。el 为元素或 id。
   * 返回 { map, L, setView, invalidate }
   */
  function createMap(el, center, zoom) {
    return loadLeaflet().then(function (L) {
      const node = typeof el === "string" ? document.getElementById(el) : el;
      if (!node) throw new Error("map el missing");
      if (node._mscMap) {
        const c = center || FALLBACK;
        node._mscMap.setView([c.lat, c.lng], zoom || 14);
        setTimeout(function () {
          node._mscMap.invalidateSize();
        }, 80);
        return { map: node._mscMap, L: L, reused: true };
      }
      const c = center || FALLBACK;
      const map = L.map(node, {
        zoomControl: true,
        attributionControl: true,
      }).setView([c.lat, c.lng], zoom || 14);
      addAmapTiles(map);
      node._mscMap = map;
      setTimeout(function () {
        map.invalidateSize();
      }, 80);
      return { map: map, L: L, reused: false };
    });
  }

  /**
   * 在起点附近生成约 km 公里的环线坐标（演示路线几何，落在真实地图上）
   */
  function buildLoopRoute(start, km, seed) {
    const origin = start || FALLBACK;
    const n = Math.max(16, Math.round(km * 5));
    const radiusM = (km * 1000) / (2 * Math.PI);
    const rot = ((seed || 1) * 37) % 360;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      const wobble = 1 + 0.12 * Math.sin(t * 3 + seed);
      const ang = ((rot * Math.PI) / 180) + t;
      const north = Math.cos(ang) * radiusM * wobble;
      const east = Math.sin(ang) * radiusM * wobble * 0.85;
      pts.push(offsetLatLng(origin.lat, origin.lng, north, east));
    }
    return pts;
  }

  function pathLength(pts) {
    let sum = 0;
    for (let i = 1; i < pts.length; i++) sum += haversine(pts[i - 1], pts[i]);
    return sum;
  }

  const geocodeCache = Object.create(null);

  function geoCacheKey(lat, lng) {
    return Number(lat).toFixed(4) + "," + Number(lng).toFixed(4);
  }

  function uniqJoin(parts) {
    const out = [];
    parts.forEach(function (p) {
      if (!p) return;
      const s = String(p).trim();
      if (!s) return;
      if (out.some(function (x) {
        return x === s || x.indexOf(s) >= 0 || s.indexOf(x) >= 0;
      }))
        return;
      out.push(s);
    });
    return out.join("");
  }

  async function reverseFromBigData(lat, lng) {
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
      encodeURIComponent(lat) +
      "&longitude=" +
      encodeURIComponent(lng) +
      "&localityLanguage=zh";
    const res = await fetch(url);
    if (!res.ok) throw new Error("bdc " + res.status);
    const data = await res.json();
    const admin = (data.localityInfo && data.localityInfo.administrative) || [];
    const byOrder = {};
    admin.forEach(function (a) {
      if (a && a.name && a.adminLevel != null) byOrder[a.adminLevel] = a.name;
    });
    // adminLevel: 4省 5市 6区/县 8街道
    const label = uniqJoin([
      byOrder[4] || data.principalSubdivision,
      byOrder[5] || data.city,
      byOrder[6],
      byOrder[8] || data.locality,
      data.locality !== data.city ? data.locality : "",
    ]);
    const short =
      byOrder[6] ||
      byOrder[8] ||
      data.locality ||
      data.city ||
      data.principalSubdivision ||
      label ||
      "附近";
    return {
      label: label || short,
      short: short,
      city: data.city || byOrder[5] || "",
      district: byOrder[6] || "",
      street: byOrder[8] || data.locality || "",
      source: "bigdatacloud",
      raw: data,
    };
  }

  async function reverseFromNominatim(lat, lng) {
    const url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
      encodeURIComponent(lat) +
      "&lon=" +
      encodeURIComponent(lng) +
      "&accept-language=zh-CN&zoom=18&addressdetails=1";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("nominatim " + res.status);
    const data = await res.json();
    const a = data.address || {};
    const label = uniqJoin([
      a.state,
      a.city || a.town || a.municipality,
      a.district || a.county || a.suburb,
      a.neighbourhood || a.road,
    ]);
    const short =
      a.suburb ||
      a.neighbourhood ||
      a.road ||
      a.district ||
      a.city ||
      a.town ||
      label ||
      "附近";
    return {
      label: label || data.display_name || short,
      short: short,
      city: a.city || a.town || "",
      district: a.district || a.county || "",
      street: a.road || a.neighbourhood || "",
      source: "nominatim",
      raw: data,
    };
  }

  /** 逆地理：经纬度 → 中文地名（缓存，免 key） */
  async function reverseGeocode(lat, lng) {
    if (lat == null || lng == null || !Number.isFinite(+lat) || !Number.isFinite(+lng)) {
      return { label: "未知位置", short: "未知位置", source: "none" };
    }
    const key = geoCacheKey(lat, lng);
    if (geocodeCache[key]) return geocodeCache[key];
    let result = null;
    try {
      result = await reverseFromBigData(lat, lng);
    } catch (e1) {
      try {
        result = await reverseFromNominatim(lat, lng);
      } catch (e2) {
        result = {
          label: "当前位置附近",
          short: "当前位置附近",
          source: "fallback",
        };
      }
    }
    if (!result.label) result.label = result.short || "当前位置附近";
    if (!result.short) result.short = result.label;
    geocodeCache[key] = result;
    return result;
  }

  /** 定位 + 中文地名 */
  async function locateWithPlace(options) {
    const loc = await locate(options);
    const place = await reverseGeocode(loc.pos.lat, loc.pos.lng);
    return Object.assign({}, loc, {
      place: place,
      placeLabel: place.label,
      placeShort: place.short,
    });
  }

  global.MashangChuangGeo = {
    FALLBACK: FALLBACK,
    locate: locate,
    locateWithPlace: locateWithPlace,
    reverseGeocode: reverseGeocode,
    watch: watch,
    fetchWeather: fetchWeather,
    fetchElevations: fetchElevations,
    haversine: haversine,
    formatDist: formatDist,
    offsetLatLng: offsetLatLng,
    bearing: bearing,
    openNav: openNav,
    placeNear: placeNear,
    resolveSchedule: resolveSchedule,
    formatDay: formatDay,
    loadLeaflet: loadLeaflet,
    createMap: createMap,
    buildLoopRoute: buildLoopRoute,
    pathLength: pathLength,
    WMO: WMO,
  };
})(typeof window !== "undefined" ? window : globalThis);
