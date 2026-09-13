import { useEffect, useState } from "react";
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
  monthTop1: 300,
  quarterTop1: 1000,
  maodao: 9.9,
  pool: 50000,
  paid: 0,
};

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
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await updateAdminIncentiveConfig(form);
      setForm({ ...emptyForm, ...(result.config || form) });
      setMessage(result.message || "已保存");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash">
      <div className="dash-section">
        {error && <div className="error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
        {loading ? (
          <div className="dash-loading">加载中...</div>
        ) : (
          <form className="admin-form ph-ops-incentive-form" onSubmit={handleSave}>
            <label className="admin-filter-field">
              <span>激励类型</span>
              <select
                className="admin-filter-select"
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

            <div className="ph-ops-incentive-grid">
              {[
                ["weekTop1", "周榜 Top1"],
                ["weekTop2", "周榜 Top2"],
                ["weekTop3", "周榜 Top3"],
                ["monthTop1", "月榜 Top1"],
                ["quarterTop1", "季榜 Top1"],
                ["maodao", "华为码道单次激励"],
                ["pool", "激励池总额"],
                ["paid", "已发放金额"],
              ].map(([key, label]) => (
                <label key={key} className="admin-filter-field">
                  <span>{label}</span>
                  <input
                    className="admin-filter-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="ph-btn-primary" disabled={saving}>
                {saving ? "保存中..." : "保存配置并生效"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
