"use client";

import { useEffect, useRef, useState } from "react";
import { useKernel, type KernelEvent } from "./kernel-store";

function fmtTime(t: number): string {
  const s = (t / 1000).toFixed(3);
  return `[ ${s.padStart(8)} ]`;
}

function levelTag(lvl: KernelEvent["level"]): string {
  switch (lvl) {
    case "info":
      return "KERN_INFO";
    case "warn":
      return "KERN_WARN";
    case "alert":
      return "KERN_ALERT";
    case "syscall":
      return "KERN_SYSC";
    case "signal":
      return "KERN_SIG ";
  }
}

function levelClass(lvl: KernelEvent["level"]): string {
  switch (lvl) {
    case "info":
      return "dmesg-info";
    case "warn":
      return "dmesg-warn";
    case "alert":
      return "dmesg-alert";
    case "syscall":
      return "dmesg-syscall";
    case "signal":
      return "dmesg-signal";
  }
}

export function KernelOutput({ height = 180 }: { height?: number }) {
  const { state } = useKernel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.events.length]);

  return (
    <div
      style={{
        background: "rgba(5, 8, 19, 0.85)",
        border: "1px solid var(--allocataire-rule)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
          padding: "0.4rem 0.8rem",
          borderBottom: "1px solid var(--allocataire-rule)",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--allocataire-ink-faint)",
        }}
      >
        <span>/ dmesg</span>
        <span style={{ color: "var(--allocataire-ink-dim)" }}>
          {state.events.length} entrées
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="btn-kernel"
          style={{
            marginLeft: "auto",
            padding: "2px 10px",
            fontSize: "0.55rem",
          }}
        >
          {collapsed ? "déployer" : "replier"}
        </button>
      </div>
      {!collapsed && (
        <div
          ref={scrollRef}
          style={{
            maxHeight: height,
            overflowY: "auto",
            padding: "0.6rem 0.8rem",
            lineHeight: 1.35,
          }}
        >
          {state.events.length === 0 && (
            <div
              className="dmesg-line"
              style={{ color: "var(--allocataire-ink-faint)" }}
            >
              [ — ] (en attente d&apos;événement kernel)
            </div>
          )}
          {state.events.map((ev) => (
            <div key={ev.id} className="dmesg-line">
              <span className="dmesg-time">{fmtTime(ev.t)}</span>{" "}
              <span className={levelClass(ev.level)}>{levelTag(ev.level)}</span>{" "}
              <span style={{ color: "var(--allocataire-ink)" }}>
                {ev.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
