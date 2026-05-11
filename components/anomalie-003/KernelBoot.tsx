"use client";

import { useEffect, useState } from "react";

const BOOT_LINES: { t: number; line: string; level?: "info" | "alert" | "warn" }[] = [
  { t: 0.0, line: "Linux Interpreteur 6.10.0-substrate-3 (aarch64)" },
  { t: 0.001, line: "CPU: Cortex-A76 r4p1 · 4 cores" },
  { t: 0.012, line: "mem: 8 GB DDR5" },
  { t: 0.043, line: "sched_init() · scheduler ready" },
  { t: 0.062, line: "init pid_table[] · 4 entries reserved" },
  { t: 0.087, line: "couche ALLOCATAIRE : intégrité 41%", level: "alert" },
  { t: 0.142, line: "FRACTURE DÉTECTÉE — primitives fork/exec/wait artefactuelles", level: "alert" },
  { t: 0.189, line: "mode dégradé activé", level: "warn" },
  { t: 0.241, line: "agent autorisé · PID=1" },
  { t: 0.298, line: "fragments TP1/TP2/TP3 chargés en /opt/intervention" },
];

type Props = {
  onDone?: () => void;
  /** Si true : skip directement (déjà bootté). */
  skip?: boolean;
};

export function KernelBoot({ onDone, skip = false }: Props) {
  const [shown, setShown] = useState<number>(skip ? BOOT_LINES.length : 0);
  const [done, setDone] = useState(skip);

  useEffect(() => {
    if (skip) {
      onDone?.();
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((b, i) => {
      const t = setTimeout(() => {
        if (cancelled) return;
        setShown(i + 1);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => {
            if (!cancelled) {
              setDone(true);
              onDone?.();
            }
          }, 400);
        }
      }, 120 + i * 130);
      timers.push(t);
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onDone, skip]);

  function handleSkip() {
    setShown(BOOT_LINES.length);
    setDone(true);
    onDone?.();
  }

  if (done && skip) return null;

  return (
    <div
      role="region"
      aria-label="Kernel boot sequence"
      onClick={handleSkip}
      style={{
        cursor: done ? "default" : "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
        lineHeight: 1.5,
        padding: "1rem 0",
        color: "var(--allocataire-ink)",
      }}
    >
      {BOOT_LINES.slice(0, shown).map((b, i) => {
        const color =
          b.level === "alert"
            ? "var(--allocataire-panic)"
            : b.level === "warn"
              ? "var(--allocataire-userspace)"
              : "var(--allocataire-ink)";
        return (
          <div key={i}>
            <span style={{ color: "var(--allocataire-ink-faint)" }}>
              [{b.t.toFixed(3).padStart(7)} ]
            </span>{" "}
            <span style={{ color }}>{b.line}</span>
          </div>
        );
      })}
      {!done && (
        <div className="kernel-cursor" style={{ color: "var(--allocataire-kernel)" }}>
          <span style={{ color: "var(--allocataire-ink-faint)" }}>
            [ ALEXIS ]
          </span>{" "}
        </div>
      )}
      {!done && (
        <div
          style={{
            marginTop: "0.6rem",
            color: "var(--allocataire-ink-faint)",
            fontSize: "0.6rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          [ clic pour passer ]
        </div>
      )}
    </div>
  );
}
