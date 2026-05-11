"use client";

import { useState } from "react";
import type { Question } from "@/anomalies/001-le-compilateur-hante/types";
import { motion, AnimatePresence } from "motion/react";
import { RichText } from "./RichText";

type Props = {
  question: Question;
  onAnswered: (correct: boolean) => void;
  /** Si fourni, un bouton "CONTINUER" apparaît après reveal et l'appelle.
   *  Sans ce prop, la transition reste sous contrôle du parent (legacy). */
  onContinue?: () => void;
  /** Empêche de re-répondre. */
  locked?: boolean;
};

export function QuestionPanel({ question, onAnswered, onContinue, locked }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correctOption = question.options.find((o) => o.correct);

  function pick(id: string) {
    if (revealed || locked) return;
    setPicked(id);
    const c = question.options.find((o) => o.id === id)?.correct ?? false;
    setRevealed(true);
    onAnswered(c);
  }

  return (
    <div className="flex flex-col gap-4">
      <p
        className="font-serif text-[1.02rem] leading-relaxed"
        style={{ color: "var(--ink-paper)" }}
      >
        <RichText>{question.prompt}</RichText>
      </p>

      {question.artefact && (
        <pre
          className="font-mono text-[0.78rem] whitespace-pre overflow-x-auto"
          style={{
            background: "rgba(7, 4, 2, 0.55)",
            color: "var(--amber)",
            padding: "0.9rem 1.1rem",
            borderInlineStart: "2px solid var(--amber-deep)",
          }}
        >
          {question.artefact.body}
        </pre>
      )}

      <ul className="flex flex-col gap-2">
        {question.options.map((opt) => {
          const state = !revealed
            ? picked === opt.id
              ? "picked"
              : "idle"
            : opt.correct
              ? "correct"
              : opt.id === picked
                ? "wrong"
                : "dim";
          const color: Record<string, string> = {
            idle: "var(--ink-paper)",
            picked: "var(--amber)",
            correct: "#7adf8a",
            wrong: "#dd6a6a",
            dim: "var(--ink-paper-dim)",
          };
          const border: Record<string, string> = {
            idle: "rgba(212,165,72,0.18)",
            picked: "var(--amber)",
            correct: "#7adf8a",
            wrong: "#dd6a6a",
            dim: "rgba(212,165,72,0.10)",
          };
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={revealed || locked}
                onClick={() => pick(opt.id)}
                className="w-full text-left flex gap-4 px-4 py-3 transition-colors"
                style={{
                  borderInlineStart: `2px solid ${border[state]}`,
                  color: color[state],
                  background:
                    state === "picked" || state === "correct" || state === "wrong"
                      ? "rgba(212,165,72,0.04)"
                      : "transparent",
                }}
              >
                <span
                  className="font-mono text-[0.78rem] tracking-classified shrink-0"
                  style={{ color: border[state] }}
                >
                  {opt.id}
                </span>
                <span className="font-serif text-[0.98rem]"><RichText>{opt.text}</RichText></span>
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2 mt-2"
          >
            <p
              className="font-serif italic text-[0.95rem] leading-relaxed"
              style={{
                color:
                  picked && correctOption?.id === picked
                    ? "#a5f0a5"
                    : "#f0a5a5",
              }}
            >
              <RichText>
                {picked && correctOption?.id === picked
                  ? question.praiseOnRight
                  : question.hintOnWrong}
              </RichText>
            </p>
            <div
              className="text-[0.82rem] leading-relaxed font-serif"
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
              <RichText>{question.pedagogyNote}</RichText>
            </div>
            {onContinue && (
              <div className="flex justify-end mt-2">
                <button type="button" className="btn-int" onClick={onContinue}>
                  CONTINUER
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
