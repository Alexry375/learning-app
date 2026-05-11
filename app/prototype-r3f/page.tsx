/**
 * /prototype-r3f
 *
 * Banc d'essai du port R3F du wobble transmission (proto 04).
 * Sert à valider que la stack R3F v9 + drei + postprocessing + Three r170
 * fonctionne sous Next.js 16 + React 19 + Turbopack — avant d'attaquer
 * l'intégration avec r3f-forcegraph.
 *
 * Three.js touche window/Canvas → BubbleSceneClient est dynamiquement chargé
 * avec ssr:false pour éviter toute exécution serveur.
 */

import BubbleSceneEntry from "@/components/bubble/BubbleSceneEntry";

export const metadata = {
  title: "Prototype R3F · bulle wobble transmission",
};

export default function PrototypeR3FPage() {
  return <BubbleSceneEntry />;
}
