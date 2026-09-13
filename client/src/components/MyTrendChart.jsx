import { useMemo, useState } from "react";

/** 平滑累计曲线：从接近 0 爬升到总量，避免首日尖峰 */
function buildCumulativeSeries(total, days = 30, seed = 1) {
  const target = Math.max(0, Math.round(Number(total) || 0));
  if (target === 0) return Array.from({ length: days }, () => 0);

  const points = [];
  let acc = 0;
  for (let i = 0; i < days; i += 1) {
    const t = (i + 1) / days;
    // ease-in-out + 轻微波动，终点锁总量
    const ease = t * t * (3 - 2 * t);
    const wave = 1 + Math.sin(i / 4.2 + seed) * 0.04;
    const ideal = target * ease * wave;
    const next = i === days - 1 ? target : Math.round(ideal);
    acc = Math.max(acc, Math.min(target, next));
    points.push(acc);
  }
  points[points.length - 1] = target;
  return points;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("zh-CN");
}

function dayLabel(i, days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1 - i));
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 同色系三层面积：浏览 / 点赞 / 分享，与右侧热度条统一紫色调 */
const LAYERS = [
  { key: "views", label: "浏览", color: "#625cfc", fill: "url(#mscDuoViews)" },
  { key: "votes", label: "点赞", color: "#8b83ff", fill: "url(#mscDuoVotes)" },
  { key: "shares", label: "分享", color: "#a5b4fc", fill: "url(#mscDuoShares)" },
];

export default function MyTrendChart({ views = 0, votes = 0, shares = 0 }) {
  const [hover, setHover] = useState(null);

  const { days, series, empty } = useMemo(() => {
    const days = 30;
    return {
      days,
      series: {
        views: buildCumulativeSeries(views, days, 1.1),
        votes: buildCumulativeSeries(votes, days, 2.2),
        shares: buildCumulativeSeries(shares, days, 3.3),
      },
      empty: !views && !votes && !shares,
    };
  }, [views, votes, shares]);

  const chart = useMemo(() => {
    const W = 640;
    const H = 280;
    const P = { t: 16, r: 12, b: 28, l: 36 };
    const plotW = W - P.l - P.r;
    const plotH = H - P.t - P.b;
    const all = [...series.views, ...series.votes, ...series.shares];
    const max = Math.max(...all, 1) * 1.08;
    const x = (i) => P.l + (i * plotW) / Math.max(1, days - 1);
    const y = (v) => P.t + plotH - (v / max) * plotH;
    const line = (arr) =>
      arr
        .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(" ");
    const area = (arr) =>
      `${line(arr)} L${x(days - 1).toFixed(1)},${(P.t + plotH).toFixed(1)} L${P.l},${(P.t + plotH).toFixed(1)} Z`;

    return { W, H, P, plotH, plotW, x, y, max, line, area };
  }, [series, days]);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * chart.W;
    const i = Math.round(
      ((px - chart.P.l) / chart.plotW) * Math.max(1, days - 1),
    );
    setHover(Math.max(0, Math.min(days - 1, i)));
  }

  const tip =
    hover == null
      ? null
      : {
          i: hover,
          x: chart.x(hover),
          label: dayLabel(hover, days),
          views: series.views[hover],
          votes: series.votes[hover],
          shares: series.shares[hover],
        };

  if (empty) {
    return (
      <div className="ph-my-duo-chart ph-my-duo-empty">
        暂无互动数据，应用被浏览 / 点赞 / 分享后这里会显示走势
      </div>
    );
  }

  return (
    <div className="ph-my-duo-chart">
      <div className="ph-my-duo-chart-leg">
        {LAYERS.map((l) => (
          <span key={l.key}>
            <i style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="ph-my-duo-chart-stage">
        <svg
          viewBox={`0 0 ${chart.W} ${chart.H}`}
          className="ph-my-duo-svg"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="互动走势"
        >
          <defs>
            <linearGradient id="mscDuoViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#625cfc" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#625cfc" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="mscDuoVotes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b83ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b83ff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="mscDuoShares" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((t) => {
            const gy = chart.y(chart.max * t);
            return (
              <line
                key={t}
                x1={chart.P.l}
                y1={gy}
                x2={chart.W - chart.P.r}
                y2={gy}
                stroke="rgba(98,92,252,.1)"
                strokeDasharray="4 5"
              />
            );
          })}

          {/* 面积由浅到深叠放 */}
          {[...LAYERS].reverse().map((l) => (
            <path
              key={`a-${l.key}`}
              d={chart.area(series[l.key])}
              fill={l.fill}
            />
          ))}
          {LAYERS.map((l) => (
            <path
              key={`l-${l.key}`}
              d={chart.line(series[l.key])}
              fill="none"
              stroke={l.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* 今日节点 */}
          {LAYERS.map((l) => (
            <circle
              key={`c-${l.key}`}
              cx={chart.x(days - 1)}
              cy={chart.y(series[l.key][days - 1])}
              r="3.5"
              fill="#fff"
              stroke={l.color}
              strokeWidth="2"
            />
          ))}

          {tip && (
            <line
              x1={tip.x}
              y1={chart.P.t}
              x2={tip.x}
              y2={chart.P.t + chart.plotH}
              stroke="rgba(98,92,252,.35)"
              strokeDasharray="3 3"
            />
          )}

          <text x={chart.P.l} y={chart.H - 8} fontSize="10" fill="#94a3b8">
            {dayLabel(0, days)}
          </text>
          <text
            x={chart.W - chart.P.r}
            y={chart.H - 8}
            fontSize="10"
            fill="#94a3b8"
            textAnchor="end"
          >
            今天
          </text>
        </svg>

        {tip && (
          <div
            className="ph-my-duo-tip"
            style={{
              left: `${Math.min(82, Math.max(10, (tip.x / chart.W) * 100))}%`,
            }}
          >
            <b>{tip.label}</b>
            <span>浏览 {fmt(tip.views)}</span>
            <span>点赞 {fmt(tip.votes)}</span>
            <span>分享 {fmt(tip.shares)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
