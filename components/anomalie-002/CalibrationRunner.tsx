"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnomalieMeta } from "@/anomalies/registry";
import { ASSERTIONS } from "@/anomalies/002-la-calibration/content/assertions";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  slug: string;
  meta: AnomalieMeta;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CalibrationRunner({ slug, meta }: Props) {
  // Ordre randomisé une seule fois côté client.
  const sequence = useMemo(() => shuffle(ASSERTIONS), []);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);

  const current = sequence[idx];
  const correctCount = results.filter(Boolean).length;
  const ratio = sequence.length === 0 ? 0 : correctCount / sequence.length;

  useEffect(() => {
    if (done) {
      const status =
        ratio >= 0.85 ? "resolved" : ratio >= 0.6 ? "partial" : "in_progress";
      fetch("/api/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomalie_slug: slug,
          phase: "verdict",
          score: Math.round(ratio * 100),
          status,
          state_json: JSON.stringify({ sequence: sequence.map((s) => s.id), results }),
        }),
      }).catch(() => {/* */});
      if (ratio >= 0.6) {
        fetch("/api/lore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "frag-002-calibration",
            slug,
            title: "Note de calibration, dossier 002",
            body:
              ratio >= 0.85
                ? "Capteurs alignés sur la couche Inférentielle. Tu sens, par instants, qu'une probabilité ne te raconte pas toute son histoire — comme si la distribution gardait quelque chose pour elle. Note utile : à partir d'un certain seuil, tu n'écoutes plus le modèle, tu écoutes ce qui dévie de lui."
                : "Capteurs imparfaitement alignés. La couche Inférentielle reste lisible mais avec du bruit. L'Interpréteur recommande une nouvelle passe ; pas tout de suite — laissez l'oreille se reposer.",
          }),
        }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function pick(id: string) {
    if (reveal || !current) return;
    setPicked(id);
    const c = current.options.find((o) => o.id === id)?.correct ?? false;
    setReveal(true);
    setResults((r) => [...r, c]);
    setTimeout(() => {
      const next = idx + 1;
      if (next >= sequence.length) {
        setDone(true);
      } else {
        setIdx(next);
        setPicked(null);
        setReveal(false);
      }
    }, 1600);
  }

  return (
    <div
      data-anomalie="002"
      className="min-h-screen relative font-sans"
      style={{
        background:
          "radial-gradient(ellipse at top, #0a1620 0%, #04060c 70%)",
        color: "var(--calib-white)",
      }}
    >
      {/* Grille laser scanning */}
      <CalibrationGrid sweepKey={`${idx}-${reveal}`} />

      {/* Bandeau */}
      <header className="relative z-10 px-6 md:px-12 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--calib-cyan-dim)" }}>
        <div className="text-[0.62rem] tracking-classified font-mono" style={{ color: "var(--calib-cyan)" }}>
          DOSSIER 002 // {meta.title.toUpperCase()} // SCAN ACTIF
        </div>
        <Link
          href="/"
          prefetch={false}
          className="text-[0.62rem] tracking-classified px-3 py-1 border hover:border-[color:var(--calib-cyan)] transition-colors"
          style={{ color: "var(--calib-cyan-dim)", borderColor: "var(--calib-cyan-dim)" }}
        >
          ‹ INTERROMPRE&nbsp;LA&nbsp;CALIBRATION
        </Link>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 py-10">
        {!done ? (
          <>
            <div
              className="flex items-center justify-between mb-6 text-[0.62rem] tracking-classified font-mono"
              style={{ color: "var(--calib-cyan-dim)" }}
            >
              <span>
                ASSERTION {String(idx + 1).padStart(2, "0")} / {String(sequence.length).padStart(2, "0")}
              </span>
              <span>
                CORRESPONDANCE&nbsp;
                <span style={{ color: "var(--calib-cyan)" }}>
                  {correctCount.toString().padStart(2, "0")}/{String(idx + (reveal ? 1 : 0)).padStart(2, "0")}
                </span>
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current?.id ?? idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                <h2
                  className="text-[1.15rem] leading-snug font-sans"
                  style={{ color: "var(--calib-white)" }}
                >
                  {current?.prompt}
                </h2>

                {current?.artefact && (
                  <pre
                    className="font-mono text-[0.85rem] py-2 px-3 inline-block self-start"
                    style={{
                      background: "rgba(94, 234, 212, 0.06)",
                      color: "var(--calib-cyan)",
                      borderInlineStart: "2px solid var(--calib-cyan)",
                    }}
                  >
                    {current.artefact.body}
                  </pre>
                )}

                <ul className="grid grid-cols-1 gap-2 mt-2">
                  {current?.options.map((opt) => {
                    const state = !reveal
                      ? "idle"
                      : opt.correct
                        ? "correct"
                        : opt.id === picked
                          ? "wrong"
                          : "dim";
                    const color: Record<string, string> = {
                      idle: "var(--calib-white)",
                      correct: "#bff7e6",
                      wrong: "#ff8585",
                      dim: "var(--calib-cyan-dim)",
                    };
                    const border: Record<string, string> = {
                      idle: "var(--calib-cyan-dim)",
                      correct: "var(--calib-cyan)",
                      wrong: "#ff8585",
                      dim: "rgba(94, 234, 212, 0.1)",
                    };
                    return (
                      <li key={opt.id}>
                        <button
                          type="button"
                          disabled={reveal}
                          onClick={() => pick(opt.id)}
                          className="w-full text-left flex gap-4 px-4 py-3 transition-colors hover:border-[color:var(--calib-cyan)]"
                          style={{
                            border: `1px solid ${border[state]}`,
                            color: color[state],
                            background:
                              state === "correct"
                                ? "rgba(94, 234, 212, 0.06)"
                                : state === "wrong"
                                  ? "rgba(255, 133, 133, 0.06)"
                                  : "transparent",
                          }}
                        >
                          <span
                            className="font-mono text-[0.78rem] tracking-classified shrink-0"
                            style={{ color: border[state] }}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {reveal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-[0.85rem] mt-2"
                    style={{ color: "var(--calib-cyan-dim)" }}
                  >
                    <span
                      className="block text-[0.6rem] tracking-classified font-mono mb-1"
                      style={{ color: "var(--calib-cyan)" }}
                    >
                      ANNOTATION
                    </span>
                    {current?.rationale}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h2
              className="text-[1.6rem] tracking-classified font-mono"
              style={{ color: "var(--calib-cyan)" }}
            >
              CALIBRATION TERMINÉE
            </h2>
            <div
              className="flex flex-col gap-1 text-[0.85rem] tabular-nums"
              style={{ color: "var(--calib-white)" }}
            >
              <div>Score brut : {correctCount} / {sequence.length}</div>
              <div>
                Index de correspondance :{" "}
                <span style={{ color: "var(--calib-cyan)" }}>
                  {(ratio * 100).toFixed(1)} %
                </span>
              </div>
              <div className="text-[0.7rem] tracking-classified mt-3" style={{ color: "var(--calib-cyan-dim)" }}>
                {ratio >= 0.85
                  ? "ALIGNEMENT VALIDÉ"
                  : ratio >= 0.6
                    ? "ALIGNEMENT PARTIEL"
                    : "À RÉPÉTER"}
              </div>
            </div>

            <Bars sequence={sequence.map((s) => s.id)} results={results} />

            <p
              className="text-[0.92rem] leading-relaxed mt-4"
              style={{ color: "var(--calib-cyan-dim)" }}
            >
              {ratio >= 0.85
                ? "Capteurs alignés. La couche Inférentielle vous est lisible. Vous pouvez vous présenter à l'examen avec un appui solide ; restez attentif aux distributions déséquilibrées et aux pièges de fuite de données."
                : ratio >= 0.6
                  ? "Lecture acceptable mais bruitée. Plusieurs concepts demandent une seconde passe — ils sont cités dans l'annotation de chaque assertion. Une calibration de retouche, demain au réveil, est recommandée."
                  : "Désalignement significatif. Reprenez le module — pas par discipline, mais parce que vos sens sont actuellement défavorables à la prochaine intervention."}
            </p>

            <div className="flex gap-3 mt-3">
              <Link
                href="/"
                prefetch={false}
                className="px-4 py-2 border text-[0.7rem] tracking-classified hover:border-[color:var(--calib-cyan)] transition-colors"
                style={{ color: "var(--calib-cyan)", borderColor: "var(--calib-cyan-dim)" }}
              >
                RETOUR&nbsp;TERMINAL
              </Link>
              <button
                type="button"
                onClick={() => location.reload()}
                className="px-4 py-2 border text-[0.7rem] tracking-classified hover:border-[color:var(--calib-cyan)] transition-colors"
                style={{ color: "var(--calib-cyan-dim)", borderColor: "var(--calib-cyan-dim)" }}
              >
                RECALIBRER
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Bars({ sequence, results }: { sequence: string[]; results: boolean[] }) {
  return (
    <div className="flex gap-[2px]">
      {sequence.map((id, i) => (
        <div
          key={id}
          className="flex-1 h-3"
          style={{
            background:
              i >= results.length
                ? "rgba(94, 234, 212, 0.06)"
                : results[i]
                  ? "var(--calib-cyan)"
                  : "rgba(255, 133, 133, 0.5)",
          }}
        />
      ))}
    </div>
  );
}

function CalibrationGrid({ sweepKey }: { sweepKey: string }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(94, 234, 212, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(94, 234, 212, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />
      <motion.div
        key={sweepKey}
        aria-hidden="true"
        initial={{ y: "-12%" }}
        animate={{ y: "120%" }}
        transition={{ duration: 1.4, ease: [0.7, 0, 0.84, 0] }}
        className="fixed inset-x-0 z-0 pointer-events-none h-12"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(94, 234, 212, 0.18) 50%, transparent 100%)",
          filter: "blur(2px)",
        }}
      />
    </>
  );
}
