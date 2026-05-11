"use client";

/**
 * Entry-point client qui charge dynamiquement <BubbleSceneClient> avec ssr:false.
 *
 * Pourquoi ce wrapper : Next.js 16 (App Router) interdit
 * `dynamic({ ssr: false })` dans un Server Component. La page
 * `/prototype-r3f` reste Server (pour le `export const metadata`), et délègue
 * à ce composant côté client le chargement lazy de la scène Three.js.
 */

import dynamic from "next/dynamic";

const BubbleSceneClient = dynamic(
  () => import("./BubbleSceneClient"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#020306",
          color: "rgba(180, 195, 215, 0.6)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Chargement scène…
      </div>
    ),
  },
);

export default function BubbleSceneEntry() {
  return <BubbleSceneClient />;
}
