import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function ToastItem({ toast, onClose }) {
  const bgByType = {
    success: "#198754",
    error: "#dc3545",
    info: "#0d6efd",
  };

  return (
    <div style={{ ...styles.toast, backgroundColor: bgByType[toast.type] || "#343a40" }}>
      <span style={styles.message}>{toast.message}</span>
      <button onClick={() => onClose(toast.id)} style={styles.closeBtn} aria-label="Close notification">
        x
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "info", duration = 3200) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const api = useMemo(
    () => ({
      success: (msg) => push(msg, "success"),
      error: (msg) => push(msg, "error", 4200),
      info: (msg) => push(msg, "info"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={styles.container}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}

const styles = {
  container: {
    position: "fixed",
    top: "14px",
    right: "14px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "min(92vw, 360px)",
  },
  toast: {
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.22)",
  },
  message: {
    fontSize: "0.92rem",
    fontWeight: 600,
    lineHeight: 1.35,
    marginRight: "10px",
  },
  closeBtn: {
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    lineHeight: 1,
  },
};

