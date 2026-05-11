/**
 * Index des trois TP de la matière OS — Anomalie #003.
 *
 * Les trois TP forment un même projet (minishell) qu'Alexis doit livrer.
 * TP1 = processus, TP2 = signaux, TP3 = masques + composition complète.
 */

export type TPStatus = "à venir" | "en cours" | "complété";

export type TPMeta = {
  id: string;
  /** Numéro affiché : "TP1", "TP2"… */
  code: string;
  /** Titre diégétique de l'acte. */
  title: string;
  /** Sous-titre académique. */
  topic: string;
  /** Description courte (3-4 lignes max). */
  summary: string;
  /** Slug pour la route /anomalie/003-le-noyau-fracture/[tpSlug]. */
  slug: string;
  status: TPStatus;
  /** Nombre de cellules prévues. */
  cellCount: number;
  /** Ordre d'affichage. */
  order: number;
};

export const TPS: TPMeta[] = [
  {
    id: "tp1",
    code: "ACTE I",
    title: "Genèse",
    topic: "TP1 · Processus (fork, exec, wait)",
    summary:
      "Réinstanciation des primitives de duplication. Le noyau crée, isole, scelle. Tu codes fork, tu décodes wait, tu mesures le coût d'un exec.",
    slug: "tp1",
    status: "en cours",
    cellCount: 10,
    order: 1,
  },
  {
    id: "tp2",
    code: "ACTE II",
    title: "Communication",
    topic: "TP2 · Signaux (kill, sigaction, handlers)",
    summary:
      "Les processus ne se parlent que par signaux. Asynchrone, brutal, async-safe. Tu installes un gestionnaire, tu récoltes SIGCHLD, tu protèges le shell de SIGINT.",
    slug: "tp2",
    status: "à venir",
    cellCount: 6,
    order: 2,
  },
  {
    id: "tp3",
    code: "ACTE III",
    title: "Composition",
    topic: "TP3 · Masques, pipes, minishell complet",
    summary:
      "Sections critiques sans signal. Tuyaux entre processus. Redirections. Background. Le minishell se compose : tout converge dans la Chambre du rendu.",
    slug: "tp3",
    status: "à venir",
    cellCount: 7,
    order: 3,
  },
];

export function getTP(id: string): TPMeta | undefined {
  return TPS.find((tp) => tp.id === id || tp.slug === id);
}
