"use client";

import { useState } from "react";
import type { StackTraceContent } from "@/anomalies/001-le-compilateur-hante/types";
import { QuestionPanel } from "./QuestionPanel";

type Props = {
  content: StackTraceContent;
  onAward: (points: number) => void;
  onContinue: () => void;
};

export function StackTracePhase({ content, onAward, onContinue }: Props) {
  const [answered, setAnswered] = useState(false);

  return (
    <article className="narrative">
      <header className="mb-6">
        <h2
          className="font-mono text-[0.78rem] tracking-classified mb-3"
          style={{ color: "var(--amber)" }}
        >
          PIÈCE À CONVICTION — STACK TRACE
        </h2>
        <p
          className="font-serif italic text-[1rem] leading-relaxed"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {content.setup}
        </p>
      </header>

      <pre
        className="font-mono text-[0.78rem] whitespace-pre overflow-x-auto mb-8"
        style={{
          background: "rgba(7, 4, 2, 0.7)",
          color: "var(--amber)",
          padding: "1rem 1.2rem",
          borderInlineStart: "2px solid var(--rust)",
          borderBlockStart: "1px solid var(--amber-deep)",
          borderBlockEnd: "1px solid var(--amber-deep)",
        }}
      >
        {content.trace}
      </pre>

      <QuestionPanel
        question={content.question}
        onAnswered={(c) => {
          setAnswered(true);
          onAward(c ? 20 : 5);
        }}
      />

      {answered && (
        <div className="mt-10">
          <p
            className="font-serif italic text-[0.95rem] leading-relaxed mb-6"
            style={{ color: "var(--ink-paper-dim)" }}
          >
            {content.postlude}
          </p>
          <div className="flex justify-end">
            <button type="button" className="btn-int" onClick={onContinue}>
              RECONSTITUTION UML
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
