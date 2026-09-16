import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { fetchProduct } from "../api";
import { useAuth } from "../AuthContext";
import { redirectToLogin } from "../authRedirect";
import { useToast } from "../Toast";
import SiteHeader from "../components/SiteHeader";
import CachedImage from "../components/CachedImage";
import EmptyState from "../components/EmptyState";
import { formatProductPrice } from "../productPricing";

function formatChatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSeedMessages(product) {
  const creator = product?.submittedBy || "创作者";
  const price = formatProductPrice(product).display;
  const now = Date.now();
  return [
    {
      id: "sys-1",
      role: "system",
      text: "聊天功能暂未开通，当前仅支持查看会话界面。",
      createdAt: now - 120000,
    },
    {
      id: "creator-1",
      role: "creator",
      author: creator,
      text: `你好，我是「${product?.name || "本应用"}」的创作者。${
        price ? `当前报价 ${price}，` : ""
      }聊天功能开通后，可在此沟通需求与交付细节。`,
      createdAt: now - 60000,
    },
  ];
}

export default function CreatorChat() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const listRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  function goBackToProduct() {
    // 用历史后退，避免再 push 一层详情页，导致浏览器返回又进聊天
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    if (productId) {
      navigate(`/resource/${encodeURIComponent(productId)}`, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      redirectToLogin(
        navigate,
        `/chat/${encodeURIComponent(productId || "")}`,
      );
    }
  }, [authLoading, user, navigate, productId]);

  useEffect(() => {
    if (!user) return undefined;
    if (!productId) {
      setLoading(false);
      setProduct(null);
      setError("请从应用购买页进入，与对应创作者沟通");
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchProduct(productId)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setMessages(buildSeedMessages(data));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, user]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const pricing = useMemo(
    () => (product ? formatProductPrice(product) : null),
    [product],
  );

  function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "me",
        author: user?.nickname || user?.username || "我",
        text,
        createdAt: Date.now(),
      },
    ]);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: "system",
          text: "聊天功能暂未开通，消息暂无法送达创作者。",
          createdAt: Date.now(),
        },
      ]);
      setSending(false);
      toast.info("聊天功能暂未开通");
    }, 450);
  }

  if (authLoading || !user) {
    return (
      <div className="ph-app">
        <SiteHeader />
        <main className="ph-main ph-chat-page">
          <div className="ph-chat-loading">正在进入聊天…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="ph-app">
      <SiteHeader />
      <main className="ph-main ph-chat-page">
        <div className="ph-chat-shell">
          <header className="ph-chat-head">
            <button
              type="button"
              className="ph-chat-back"
              onClick={goBackToProduct}
              aria-label="返回"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="ph-chat-head-main">
              <h1>联系创作者</h1>
              {product ? (
                <p>
                  与 {product.submittedBy || "创作者"} 沟通 · {product.name}
                </p>
              ) : (
                <p>一对一询价与交付沟通</p>
              )}
            </div>
            {product?.imageUrl ? (
              <button
                type="button"
                className="ph-chat-product-thumb"
                title="返回应用详情"
                onClick={goBackToProduct}
              >
                <CachedImage src={product.imageUrl} alt="" />
              </button>
            ) : null}
          </header>

          {product ? (
            <div className="ph-chat-product-bar">
              <div>
                <strong>{product.name}</strong>
                <span>{product.tagline || "暂无简介"}</span>
              </div>
              <em>{pricing?.display}</em>
            </div>
          ) : null}

          <div className="ph-chat-im-banner" role="status">
            聊天功能暂未开通
          </div>

          <div className="ph-chat-body" ref={listRef}>
            {loading ? (
              <div className="ph-chat-loading">加载会话中…</div>
            ) : error ? (
              <EmptyState title="无法打开会话" description={error} />
            ) : (
              <ul className="ph-chat-list">
                {messages.map((msg) => {
                  if (msg.role === "system") {
                    return (
                      <li key={msg.id} className="ph-chat-system">
                        {msg.text}
                      </li>
                    );
                  }
                  const mine = msg.role === "me";
                  return (
                    <li
                      key={msg.id}
                      className={"ph-chat-bubble-row" + (mine ? " is-me" : "")}
                    >
                      <div className="ph-chat-avatar" aria-hidden="true">
                        {(msg.author || "?").trim().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="ph-chat-bubble">
                        <div className="ph-chat-bubble-meta">
                          <strong>{msg.author}</strong>
                          <time>{formatChatTime(msg.createdAt)}</time>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form className="ph-chat-composer" onSubmit={handleSend}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="聊天功能暂未开通，开通后可在此留言咨询…"
              rows={2}
              maxLength={1000}
              disabled={loading || Boolean(error) || sending}
            />
            <button
              type="submit"
              className="ph-btn-primary"
              disabled={loading || Boolean(error) || sending || !draft.trim()}
            >
              <Send size={16} aria-hidden="true" />
              发送
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
