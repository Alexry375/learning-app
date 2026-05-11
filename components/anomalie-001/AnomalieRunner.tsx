"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnomalieMeta } from "@/anomalies/registry";
import type { AnomalieContent, Phase } from "@/anomalies/001-le-compilateur-hante/types";
import { PHASE_ORDER } from "@/anomalies/001-le-compilateur-hante/types";
import { Briefing } from "./Briefing";
import { Interrogatoires } from "./Interrogatoires";
import { StackTracePhase } from "./StackTracePhase";
import { UMLPhase } from "./UMLPhase";
import { CodeArenaPhase } from "./CodeArenaPhase";
import { Verdict } from "./Verdict";
import { StampRitual } from "./StampRitual";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  slug: string;
  meta: AnomalieMeta;
  content: AnomalieContent;
  initialPhase: string;
};

const VALID = new Set(PHASE_ORDER as readonly string[]);

export function AnomalieRunner({ slug, meta, content, initialPhase }: Props) {
  const [phase, setPhase] = useState<Phase>(
    (VALID.has(initialPhase) ? initialPhase : "briefing") as Phase,
  );
  const [score, setScore] = useState(0);
  const [ritual, setRitual] = useState<{ key: string; label: string } | null>(
    null,
  );
  const stateRef = useRef<Record<string, unknown>>({});

  // Persistance
  const persist = useCallback(
    (next: { phase?: Phase; score?: number; status?: string; state?: unknown }) => {
      const body = {
        anomalie_slug: slug,
        phase: next.phase ?? phase,
        score: next.score ?? score,
        status: next.status ?? "in_progress",
        state_json: JSON.stringify(next.state ?? stateRef.current),
      };
      fetch("/api/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {/* best-effort */});
    },
    [phase, score, slug],
  );

  useEffect(() => {
    // marquer in_progress dès l'ouverture
    persist({ phase, status: "in_progress" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextPhase() {
    if (ritual) return; // guard contre double-clic pendant la transition
    const idx = PHASE_ORDER.indexOf(phase);
    const next = PHASE_ORDER[idx + 1] ?? phase;
    if (next === phase) return;
    const ritualLabel: Record<Phase, string> = {
      briefing: "DOSSIER OUVERT",
      interrogatoires: "AUDITIONS CONSIGNÉES",
      "stack-trace": "PIÈCE À CONVICTION INTÉGRÉE",
      uml: "SCHÉMA RECONSTITUÉ",
      code: "AUDIT DE CODE BOUCLÉ",
      verdict: "VERDICT EN ATTENTE",
    };
    setRitual({ key: `${phase}->${next}`, label: ritualLabel[phase] });
    setTimeout(() => {
      setPhase(next as Phase);
      setRitual(null);
      persist({ phase: next as Phase });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1100);
  }

  function award(points: number, key: string) {
    setScore((s) => {
      const next = s + points;
      stateRef.current[key] = (stateRef.current[key] as number ?? 0) + points;
      persist({ score: next });
      return next;
    });
  }

  function onResolve(full: boolean) {
    persist({
      phase: "verdict",
      status: full ? "resolved" : "partial",
      score,
    });
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          "linear-gradient(180deg, var(--paper) 0%, var(--paper-light) 100%)",
        color: "var(--ink-paper)",
      }}
    >
      {/* Bandeau dossier */}
      <header
        className="px-6 md:px-12 py-4 flex items-center justify-between"
        style={{
          borderBottom: "1px solid var(--amber-deep)",
          color: "var(--amber)",
        }}
      >
        <div className="text-[0.62rem] tracking-classified font-mono">
          {content.briefing.classification}
        </div>
        <div className="text-[0.62rem] tracking-classified font-mono">
          {content.briefing.fileNumber}
        </div>
      </header>

      <PhaseRail phase={phase} />

      <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.section
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {phase === "briefing" && (
              <Briefing content={content.briefing} onContinue={nextPhase} />
            )}
            {phase === "interrogatoires" && (
              <Interrogatoires
                interrogatoires={content.interrogatoires}
                onAward={(p) => award(p, "interrogatoires")}
                onContinue={nextPhase}
              />
            )}
            {phase === "stack-trace" && (
              <StackTracePhase
                content={content.stackTrace}
                onAward={(p) => award(p, "stack-trace")}
                onContinue={nextPhase}
              />
            )}
            {phase === "uml" && (
              <UMLPhase
                content={content.uml}
                onAward={(p) => award(p, "uml")}
                onContinue={nextPhase}
              />
            )}
            {phase === "code" && (
              <CodeArenaPhase
                content={content.codeArena}
                onAward={(p) => award(p, "code")}
                onContinue={nextPhase}
              />
            )}
            {phase === "verdict" && (
              <Verdict
                content={content.verdict}
                slug={slug}
                anomalieTitle={meta.title}
                score={score}
                onResolve={onResolve}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {ritual && <StampRitual label={ritual.label} keyId={ritual.key} />}
    </div>
  );
}

function PhaseRail({ phase }: { phase: Phase }) {
  return (
    <ol
      className="px-6 md:px-12 py-3 flex items-center gap-4 text-[0.6rem] tracking-classified font-mono overflow-x-auto"
      style={{
        color: "var(--ink-paper-dim)",
        borderBottom: "1px solid rgba(212, 165, 72, 0.18)",
      }}
    >
      {PHASE_ORDER.map((p, i) => {
        const idx = PHASE_ORDER.indexOf(phase);
        const state = i < idx ? "done" : i === idx ? "current" : "pending";
        return (
          <li
            key={p}
            className="flex items-center gap-2 shrink-0"
            style={{
              color:
                state === "current"
                  ? "var(--amber)"
                  : state === "done"
                    ? "var(--seal)"
                    : "var(--ink-paper-dim)",
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span>·</span>
            <span>{LABEL[p]}</span>
            {i < PHASE_ORDER.length - 1 && (
              <span style={{ opacity: 0.4, marginInlineStart: "0.5rem" }}>
                ──
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const LABEL: Record<Phase, string> = {
  briefing: "BRIEFING",
  interrogatoires: "INTERROGATOIRES",
  "stack-trace": "PIÈCE À CONVICTION",
  uml: "RECONSTITUTION",
  code: "CONFRONTATION",
  verdict: "VERDICT",
};
