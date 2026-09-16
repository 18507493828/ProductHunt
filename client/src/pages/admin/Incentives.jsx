import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminIncentiveConfig,
  updateAdminIncentiveConfig,
} from "../../api";

const TYPE_OPTIONS = [
  { value: "cash", label: "现金" },
  { value: "point", label: "积分" },
  { value: "mixed", label: "现金 + 积分" },
];

const emptyForm = {
  type: "mixed",
  weekTop1: 100,
  weekTop2: 50,
  weekTop3: 30,
  weekTop4to10: 10,
  monthTop1: 300,
  monthTop2: 150,
  monthTop3: 80,
  monthTop4to10: 20,
  quarterTop1: 1000,
  quarterTop2: 500,
  quarterTop3: 200,
  quarterTop4to10: 50,
  maodao: 9.9,
  pool: 50000,
  paid: 0,
  heroCopy:
    "本期激励：冲周榜最高可得 ¥{weekTop1}，月榜 ¥{monthTop1}，季榜 ¥{quarterTop1}；选用华为码道构建并成功发布，还可再领 ¥{maodao} 活动激励。",
};

const PERIODS = [
  {
    key: "week",
    title: "周榜",
    subtitle: "每周结算 · Top10",
    tone: "week",
    fields: [
      ["weekTop1", "Top1", "gold"],
      ["weekTop2", "Top2", "silver"],
      ["weekTop3", "Top3", "bronze"],
      ["weekTop4to10", "Top4–10", "rest"],
    ],
  },
  {
    key: "month",
    title: "月榜",
    subtitle: "每月结算 · Top10",
    tone: "month",
    fields: [
      ["monthTop1", "Top1", "gold"],
      ["monthTop2", "Top2", "silver"],
      ["monthTop3", "Top3", "bronze"],
      ["monthTop4to10", "Top4–10", "rest"],
    ],
  },
  {
    key: "quarter",
    title: "季榜",
    subtitle: "每季结算 · Top10",
    tone: "quarter",
    fields: [
      ["quarterTop1", "Top1", "gold"],
      ["quarterTop2", "Top2", "silver"],
      ["quarterTop3", "Top3", "bronze"],
      ["quarterTop4to10", "Top4–10", "rest"],
    ],
  },
];

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : String(v);
}

function renderHeroPreview(form) {
  const tpl = String(form.heroCopy || "").trim();
  if (!tpl) return "（尚未填写首页激励文案）";
  return tpl.replace(/\{(\w+)\}/g, (m, key) =>
    key in form && form[key] !== "" && form[key] != null
      ? money(form[key])
      : m,
  );
}

export default function Incentives() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminIncentiveConfig();
      setForm({ ...emptyForm, ...(data || {}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  }

  const heroPreview = useMemo(() => renderHeroPreview(form), [form]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await updateAdminIncentiveConfig(form);
      setForm({ ...emptyForm, ...(result.config || form) });
      setMessage(result.message || "激励配置已保存并生效");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inc-page">
      <header className="inc-page-head">
        <div>
          <h2 className="inc-page-title">激励配置</h2>
          <p className="inc-page-desc">
            管理周 / 月 / 季榜奖金、码道激励与首页文案，保存后前台即时生效。
          </p>
        </div>
        <button
          type="submit"
          form="inc-config-form"
          className="ph-btn-primary"
          disabled={saving || loading}
        >
          {saving ? "保存中..." : "保存并生效"}
        </button>
      </header>

      {error && <div className="error">{error}</div>}
      {message && <div className="admin-success">{message}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : (
        <form
          id="inc-config-form"
          className="inc-form"
          onSubmit={handleSave}
        >
          <section className="inc-card">
            <div className="inc-card-head">
              <div>
                <h3>首页激励文案</h3>
                <p>展示在首页标题下方的红色提示条</p>
              </div>
              <label className="inc-type">
                <span>激励类型</span>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              className="inc-hero-input"
              rows={3}
              maxLength={500}
              value={form.heroCopy || ""}
              onChange={(e) => update("heroCopy", e.target.value)}
              placeholder="本期激励：冲周榜最高可得 ¥{weekTop1}..."
            />
            <p className="inc-hero-hint">
              可用占位符：
              <code>{"{weekTop1}"}</code>
              <code>{"{monthTop1}"}</code>
              <code>{"{quarterTop1}"}</code>
              <code>{"{maodao}"}</code>
            </p>
            <div className="inc-hero-preview" aria-label="首页预览">
              <span className="inc-hero-preview-label">预览</span>
              <p>{heroPreview}</p>
            </div>
          </section>

          <section className="inc-period-grid">
            {PERIODS.map((period) => (
              <article
                key={period.key}
                className={`inc-period-card tone-${period.tone}`}
              >
                <header className="inc-period-head">
                  <h3>{period.title}</h3>
                  <span>{period.subtitle}</span>
                </header>
                <div className="inc-period-fields">
                  {period.fields.map(([key, label, rank]) => (
                    <label key={key} className={`inc-amount tone-${rank}`}>
                      <span className="inc-amount-label">
                        <i aria-hidden="true" />
                        {label}
                        {rank === "rest" ? "（每名）" : ""}
                      </span>
                      <span className="inc-amount-input">
                        <em>¥</em>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="inc-card">
            <div className="inc-card-head">
              <div>
                <h3>活动与池子</h3>
                <p>码道单次激励与激励池统计</p>
              </div>
            </div>
            <div className="inc-extra-grid">
              {[
                ["maodao", "华为码道单次", "选用码道构建并发布可领"],
                ["pool", "激励池总额", "活动总预算参考"],
                ["paid", "已发放金额", "已兑付累计"],
              ].map(([key, label, tip]) => (
                <label key={key} className="inc-extra-field">
                  <span className="inc-extra-label">{label}</span>
                  <span className="inc-extra-tip">{tip}</span>
                  <span className="inc-amount-input">
                    <em>¥</em>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="inc-form-foot">
            <button
              type="submit"
              className="ph-btn-primary"
              disabled={saving}
            >
              {saving ? "保存中..." : "保存配置并生效"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
