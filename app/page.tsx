/**
 * /  (home)
 *
 * Interface principale de navigation entre les anomalies, vue comme un
 * graphe 3D de bulles wobble-transmission.
 *
 * Le rendu est intégralement client-side (Three.js + r3f-forcegraph), donc
 * la page Server Component délègue à un wrapper qui dynamic-import la scène
 * avec ssr:false.
 */

import GraphSceneEntry from "@/components/graph/GraphSceneEntry";

export const metadata = {
  title: "Graphe · L'Interpréteur",
};

export default function HomePage() {
  return <GraphSceneEntry />;
}
