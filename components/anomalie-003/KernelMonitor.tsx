"use client";

import { useEffect, useState } from "react";
import { useKernel } from "./kernel-store";

function fmtUptime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function KernelMonitor({ tpLabel }: { tpLabel?: string }) {
  const { state } = useKernel();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const uptime = fmtUptime(Date.now() - state.bootAt);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11, 15, 36, 0.85)",
        borderBottom: "1px solid var(--allocataire-rule)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.68rem",
        letterSpacing: "0.04em",
        color: "var(--allocataire-ink-dim)",
      }}
      data-tick={tick}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "0.55rem 1.2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            className="kernel-dot"
            data-state={state.status === "fracture" ? "alert" : "ok"}
          />
          <span
            style={{
              color: "var(--allocataire-kernel)",
              fontWeight: 600,
            }}
          >
            KERNEL
          </span>
          <span style={{ color: "var(--allocataire-ink-faint)" }}>
            6.10.0-substrate-3 aarch64
          </span>
        </div>

        <Metric label="uptime" value={uptime} />
        <Metric label="proc" value={String(state.procCount)} accent="kernel" />
        <Metric label="sig" value={String(state.signalCount)} accent="signal" />
        <Metric
          label="syscall"
          value={state.lastSyscall ?? "—"}
          accent="syscall"
        />
        <Metric
          label="cells"
          value={String(state.cellsCompleted.size)}
          accent="userspace"
        />

        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
          {state.status === "fracture" && (
            <span
              style={{
                color: "var(--allocataire-panic)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "0.6rem",
              }}
            >
              ▲ FRACTURE
            </span>
          )}
          {tpLabel && (
            <span
              style={{
                color: "var(--allocataire-ink-faint)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "0.6rem",
              }}
            >
              INTERPRÉTEUR · 003 · {tpLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "kernel" | "signal" | "syscall" | "userspace";
}) {
  const color =
    accent === "kernel"
      ? "var(--allocataire-kernel)"
      : accent === "signal"
        ? "var(--allocataire-signal)"
        : accent === "syscall"
          ? "var(--allocataire-syscall)"
          : accent === "userspace"
            ? "var(--allocataire-userspace)"
            : "var(--allocataire-ink)";
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "baseline" }}>
      <span
        style={{
          color: "var(--allocataire-ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: "0.55rem",
        }}
      >
        {label}
      </span>
      <span style={{ color, fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}
