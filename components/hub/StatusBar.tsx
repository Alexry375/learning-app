"use client";

import { useEffect, useState } from "react";

type Props = {
  handle: string;
  clearance: number;
};

function formatUTC(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  );
}

export function StatusBar({ handle, clearance }: Props) {
  // Empty initial → matches SSR render. Only populated after mount, killing the hydration mismatch.
  const [stamp, setStamp] = useState<string | null>(null);
  useEffect(() => {
    setStamp(formatUTC(new Date()));
    const id = setInterval(() => setStamp(formatUTC(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="band band--phosphor py-3 px-6 flex items-center justify-between text-[0.68rem] tracking-classified text-[color:var(--ink-dim)]">
      <div className="flex items-center gap-6">
        <span className="text-[color:var(--phosphor)]">⟨ Ω ⟩</span>
        <span>L&apos;INTERPRÉTEUR</span>
        <span className="hidden md:inline text-[color:var(--ink-faint)]">
          //  COORDINATION DES COMPILATEURS  //
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span>
          AGENT&nbsp;<span className="text-[color:var(--ink-primary)]">{handle}</span>
        </span>
        <span>
          CLEARANCE&nbsp;
          <span className="text-[color:var(--classified)]">
            {"τ".repeat(Math.max(1, Math.min(5, clearance)))}
          </span>
        </span>
        <span className="hidden lg:inline tabular-nums" suppressHydrationWarning>
          {stamp ?? " "}
        </span>
      </div>
    </header>
  );
}
