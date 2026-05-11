"use client";

import { useState, useEffect } from "react";
import type { VerdictContent } from "@/anomalies/001-le-compilateur-hante/types";
import { QuestionPanel } from "./QuestionPanel";
import Link from "next/link";
import { motion } from "motion/react";

type Props = {
  content: VerdictContent;
  slug: string;
  anomalieTitle: string;
  score: number;
  onResolve: (full: boolean) => void;
};

export function Verdict({
  content,
  slug,
  anomalieTitle,
  score,
  onResolve,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const isLast = idx === content.questions.length - 1;
  const allDone = results.length === content.questions.length;
  const correctCount = results.filter(Boolean).length;
  const full = correctCount === content.questions.length;

  useEffect(() => {
    if (allDone) {
      onResolve(full);
      // débloquer le fragment de lore
      fetch("/api/lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content.loreFragment.id,
          slug,
          title: content.loreFragment.title,
          body: content.loreFragment.body,
        }),
      }).catch(() => {/* best-effort */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, full]);

  return (
    <article className="narrative">
      <header className="mb-6">
        <h2
          className="font-mono text-[0.78rem] tracking-classified mb-3"
          style={{ color: "var(--amber)" }}
        >
          VERDICT — LA JVM EST APPELÉE À LA BARRE
        </h2>
        <p
          className="font-serif italic text-[1rem] leading-relaxed"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {content.setup}
        </p>
      </header>

      {!allDone && (
        <motion.div
          key={`q-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="text-[0.62rem] tracking-classified font-mono mb-3"
            style={{ color: "var(--amber)" }}
          >
            QUESTION {idx + 1} / {content.questions.length}
          </div>
          <QuestionPanel
            question={content.questions[idx]}
            onAnswered={(c) => {
              setResults((r) => [...r, c]);
              setTimeout(() => {
                if (!isLast) setIdx((i) => i + 1);
              }, 2400);
            }}
          />
        </motion.div>
      )}

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 mt-2"
        >
          <div
            className="border px-5 py-4"
            style={{
              borderColor: full
                ? "rgba(122,223,138,0.4)"
                : "rgba(212,165,72,0.4)",
              background: full
                ? "rgba(122,223,138,0.04)"
                : "rgba(212,165,72,0.04)",
            }}
          >
            <div
              className="text-[0.62rem] tracking-classified font-mono mb-2"
              style={{ color: full ? "#7adf8a" : "var(--amber)" }}
            >
              {full ? "ANOMALIE RÉSOLUE" : "RÉSOLUTION PARTIELLE"} · SCORE {score}
            </div>
            <p
              className="font-serif text-[1.05rem] leading-relaxed"
              style={{ color: "var(--ink-paper)" }}
            >
              {full ? content.resolutionFull : content.resolutionPartial}
            </p>
          </div>

          <div
            className="border px-5 py-4"
            style={{
              borderColor: "rgba(212,165,72,0.5)",
              background: "rgba(212,165,72,0.06)",
            }}
          >
            <div
              className="text-[0.62rem] tracking-classified font-mono mb-2"
              style={{ color: "var(--amber)" }}
            >
              FRAGMENT DE LORE — {content.loreFragment.title.toUpperCase()}
            </div>
            <p
              className="font-serif italic text-[1rem] leading-relaxed"
              style={{ color: "var(--ink-paper)" }}
            >
              {content.loreFragment.body}
            </p>
            <div
              className="text-[0.6rem] tracking-classified font-mono mt-3"
              style={{ color: "var(--ink-paper-dim)" }}
            >
              consigné au journal de terrain ›
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Link href="/journal" className="btn-int" prefetch={false} data-variant="classified">
              CONSULTER LE JOURNAL
            </Link>
            <Link href="/" className="btn-int" prefetch={false}>
              RETOUR TERMINAL
            </Link>
          </div>

          <p
            className="text-[0.7rem] tracking-classified font-mono text-center mt-6"
            style={{ color: "var(--ink-paper-dim)" }}
          >
            // {anomalieTitle.toUpperCase()} · DOSSIER CLÔT À T={new Date().toISOString()}
          </p>
        </motion.div>
      )}
    </article>
  );
}
