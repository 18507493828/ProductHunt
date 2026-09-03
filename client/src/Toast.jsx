import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10.2l2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 9v5M10 6.5v.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onDismiss(toast.id), 280);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    timerRef.current = window.setTimeout(dismiss, toast.duration);
    return () => window.clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  return (
    <div
      className={`toast toast-${toast.type}${leaving ? " toast-leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={`toast-icon toast-icon-${toast.type}`}>
        {ICONS[toast.type] || ICONS.info}
      </div>
      <div className="toast-content">
        {toast.title && <p className="toast-title">{toast.title}</p>}
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={dismiss}
        aria-label="关闭提示"
      >
        ×
      </button>
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-viewport" aria-label="通知">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options) => {
    const id = ++idRef.current;
    const title = (options.title || "").trim();
    let message = (options.message || "").trim();
    // 避免标题与正文相同，出现“两个保存成功”
    if (message && message === title) message = "";
    const nextToast = {
      id,
      type: options.type || "info",
      title: title || message,
      message: title ? message : "",
      duration: options.duration ?? 3200,
    };
    if (!nextToast.title && !nextToast.message) return null;
    setToasts((current) => [...current.slice(-2), nextToast]);
    return id;
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      success(title, message, duration) {
        return showToast({ type: "success", title, message, duration });
      },
      error(title, message, duration) {
        return showToast({ type: "error", title, message, duration });
      },
      info(title, message, duration) {
        return showToast({ type: "info", title, message, duration });
      },
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
