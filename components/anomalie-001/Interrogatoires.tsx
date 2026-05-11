"use client";

import { useMemo, useState } from "react";
import type {
  Interrogatoire,
  ConceptId,
} from "@/anomalies/001-le-compilateur-hante/types";
import { QuestionPanel } from "./QuestionPanel";
import { RichText } from "./RichText";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  interrogatoires: Interrogatoire[];
  onAward: (points: number) => void;
  onContinue: () => void;
};

type State = {
  // map<conceptId, roundIndex courant>
  progress: Record<string, number>;
  // map<conceptId, nb réponses correctes>
  correct: Record<string, number>;
  // map<conceptId, score>
  scores: Record<string, number>;
  rewards: string[]; // conceptIds dont la récompense a été délivrée
};

const PRIO: ConceptId[] = ["collections", "swing", "polymorphisme"];

export function Interrogatoires({
  interrogatoires,
  onAward,
  onContinue,
}: Props) {
  const [active, setActive] = useState<ConceptId | null>(null);
  const [state, setState] = useState<State>({
    progress: {},
    correct: {},
    scores: {},
    rewards: [],
  });

  const totalRounds = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of interrogatoires) m[it.conceptId] = it.rounds.length;
    return m;
  }, [interrogatoires]);

  /** Un interrogatoire est "complété" si tous les rounds sont passés ET
   *  que le ratio de bonnes réponses est ≥ 60 % (pas de shotgun random). */
  const completed = useMemo(() => {
    const set = new Set<string>();
    for (const id of Object.keys(totalRounds)) {
      const total = totalRounds[id];
      const seen = state.progress[id] ?? 0;
      const ok = state.correct[id] ?? 0;
      if (seen >= total && ok / total >= 0.6) set.add(id);
    }
    return set;
  }, [state.progress, state.correct, totalRounds]);

  const canAdvance =
    PRIO.every((p) => completed.has(p)) && completed.size >= 4;

  /** Étape 1 : appelée au moment du pick. Comptabilise points + bonnes
   *  réponses, mais NE FAIT PAS avancer le round. L'utilisateur lit la
   *  correction puis clique "CONTINUER" → advance(). */
  function award(conceptId: ConceptId, correct: boolean) {
    const points = correct ? 10 : 2;
    onAward(points);
    setState((s) => ({
      ...s,
      correct: {
        ...s.correct,
        [conceptId]: (s.correct[conceptId] ?? 0) + (correct ? 1 : 0),
      },
      scores: {
        ...s.scores,
        [conceptId]: (s.scores[conceptId] ?? 0) + points,
      },
    }));
  }

  /** Étape 2 : avance d'un round. Délivre la reward si on vient de finir
   *  l'interrogatoire avec un ratio ≥ 60 %. */
  function advance(conceptId: ConceptId) {
    const it = interrogatoires.find((x) => x.conceptId === conceptId)!;
    setState((s) => {
      const idx = s.progress[conceptId] ?? 0;
      const nextProgress = { ...s.progress, [conceptId]: idx + 1 };
      const nextRewards = [...s.rewards];
      if (idx + 1 >= it.rounds.length && !s.rewards.includes(conceptId)) {
        const ratio = (s.correct[conceptId] ?? 0) / it.rounds.length;
        if (ratio >= 0.6) nextRewards.push(conceptId);
      }
      return { ...s, progress: nextProgress, rewards: nextRewards };
    });
  }

  if (active) {
    const it = interrogatoires.find((x) => x.conceptId === active);
    if (!it) {
      setActive(null);
      return null;
    }
    const idx = state.progress[active] ?? 0;
    const round = it.rounds[idx];
    const isDone = idx >= it.rounds.length;
    const isRewarded = state.rewards.includes(active);
    const correctCount = state.correct[active] ?? 0;
    const ratio = it.rounds.length > 0 ? correctCount / it.rounds.length : 0;

    function retry() {
      setState((s) => ({
        ...s,
        progress: { ...s.progress, [active!]: 0 },
        correct: { ...s.correct, [active!]: 0 },
      }));
    }

    return (
      <article className="narrative">
        <header className="mb-6">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="text-[0.62rem] tracking-classified font-mono mb-3 hover:text-[color:var(--amber)] transition-colors"
            style={{ color: "var(--ink-paper-dim)" }}
          >
            ‹ RETOUR&nbsp;AUX&nbsp;SUSPECTS
          </button>
          <h2 className="font-mono text-[1rem] tracking-classified" style={{ color: "var(--amber)" }}>
            {it.persona.title}
          </h2>
          <p className="font-serif text-[1rem] leading-relaxed mt-2" style={{ color: "var(--ink-paper)" }}>
            <RichText>{it.persona.description}</RichText>
          </p>
          <blockquote
            className="font-serif italic text-[0.92rem] mt-3 pl-4 border-l-2"
            style={{ color: "var(--ink-paper-dim)", borderColor: "var(--amber)" }}
          >
            <RichText>{it.persona.quote}</RichText>
          </blockquote>
        </header>

        {it.subPersonas && (
          <ul
            className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-[0.78rem] font-serif"
            style={{ color: "var(--ink-paper-dim)" }}
          >
            {it.subPersonas.map((sp) => (
              <li
                key={sp.subConceptId}
                className="border px-3 py-2"
                style={{ borderColor: "rgba(212,165,72,0.18)" }}
              >
                <div
                  className="text-[0.6rem] tracking-classified font-mono mb-1"
                  style={{ color: "var(--amber)" }}
                >
                  {sp.title}
                </div>
                <span className="italic"><RichText>{sp.teaser}</RichText></span>
              </li>
            ))}
          </ul>
        )}

        <AnimatePresence mode="wait">
          {!isDone ? (
            <motion.div
              key={`round-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <p
                className="font-serif italic text-[0.95rem] leading-relaxed mb-5"
                style={{ color: "var(--ink-paper-dim)" }}
              >
                <RichText>{round.setup}</RichText>
              </p>
              <QuestionPanel
                question={round.question}
                onAnswered={(c) => award(active, c)}
                onContinue={() => advance(active)}
              />
              <div className="text-right mt-6 text-[0.62rem] tracking-classified font-mono" style={{ color: "var(--ink-paper-dim)" }}>
                Tour {idx + 1} / {it.rounds.length}
              </div>
            </motion.div>
          ) : isRewarded ? (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4"
            >
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
                  FRAGMENT D&apos;ENQUÊTE — {it.reward.title.toUpperCase()}
                </div>
                <p
                  className="font-serif text-[1rem] leading-relaxed"
                  style={{ color: "var(--ink-paper)" }}
                >
                  <RichText>{it.reward.body}</RichText>
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-int"
                  onClick={() => setActive(null)}
                >
                  CONSIGNER LE FRAGMENT
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="incomplete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4"
            >
              <div
                className="border px-5 py-4"
                style={{
                  borderColor: "rgba(184, 169, 138, 0.4)",
                  background: "rgba(7, 4, 2, 0.4)",
                }}
              >
                <div
                  className="text-[0.62rem] tracking-classified font-mono mb-2"
                  style={{ color: "var(--seal)" }}
                >
                  AUDITION INCOMPLÈTE — RATIO {Math.round(ratio * 100)}&nbsp;%
                </div>
                <p
                  className="font-serif text-[1rem] leading-relaxed"
                  style={{ color: "var(--ink-paper)" }}
                >
                  Le suspect s&apos;est tu. Vous l&apos;avez interrogé jusqu&apos;au
                  bout, mais sans collecter assez de fragments cohérents — il faut
                  60&nbsp;% de bonnes réponses pour qu&apos;il consigne. Reprenez
                  l&apos;audition. La répétition est, ici, une vertu.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="btn-int" onClick={retry}>
                  RÉINTERROGER
                </button>
                <button
                  type="button"
                  className="btn-int"
                  data-variant="classified"
                  onClick={() => setActive(null)}
                >
                  REPORTER L&apos;AUDITION
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }

  return (
    <article>
      <header className="mb-6">
        <h2
          className="font-mono text-[0.78rem] tracking-classified"
          style={{ color: "var(--amber)" }}
        >
          AUDITIONS — SIX SUSPECTS RETENUS
        </h2>
        <p
          className="font-serif text-[1rem] leading-relaxed mt-3 max-w-prose"
          style={{ color: "var(--ink-paper)" }}
        >
          Vous procédez dans l&apos;ordre que vous voulez. L&apos;Interpréteur
          consigne. Trois pistes sont prioritaires&nbsp;: <em>Bibliothécaire</em>,{" "}
          <em>Horloger</em>, <em>Caméléon</em>. Les autres ne pourront pas être
          ignorés indéfiniment.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {interrogatoires.map((it) => {
          const rewarded = completed.has(it.conceptId);
          const isPrio = (PRIO as readonly string[]).includes(it.conceptId);
          const idx = state.progress[it.conceptId] ?? 0;
          const finishedNoReward =
            !rewarded && idx >= it.rounds.length;
          const labelColor = rewarded
            ? "#a5f0a5"
            : finishedNoReward
              ? "var(--seal)"
              : "var(--amber)";
          return (
            <li key={it.conceptId}>
              <button
                type="button"
                onClick={() => setActive(it.conceptId)}
                className="w-full text-left px-4 py-4 border transition-colors hover:border-[color:var(--amber)]"
                style={{
                  borderColor: rewarded
                    ? "rgba(122,223,138,0.4)"
                    : finishedNoReward
                      ? "rgba(184, 169, 138, 0.4)"
                      : isPrio
                        ? "rgba(212,165,72,0.5)"
                        : "rgba(212,165,72,0.18)",
                  background: rewarded ? "rgba(122,223,138,0.05)" : "transparent",
                }}
              >
                <div
                  className="text-[0.62rem] tracking-classified font-mono flex items-center justify-between mb-1"
                  style={{ color: labelColor }}
                >
                  <span>{it.persona.title}</span>
                  <span style={{ color: "var(--ink-paper-dim)" }}>
                    {rewarded
                      ? "AUDITIONNÉ"
                      : finishedNoReward
                        ? "À RETENTER"
                        : `${idx}/${it.rounds.length}`}
                  </span>
                </div>
                <p
                  className="font-serif italic text-[0.9rem]"
                  style={{ color: "var(--ink-paper-dim)" }}
                >
                  <RichText>{it.persona.quote}</RichText>
                </p>
                {isPrio && !rewarded && (
                  <span
                    className="inline-block mt-2 text-[0.6rem] tracking-classified font-mono"
                    style={{ color: "var(--amber)" }}
                  >
                    PRIORITÉ
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex items-center justify-between">
        <p
          className="text-[0.78rem] font-serif italic"
          style={{ color: "var(--ink-paper-dim)" }}
        >
          {canAdvance
            ? "Suffisamment de fragments collectés. Vous pouvez sceller la phase."
            : "Avancez dans les auditions prioritaires avant de passer à la pièce à conviction."}
        </p>
        <button
          type="button"
          className="btn-int"
          onClick={onContinue}
          disabled={!canAdvance}
          style={{ opacity: canAdvance ? 1 : 0.45 }}
        >
          PIÈCE À CONVICTION
        </button>
      </div>
    </article>
  );
}
