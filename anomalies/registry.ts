/**
 * Registry des Anomalies. Source de vérité pour le hub
 * (dossiers actifs, ordre, méta de présentation).
 */

export type AnomalieStatus = "open" | "in_progress" | "resolved" | "partial";
export type Urgency = "imminent" | "élevée" | "modérée" | "stable";

export type AnomalieMeta = {
  slug: string;
  /** Numéro affiché : "001", "002"… */
  code: string;
  /** Titre diégétique. */
  title: string;
  /** Couche du substrat correspondant au domaine académique. */
  layer: string;
  /** Ce qui paraît à l'œil nu (sub-line révélée au hover). */
  symptom: string;
  /** Window d'opportunité (texte stylisé). */
  window: string;
  urgency: Urgency;
  /** Tag domaine académique (sec, classifié). */
  domain: string;
  /** Index pour l'ordre d'affichage. */
  order: number;
};

export const ANOMALIES: AnomalieMeta[] = [
  {
    slug: "001-le-compilateur-hante",
    code: "001",
    title: "Le Compilateur Hanté",
    layer: "Objet",
    symptom:
      "Système Java vintage refuse de compiler depuis six mois. Sa sortie continue à influencer la couche Objet du substrat.",
    window: "Dérive prévue dans 72 h.",
    urgency: "imminent",
    domain: "TOB / 1SN",
    order: 1,
  },
  {
    slug: "003-le-noyau-fracture",
    code: "003",
    title: "Le Noyau Fracturé",
    layer: "Système",
    symptom:
      "Substrat noyau instable. Threads dérivent, sections critiques mal scellées, mémoire fragmentée. Interventions à venir par lots de TP.",
    window: "Activation progressive. Pas d'horloge encore.",
    urgency: "stable",
    domain: "Système d'exploitation / 1SN",
    order: 3,
  },
];

export function getAnomalie(slug: string): AnomalieMeta | undefined {
  return ANOMALIES.find((a) => a.slug === slug);
}
