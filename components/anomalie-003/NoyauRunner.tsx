"use client";

import Link from "next/link";
import type { AnomalieMeta } from "@/anomalies/registry";
import { TPS } from "@/anomalies/003-le-noyau-fracture/content/tp-index";

type Props = {
  slug: string;
  meta: AnomalieMeta;
};

export function NoyauRunner({ slug, meta }: Props) {
  return (
    <div
      data-anomalie="003"
      className="min-h-screen px-8 py-12 md:px-16 md:py-20"
      style={{ color: "var(--ink-dim)" }}
    >
      {/* En-tête */}
      <header className="mb-12 max-w-4xl">
        <Link
          href="/"
          className="text-[0.65rem] tracking-classified opacity-60 hover:opacity-100"
          style={{ color: "var(--ink-faint)" }}
        >
          ← retour au hub
        </Link>
        <div
          className="mt-6 text-[0.6rem] tracking-classified"
          style={{ color: "var(--ink-faint)" }}
        >
          DOSSIER {meta.code} · COUCHE {meta.layer.toUpperCase()} · {meta.domain.toUpperCase()}
        </div>
        <h1
          className="mt-2 text-3xl md:text-5xl font-extralight tracking-tight"
          style={{ color: "var(--ink-bright)" }}
        >
          {meta.title}
        </h1>
        <p
          className="mt-4 text-sm leading-relaxed max-w-2xl"
          style={{ color: "var(--ink-dim)" }}
        >
          {meta.symptom}
        </p>
      </header>

      {/* Liste des TP */}
      <section className="max-w-4xl">
        <h2
          className="text-[0.7rem] tracking-classified mb-4"
          style={{ color: "var(--ink-faint)" }}
        >
          / SÉQUENCES D&apos;INTERVENTION
        </h2>

        {TPS.length === 0 ? (
          <div
            className="border border-dashed p-8 text-sm leading-relaxed"
            style={{
              borderColor: "var(--ink-faint)",
              color: "var(--ink-dim)",
            }}
          >
            <div className="opacity-60 text-[0.65rem] tracking-classified mb-3">
              ÉTAT : ATTENTE DE DÉPÔT
            </div>
            <p>
              Aucune séquence d&apos;intervention déposée pour l&apos;instant.
              Le module est ouvert mais inerte.
            </p>
            <p className="mt-3 opacity-70">
              Dès qu&apos;un énoncé de TP est apporté, il apparaîtra ici
              comme séquence exécutable (interactive sur la webapp,
              puis exportable pour rendu Moodle).
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {TPS.map((tp) => (
              <li
                key={tp.id}
                className="border p-5 hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--ink-faint)" }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span
                    className="text-[0.65rem] tracking-classified"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {tp.code}
                  </span>
                  <span
                    className="text-[0.6rem] tracking-classified uppercase opacity-60"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {tp.status}
                  </span>
                </div>
                <div
                  className="text-base font-light"
                  style={{ color: "var(--ink-bright)" }}
                >
                  {tp.title}
                </div>
                <div
                  className="mt-1 text-xs opacity-70"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {tp.topic}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer / méta */}
      <footer
        className="mt-16 text-[0.6rem] tracking-classified opacity-50"
        style={{ color: "var(--ink-faint)" }}
      >
        SLUG: {slug} · FENÊTRE: {meta.window} · URGENCE: {meta.urgency}
      </footer>
    </div>
  );
}
