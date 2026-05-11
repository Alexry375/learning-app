"use client";

import { useEffect } from "react";
import { useKernel } from "./kernel-store";

function fmtTime(t: number): string {
  const s = (t / 1000).toFixed(3);
  return `[ ${s.padStart(8)} ]`;
}

export function KernelAlerts() {
  const { state, dispatch } = useKernel();

  // Auto-dismiss après 6s.
  useEffect(() => {
    if (state.alerts.length === 0) return;
    const timers = state.alerts.map((a) =>
      setTimeout(
        () => dispatch({ type: "dismiss-alert", id: a.id }),
        6000,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [state.alerts, dispatch]);

  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        right: 16,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "min(420px, calc(100vw - 32px))",
        pointerEvents: "none",
      }}
    >
      {state.alerts.map((a) => {
        const color =
          a.level === "alert"
            ? "var(--allocataire-panic)"
            : a.level === "warn"
              ? "var(--allocataire-userspace)"
              : "var(--allocataire-kernel)";
        return (
          <div
            key={a.id}
            className="kernel-alert-enter"
            style={{
              pointerEvents: "auto",
              background: "rgba(5, 8, 19, 0.95)",
              border: `1px solid ${color}`,
              padding: "0.7rem 0.9rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              lineHeight: 1.45,
              boxShadow: `0 0 18px rgba(255, 58, 58, 0.18)`,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  color: "var(--allocataire-ink-faint)",
                  fontSize: "0.6rem",
                }}
              >
                {fmtTime(a.t)}
              </span>
              <span style={{ color, fontWeight: 600, letterSpacing: "0.14em" }}>
                {a.level === "alert"
                  ? "KERNEL ALERT"
                  : a.level === "warn"
                    ? "KERNEL WARN"
                    : "KERNEL INFO"}
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "dismiss-alert", id: a.id })
                }
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "var(--allocataire-ink-faint)",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <div
              style={{
                marginTop: "0.3rem",
                color: "var(--allocataire-ink)",
              }}
            >
              {a.message}
            </div>
            {a.detail && (
              <div
                style={{
                  marginTop: "0.2rem",
                  color: "var(--allocataire-ink-dim)",
                  fontSize: "0.65rem",
                }}
              >
                {a.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
