"use client";

import { useEffect, useState } from "react";
import type { BriefingContent } from "@/anomalies/001-le-compilateur-hante/types";
import { Typewriter } from "@/components/shared/Typewriter";
import { motion } from "motion/react";

type Props = {
  content: BriefingContent;
  onContinue: () => void;
};

export function Briefing({ content, onContinue }: Props) {
  const [revealed, setRevealed] = useState(false);

  // fallback : si l'animation est interrompue (perf basse, navigation),
  // on révèle quand même les pistes après un délai max.
  useEffect(() => {
    const t = setTimeout(
      () => setRevealed(true),
      content.body.length * 600 + 1800,
    );
    return () => clearTimeout(t);
  }, [content.body.length]);

  return (
    <article className="narrative">
      <header className="mb-8">
        <ul
          className="grid grid-cols-2 gap-x-6 gap-y-1 text-[0.62rem] tracking-classified font-mono"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {content.meta.map((m) => (
            <li key={m.label} className="flex justify-between border-b border-[color:rgba(212,165,72,0.18)] py-1">
              <span>{m.label}</span>
              <span style={{ color: "var(--amber)" }}>{m.value}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className="font-serif text-[1.05rem] leading-[1.78]">
        {content.body.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: i * 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={() => i === content.body.length - 1 && setRevealed(true)}
            className="mb-5"
            style={{ color: "var(--ink-paper)" }}
          >
            {para}
          </motion.p>
        ))}
      </div>

      {content.epigraph && (
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif italic text-[0.95rem] leading-relaxed my-10 pl-5 border-l-2"
          style={{
            color: "var(--ink-paper-dim)",
            borderColor: "var(--amber)",
          }}
        >
          {content.epigraph.text}
          {content.epigraph.attribution && (
            <footer
              className="not-italic text-[0.7rem] tracking-classified font-mono mt-2"
              style={{ color: "var(--ink-paper-dim)" }}
            >
              — {content.epigraph.attribution}
            </footer>
          )}
        </motion.blockquote>
      )}

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-10"
      >
        <h3
          className="text-[0.62rem] tracking-classified font-mono mb-4"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          PISTES INITIALES — TROIS SUSPECTS RETENUS
        </h3>
        <ol className="flex flex-col gap-3">
          {content.leads.map((lead) => (
            <li
              key={lead.conceptId}
              className="border px-5 py-4"
              style={{
                borderColor: "rgba(212,165,72,0.35)",
                background: "rgba(212,165,72,0.04)",
              }}
            >
              <div className="text-[0.62rem] tracking-classified font-mono mb-1" style={{ color: "var(--amber)" }}>
                {lead.label}
              </div>
              <p className="font-serif text-[0.98rem]" style={{ color: "var(--ink-paper)" }}>
                <Typewriter text={lead.hook} speed={14} jitter={6} caret={false} />
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-end">
          <button type="button" className="btn-int" onClick={onContinue}>
            ENGAGER LES AUDITIONS
          </button>
        </div>
      </motion.section>
    </article>
  );
}
