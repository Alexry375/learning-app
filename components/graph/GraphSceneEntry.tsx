"use client";

import dynamic from "next/dynamic";

const GraphSceneClient = dynamic(() => import("./GraphSceneClient"), {
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
      Chargement graphe…
    </div>
  ),
});

export default function GraphSceneEntry() {
  return <GraphSceneClient />;
}
