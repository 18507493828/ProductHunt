import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { SHARE_PLATFORMS, platformLabel } from "../../sharePlatforms";
import {
  deleteAdminShare,
  fetchAdminShareConfig,
  fetchAdminShares,
  updateAdminShareConfig,
} from "../../api";

const PLATFORM_THEME = {
  douyin: { color: "#25F4EE" },
  wechat: { color: "#07C160" },
  xiaohongshu: { color: "#FF2442" },
  link: { color: "#6B8CFF" },
};

function emptyConfig() {
  return {
    titlePrefix: "",
    footer: "",
    platforms: Object.fromEntries(
      SHARE_PLATFORMS.map((p) => [
        p.id,
        { enabled: true, template: p.defaultTemplate },
      ]),
    ),
  };
}

export default function Shares() {
  const [shares, setShares] = useState([]);
  const [stats, setStats] = useState({ all: 0 });
  const [config, setConfig] = useState(emptyConfig);
  const [activePlatform, setActivePlatform] = useState(SHARE_PLATFORMS[0].id);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [draftQ, setDraftQ] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState("");

  const activeMeta =
    SHARE_PLATFORMS.find((p) => p.id === activePlatform) || SHARE_PLATFORMS[0];
  const activeTheme = PLATFORM_THEME[activePlatform] || PLATFORM_THEME.link;
  const activePlatformConfig = config.platforms?.[activePlatform] || {
    enabled: true,
    template: activeMeta.defaultTemplate,
  };

  async function loadShares(keyword = q, platform = filterPlatform) {
    const data = await fetchAdminShares({
      q: keyword,
      platform: platform === "all" ? "" : platform,
    });
    setShares(data.items || []);
    setStats(data.stats || { all: 0 });
  }

  async function loadAll(keyword = q, platform = filterPlatform) {
    try {
      setLoading(true);
      setError("");
      const [shareData, shareConfig] = await Promise.all([
        fetchAdminShares({
          q: keyword,
          platform: platform === "all" ? "" : platform,
        }),
        fetchAdminShareConfig(),
      ]);
      setShares(shareData.items || []);
      setStats(shareData.stats || { all: 0 });
      setConfig({ ...emptyConfig(), ...(shareConfig || {}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewHint = useMemo(
    () =>
      "{name} 作品名 · {tagline} 简介 · {url} 链接 · {tags} 话题 · {title} 带前缀标题 · {footer} 结尾",
    [],
  );

  async function handleSaveConfig(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await updateAdminShareConfig(config);
      setConfig({ ...emptyConfig(), ...(result.config || config) });
      setMessage(result.message || "已保存");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function updateActivePlatform(patch) {
    setConfig((prev) => ({
      ...prev,
      platforms: {
        ...(prev.platforms || {}),
        [activePlatform]: {
          ...(prev.platforms?.[activePlatform] || {
            enabled: true,
            template: activeMeta.defaultTemplate,
          }),
          ...patch,
        },
      },
    }));
  }

  function switchFilter(next) {
    setFilterPlatform(next);
    setLoading(true);
    loadShares(q, next)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleDelete(share) {
    if (!window.confirm(`确定删除「${share.productName}」的这条分享记录吗？`)) {
      return;
    }
    try {
      setActionId(share.id);
      setError("");
      await deleteAdminShare(share.id);
      await loadShares();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="admin-share-page">
      <div className="admin-toolbar">
        <p className="admin-toolbar-hint">
          配置各平台文案模板，并查看用户复制分享记录。
        </p>
      </div>

      <form className="admin-share-config" onSubmit={handleSaveConfig}>
        <div className="admin-share-globals">
          <label className="admin-filter-field">
            <span>标题前缀</span>
            <input
              className="admin-filter-input"
              value={config.titlePrefix || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  titlePrefix: e.target.value,
                }))
              }
              placeholder="例如：【Vibe Building】"
            />
          </label>
          <label className="admin-filter-field">
            <span>文案结尾</span>
            <input
              className="admin-filter-input"
              value={config.footer || ""}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, footer: e.target.value }))
              }
              placeholder="可选追加文案"
            />
          </label>
        </div>

        <div className="admin-share-platform-tabs">
          {SHARE_PLATFORMS.map((tab) => {
            const theme = PLATFORM_THEME[tab.id];
            const enabled = config.platforms?.[tab.id]?.enabled !== false;
            return (
              <button
                key={tab.id}
                type="button"
                className={
                  "admin-share-platform-tab" +
                  (activePlatform === tab.id ? " is-active" : "") +
                  (enabled ? "" : " is-off")
                }
                style={{ "--share-accent": theme.color }}
                onClick={() => setActivePlatform(tab.id)}
              >
                {tab.name}
                <em>{enabled ? "开" : "关"}</em>
              </button>
            );
          })}
        </div>

        <div
          className="admin-share-editor"
          style={{ "--share-accent": activeTheme.color }}
        >
          <div className="admin-share-editor-head">
            <div>
              <h3>{activeMeta.name}</h3>
              <p className="admin-hint">{activeMeta.tip}</p>
            </div>
            <label className="admin-share-switch">
              <input
                type="checkbox"
                checked={activePlatformConfig.enabled !== false}
                onChange={(e) =>
                  updateActivePlatform({ enabled: e.target.checked })
                }
              />
              <span>启用平台</span>
            </label>
          </div>

          <label className="admin-filter-field admin-share-editor-field">
            <span>文案模板</span>
            <textarea
              className="admin-share-template"
              rows={9}
              value={activePlatformConfig.template || ""}
              onChange={(e) =>
                updateActivePlatform({ template: e.target.value })
              }
              placeholder={activeMeta.defaultTemplate}
            />
          </label>

          <p className="admin-hint">{previewHint}</p>

          <div className="admin-share-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() =>
                updateActivePlatform({
                  template: activeMeta.defaultTemplate,
                  enabled: true,
                })
              }
            >
              恢复默认
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={saving}
              onClick={() => setConfig(emptyConfig())}
            >
              重置全部
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving ? "保存中..." : "保存配置"}
            </button>
          </div>
        </div>
      </form>

      <section className="admin-share-records">
        <div className="admin-share-records-head">
          <div className="tabs">
            <button
              type="button"
              className={filterPlatform === "all" ? "tab active" : "tab"}
              onClick={() => switchFilter("all")}
            >
              全部 {stats.all ?? 0}
            </button>
            {SHARE_PLATFORMS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={filterPlatform === tab.id ? "tab active" : "tab"}
                onClick={() => switchFilter(tab.id)}
              >
                {tab.name} {stats[tab.id] ?? 0}
              </button>
            ))}
          </div>
          <form
            className="admin-share-search"
            onSubmit={(e) => {
              e.preventDefault();
              const next = draftQ.trim();
              setQ(next);
              setLoading(true);
              loadShares(next, filterPlatform)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
          >
            <input
              className="admin-filter-input"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="搜索应用 / 用户"
            />
            <button type="submit" className="admin-btn admin-btn-primary">
              搜索
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setDraftQ("");
                setQ("");
                setLoading(true);
                loadShares("", filterPlatform)
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
            >
              重置
            </button>
          </form>
        </div>

        {message && <div className="admin-success">{message}</div>}
        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="admin-empty">加载中...</div>
        ) : shares.length === 0 ? (
          <EmptyState title="暂无分享记录" />
        ) : (
          <div className="admin-masonry">
            {shares.map((share) => {
              const theme =
                PLATFORM_THEME[share.platform] || PLATFORM_THEME.link;
              return (
                <article
                  className="admin-masonry-card"
                  key={share.id}
                  style={{ "--share-accent": theme.color }}
                >
                  <div className="admin-masonry-card-top">
                    <span className="admin-share-record-platform">
                      {platformLabel(share.platform)}
                    </span>
                  </div>
                  <h2 className="admin-masonry-title">
                    {share.productName || share.productId}
                  </h2>
                  <div className="admin-masonry-meta">
                    <span>{share.nickname || share.username || "访客"}</span>
                    <span>
                      {share.createdAt
                        ? new Date(share.createdAt).toLocaleString("zh-CN")
                        : "—"}
                    </span>
                  </div>
                  <div className="admin-masonry-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={actionId === share.id}
                      onClick={() => handleDelete(share)}
                    >
                      删除
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
