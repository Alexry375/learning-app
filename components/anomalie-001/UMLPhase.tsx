"use client";

import { useState } from "react";
import type { UMLContent } from "@/anomalies/001-le-compilateur-hante/types";
import { QuestionPanel } from "./QuestionPanel";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  content: UMLContent;
  onAward: (points: number) => void;
  onContinue: () => void;
};

export function UMLPhase({ content, onAward, onContinue }: Props) {
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [awaiting, setAwaiting] = useState<boolean | null>(null);

  const item = content.items[idx];
  const isLast = idx === content.items.length - 1;
  const allDone = answered.length >= content.items.length;

  function handleAnswered(c: boolean) {
    onAward(c ? 15 : 4);
    setAnswered((a) => [...a, c]);
  }

  return (
    <article className="narrative">
      <header className="mb-6">
        <h2
          className="font-mono text-[0.78rem] tracking-classified mb-3"
          style={{ color: "var(--amber)" }}
        >
          RECONSTITUTION UML
        </h2>
        <p
          className="font-serif italic text-[1rem] leading-relaxed"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {content.intro}
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!allDone && (
          <motion.div
            key={`uml-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4"
          >
            <p
              className="font-serif italic text-[0.95rem] leading-relaxed"
              style={{ color: "var(--ink-paper-dim)" }}
            >
              {item.setup}
            </p>
            <pre
              className="font-mono text-[0.78rem] whitespace-pre overflow-x-auto"
              style={{
                background: "rgba(7, 4, 2, 0.55)",
                color: "var(--amber)",
                padding: "0.9rem 1.1rem",
                borderInlineStart: "2px solid var(--amber-deep)",
              }}
            >
              {item.scenario}
            </pre>
            <QuestionPanel
              question={item.question}
              onAnswered={(c) => {
                if (!isLast) {
                  // bascule vers la question suivante après un temps de lecture
                  handleAnswered(c);
                  setTimeout(() => {
                    setIdx((i) => i + 1);
                  }, 2400);
                } else {
                  // dernière question : laisser la note pédagogique visible,
                  // exiger un clic explicite pour fermer.
                  // Le state `answered` n'est mis à jour qu'au clic.
                  setAwaiting(c);
                }
              }}
            />
            {awaiting !== null && isLast && (
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="btn-int"
                  onClick={() => {
                    handleAnswered(awaiting);
                    setAwaiting(null);
                  }}
                >
                  CONSIGNER LA RECONSTITUTION
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {allDone && (
        <div className="mt-10">
          <p
            className="font-serif italic text-[0.95rem] leading-relaxed mb-6"
            style={{ color: "var(--ink-paper-dim)" }}
          >
            {content.postlude}
          </p>
          <div className="flex justify-end">
            <button type="button" className="btn-int" onClick={onContinue}>
              CONFRONTATION DU CODE
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
