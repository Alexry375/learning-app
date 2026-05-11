/**
 * Index des TP de Système d'exploitation.
 * Chaque TP sera ajouté ici au fur et à mesure.
 *
 * Pour l'instant : liste vide. Premier TP à insérer dès qu'Alexis dépose
 * l'énoncé dans inputs/.
 */

export type TPStatus = "à venir" | "en cours" | "complété";

export type TPMeta = {
  id: string;
  /** Numéro affiché : "TP1", "TP2"… */
  code: string;
  title: string;
  /** Bref résumé du thème (concurrency, mémoire, FS…). */
  topic: string;
  status: TPStatus;
  /** Ordre d'affichage. */
  order: number;
};

export const TPS: TPMeta[] = [];

export function getTP(id: string): TPMeta | undefined {
  return TPS.find((tp) => tp.id === id);
}
