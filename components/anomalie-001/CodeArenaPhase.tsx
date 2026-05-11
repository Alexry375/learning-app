"use client";

import { useState } from "react";
import type { CodeArenaContent } from "@/anomalies/001-le-compilateur-hante/types";
import { CompileLab } from "@/components/shared/CompileLab";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  content: CodeArenaContent;
  onAward: (points: number) => void;
  onContinue: () => void;
};

export function CodeArenaPhase({ content, onAward, onContinue }: Props) {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[]>([]);
  const [revealedNote, setRevealedNote] = useState<number[]>([]);

  const item = content.items[idx];
  const allSolved = solved.filter(Boolean).length;
  const canAdvance = allSolved >= 1; // au moins le 1er

  return (
    <article className="narrative">
      <header className="mb-6">
        <h2
          className="font-mono text-[0.78rem] tracking-classified mb-3"
          style={{ color: "var(--amber)" }}
        >
          CONFRONTATION — LE CODE COUPABLE
        </h2>
        <p
          className="font-serif italic text-[1rem] leading-relaxed"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {content.intro}
        </p>
      </header>

      <nav className="flex items-center gap-2 mb-5 flex-wrap">
        {content.items.map((it, i) => (
          <button
            key={it.title}
            type="button"
            onClick={() => setIdx(i)}
            className="px-3 py-1 text-[0.62rem] tracking-classified font-mono border"
            style={{
              borderColor:
                i === idx
                  ? "var(--amber)"
                  : solved[i]
                    ? "rgba(122,223,138,0.5)"
                    : "rgba(212,165,72,0.18)",
              color: solved[i] ? "#7adf8a" : i === idx ? "var(--amber)" : "var(--ink-paper-dim)",
              background: i === idx ? "rgba(212,165,72,0.05)" : "transparent",
            }}
          >
            {String(i + 1).padStart(2, "0")} · {it.title}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={`code-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4"
        >
          <p
            className="font-serif text-[1rem] leading-relaxed"
            style={{ color: "var(--ink-paper)" }}
          >
            {item.setup}
          </p>

          <CompileLab
            initialCode={item.initialCode}
            language="java"
            expected={item.expectedOutput}
            onSuccess={() => {
              setSolved((s) => {
                if (s[idx]) return s;
                const next = [...s];
                next[idx] = true;
                return next;
              });
              setRevealedNote((r) => (r.includes(idx) ? r : [...r, idx]));
              onAward(25);
            }}
            compact
          />

          {revealedNote.includes(idx) && (
            <div
              className="text-[0.85rem] leading-relaxed font-serif"
              style={{
                color: "var(--ink-paper-dim)",
                borderInlineStart: "2px solid var(--amber-deep)",
                paddingInlineStart: "0.9rem",
                marginBlockStart: "0.4rem",
              }}
            >
              <span
                className="block text-[0.62rem] tracking-classified font-mono mb-1"
                style={{ color: "var(--amber)" }}
              >
                NOTE — BIBLIOTHÈQUE
              </span>
              {item.pedagogyNote}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <p
          className="text-[0.78rem] font-serif italic"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {canAdvance
            ? "Le code se rétracte. Vous pouvez clore la confrontation — ou poursuivre les autres défis."
            : "Faites passer au moins un test pour avancer."}
        </p>
        <button
          type="button"
          className="btn-int"
          onClick={onContinue}
          disabled={!canAdvance}
          style={{ opacity: canAdvance ? 1 : 0.45 }}
        >
          {allSolved >= content.items.length ? "VERDICT DE LA JVM" : "AVANCER VERS LE VERDICT"}
        </button>
      </div>

      <p
        className="mt-6 font-serif italic text-[0.9rem] leading-relaxed"
        style={{ color: "var(--ink-paper-dim)" }}
      >
        {content.postlude}
      </p>
    </article>
  );
}
