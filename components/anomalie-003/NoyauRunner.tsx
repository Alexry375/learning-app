"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnomalieMeta } from "@/anomalies/registry";
import { TPS } from "@/anomalies/003-le-noyau-fracture/content/tp-index";
import { KernelProvider } from "./kernel-store";
import { KernelMonitor } from "./KernelMonitor";
import { KernelOutput } from "./KernelOutput";
import { KernelAlerts } from "./KernelAlerts";
import { KernelBoot } from "./KernelBoot";

type Props = {
  slug: string;
  meta: AnomalieMeta;
};

export function NoyauRunner({ slug, meta }: Props) {
  return (
    <KernelProvider>
      <NoyauRunnerInner slug={slug} meta={meta} />
    </KernelProvider>
  );
}

function NoyauRunnerInner({ slug, meta }: Props) {
  const [bootDone, setBootDone] = useState(false);
  return (
    <>
      <KernelMonitor tpLabel="INDEX" />
      <KernelAlerts />
      <main
        style={{
          minHeight: "100vh",
          padding: "2rem clamp(1rem, 5vw, 4rem) 4rem",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* En-tête diégétique */}
        <header style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--allocataire-ink-faint)",
            }}
          >
            DOSSIER {meta.code} · COUCHE {meta.layer.toUpperCase()} · {meta.domain.toUpperCase()}
          </div>
          <h1
            style={{
              margin: "0.5rem 0 0",
              fontSize: "clamp(2rem, 4vw, 3.4rem)",
              fontWeight: 300,
              letterSpacing: "-0.01em",
              color: "var(--allocataire-ink)",
            }}
          >
            {meta.title}
          </h1>
          <p
            style={{
              maxWidth: "65ch",
              marginTop: "0.8rem",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "var(--allocataire-ink-dim)",
            }}
          >
            {meta.symptom}
          </p>
        </header>

        {/* Boot kernel ASCII */}
        <section
          style={{
            marginBottom: "2.5rem",
            padding: "0.5rem 1rem",
            border: "1px solid var(--allocataire-rule)",
            background: "rgba(11, 15, 36, 0.55)",
          }}
        >
          <div
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--allocataire-ink-faint)",
              marginBottom: "0.3rem",
            }}
          >
            ▸ KERNEL BOOT SEQUENCE
          </div>
          <KernelBoot onDone={() => setBootDone(true)} skip={bootDone} />
        </section>

        {/* Carte des actes */}
        <section>
          <h2
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--allocataire-ink-faint)",
              marginBottom: "1rem",
            }}
          >
            / SÉQUENCES D&apos;INTERVENTION
          </h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {TPS.map((tp) => (
              <li key={tp.id}>
                <Link
                  href={`/anomalie/${slug}/${tp.slug}`}
                  prefetch={false}
                  style={{
                    display: "block",
                    padding: "1.2rem",
                    border: "1px solid var(--allocataire-rule)",
                    background: "rgba(11, 15, 36, 0.55)",
                    color: "var(--allocataire-ink-dim)",
                    textDecoration: "none",
                    transition:
                      "border-color 320ms cubic-bezier(0.16, 1, 0.3, 1), background 320ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  className="acte-card"
                >
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--allocataire-kernel-dim)",
                      marginBottom: "0.3rem",
                    }}
                  >
                    {tp.code} · {tp.status.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 300,
                      letterSpacing: "-0.01em",
                      color: "var(--allocataire-ink)",
                      marginBottom: "0.3rem",
                    }}
                  >
                    {tp.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--allocataire-syscall)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {tp.topic}
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: 1.55,
                      color: "var(--allocataire-ink-dim)",
                      margin: 0,
                    }}
                  >
                    {tp.summary}
                  </p>
                  <div
                    style={{
                      marginTop: "0.8rem",
                      fontSize: "0.55rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--allocataire-kernel)",
                    }}
                  >
                    {tp.cellCount} cellules · entrer →
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: "3rem",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--allocataire-ink-faint)",
          }}
        >
          SLUG: {slug} · FENÊTRE: {meta.window} · URGENCE: {meta.urgency}
        </footer>

        {/* Dmesg */}
        <section style={{ marginTop: "2rem" }}>
          <KernelOutput />
        </section>
      </main>
      <style jsx>{`
        :global(.acte-card:hover) {
          border-color: var(--allocataire-kernel) !important;
          background: rgba(19, 24, 56, 0.85) !important;
        }
      `}</style>
    </>
  );
}
