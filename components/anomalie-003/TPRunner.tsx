"use client";

import Link from "next/link";
import type { TPContent } from "@/anomalies/003-le-noyau-fracture/content/cell-types";
import type { TPMeta } from "@/anomalies/003-le-noyau-fracture/content/tp-index";
import { KernelProvider, useKernel } from "./kernel-store";
import { KernelMonitor } from "./KernelMonitor";
import { KernelOutput } from "./KernelOutput";
import { KernelAlerts } from "./KernelAlerts";
import { CellView } from "./CellView";

type Props = {
  slug: string;
  tpMeta: TPMeta;
  content: TPContent;
};

export function TPRunner({ slug, tpMeta, content }: Props) {
  return (
    <KernelProvider>
      <KernelMonitor tpLabel={tpMeta.code} />
      <KernelAlerts />
      <Body slug={slug} tpMeta={tpMeta} content={content} />
    </KernelProvider>
  );
}

function Body({ slug, tpMeta, content }: Props) {
  const { state } = useKernel();
  const completedCount = state.cellsCompleted.size;
  const cellCount = content.cells.length;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "1.5rem clamp(1rem, 5vw, 3rem) 4rem",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <Link
        href={`/anomalie/${slug}`}
        prefetch={false}
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--allocataire-ink-faint)",
          textDecoration: "none",
        }}
      >
        ← carte des actes
      </Link>

      {/* Titre acte */}
      <header style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <div
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--allocataire-kernel-dim)",
          }}
        >
          {tpMeta.code}
        </div>
        <h1
          style={{
            margin: "0.3rem 0",
            fontSize: "clamp(2rem, 4vw, 3.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.01em",
            color: "var(--allocataire-ink)",
          }}
        >
          {tpMeta.title}
        </h1>
        <div
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--allocataire-syscall)",
          }}
        >
          {tpMeta.topic}
        </div>
        <p
          style={{
            margin: "0.8rem 0 0",
            maxWidth: "70ch",
            fontSize: "0.85rem",
            lineHeight: 1.55,
            color: "var(--allocataire-ink-dim)",
          }}
        >
          {tpMeta.summary}
        </p>

        {/* Progress */}
        <div
          style={{
            marginTop: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            fontSize: "0.65rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--allocataire-ink-faint)",
          }}
        >
          <span>progression</span>
          <ProgressBar done={completedCount} total={cellCount} />
          <span style={{ color: "var(--allocataire-kernel)" }}>
            {completedCount} / {cellCount}
          </span>
          <Link
            href={`/anomalie/${slug}/${tpMeta.slug}/rendu`}
            prefetch={false}
            className="btn-kernel"
            style={{ marginLeft: "auto", textDecoration: "none" }}
          >
            chambre du rendu →
          </Link>
        </div>
      </header>

      {/* Cellules */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {content.cells.map((c) => (
          <CellView key={c.id} cell={c} total={cellCount} />
        ))}
      </section>

      {/* Pied de page : rendu */}
      <footer
        style={{
          marginTop: "2.5rem",
          padding: "1.2rem 1.2rem",
          border: "1px dashed var(--allocataire-kernel-dim)",
          background: "rgba(157, 255, 209, 0.03)",
        }}
      >
        <div
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--allocataire-kernel-dim)",
          }}
        >
          ▸ FIN D&apos;ACTE
        </div>
        <p
          style={{
            margin: "0.4rem 0 0.8rem",
            fontSize: "0.8rem",
            lineHeight: 1.55,
            color: "var(--allocataire-ink)",
          }}
        >
          {completedCount === cellCount
            ? "Toutes les cellules sont scellées. Le noyau est calibré sur cette couche. Passe à la Chambre du rendu pour composer le fichier final."
            : "Quand toutes les cellules seront scellées, ouvre la Chambre du rendu pour télécharger le code final."}
        </p>
        <Link
          href={`/anomalie/${slug}/${tpMeta.slug}/rendu`}
          prefetch={false}
          className="btn-kernel"
          data-variant="syscall"
          style={{ textDecoration: "none" }}
        >
          ouvrir la chambre du rendu
        </Link>
      </footer>

      {/* Dmesg en bas */}
      <section style={{ marginTop: "2rem" }}>
        <KernelOutput />
      </section>
    </main>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div
      style={{
        width: 200,
        height: 6,
        background: "rgba(157, 255, 209, 0.08)",
        border: "1px solid var(--allocataire-rule)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "var(--allocataire-kernel)",
          transition: "width 480ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}
