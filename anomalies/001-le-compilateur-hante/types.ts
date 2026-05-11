/**
 * Types stricts du contenu narratif de l'Anomalie #001.
 * Le sub-agent rédacteur remplit ces structures ; les composants
 * d'UI les consomment via import typé. Pas de JSON.
 */

export type BriefingContent = {
  /** Marquage en haut du dossier (ex: "INTERPRÉTEUR // Δ-7"). */
  classification: string;
  /** Numéro de dossier (ex: "DOSSIER-001 / Compilateur Hanté"). */
  fileNumber: string;
  /** En-tête diégétique : date, lieu, agent assigné. */
  meta: { label: string; value: string }[];
  /** Synopsis + paragraphes de présentation. Mises en page :
   *  Une string par paragraphe. Lignes vides exclues. */
  body: string[];
  /** Citation/épigraphe optionnelle entre body et pistes. */
  epigraph?: { text: string; attribution?: string };
  /** Trois "pistes initiales" — concepts à interroger. */
  leads: Lead[];
};

export type Lead = {
  /** Slug du concept. */
  conceptId: ConceptId;
  /** Étiquette diégétique (ex: "Le Bibliothécaire"). */
  label: string;
  /** Une ligne d'accroche. */
  hook: string;
};

export type ConceptId =
  | "polymorphisme"
  | "heritage"
  | "generics"
  | "collections"
  | "comparable"
  | "iterator"
  | "exception"
  | "swing"
  | "interface"
  | "abstract"
  | "threads";

/** Pour Collections et Swing, on a des sous-personnages. */
export type SubConceptId =
  // Collections
  | "arraylist-vs-linkedlist"
  | "hashmap"
  | "treemap"
  | "hashset-treeset"
  // Swing
  | "jframe"
  | "edt"
  | "layouts"
  | "jcomponent";

export type Interrogatoire = {
  conceptId: ConceptId;
  /** Avatar diégétique du concept (description courte de la voix). */
  persona: {
    title: string; // "LE BIBLIOTHÉCAIRE"
    description: string; // ce qu'il/elle est, son ton, son détail visuel
    quote: string; // une phrase signature
  };
  /** Décliné en sous-personnages pour Collections / Swing. */
  subPersonas?: Array<{
    subConceptId: SubConceptId;
    title: string;
    teaser: string;
  }>;
  /** Tours du dialogue. 2-3 tours minimum sur les concepts prioritaires. */
  rounds: InterrogatoireRound[];
  /** Fragment d'enquête révélé si le concept est résolu (toutes les bonnes
   *  réponses, ou suffisamment de bonnes réponses). */
  reward: {
    title: string;
    body: string; // 2-4 phrases
  };
};

export type InterrogatoireRound = {
  /** Mise en scène du tour : ce que dit/fait le suspect avant la question. */
  setup: string;
  question: Question;
};

export type Question = {
  /** Énoncé. */
  prompt: string;
  /** Optionnel : code/UML/snippet à examiner. */
  artefact?: { type: "code-java" | "uml-ascii" | "stacktrace" | "text"; body: string };
  options: QuestionOption[];
  /** Indice diégétique si mauvaise réponse. */
  hintOnWrong: string;
  /** Commentaire de validation diégétique si bonne réponse. */
  praiseOnRight: string;
  /** Note pédagogique courte (visible APRÈS réponse, type "Bibliothèque" Disco Elysium). */
  pedagogyNote: string;
};

export type QuestionOption = {
  id: string; // "A", "B", "C", "D"
  text: string;
  correct: boolean;
};

export type StackTraceContent = {
  /** Mise en scène — comment la stack trace arrive sur le bureau. */
  setup: string;
  /** La stack trace elle-même, multi-lignes. */
  trace: string;
  /** Question principale + choix (l'une est la classe coupable). */
  question: Question;
  /** Texte de transition vers la phase suivante après bonne réponse. */
  postlude: string;
};

export type UMLPuzzleItem = {
  setup: string;
  /** Récit textuel du système à modéliser. */
  scenario: string;
  question: Question;
};

export type UMLContent = {
  intro: string;
  items: UMLPuzzleItem[]; // 2 minimum
  postlude: string;
};

export type CodeArenaItem = {
  title: string;
  /** Mise en scène diégétique du problème. */
  setup: string;
  /** Bug pédagogique attendu — visible APRÈS résolution. */
  pedagogyNote: string;
  /** Code de départ (corrompu mais avec le squelette). */
  initialCode: string;
  /** Nom de la classe Java publique principale. */
  className: string;
  /** Test : matche stdout. */
  expectedOutput: { type: "exact" | "contains" | "regex"; value: string };
  /** Solution-référence (cachée, pour debug uniquement). */
  solution: string;
};

export type CodeArenaContent = {
  intro: string;
  items: CodeArenaItem[]; // 2-3
  postlude: string;
};

export type VerdictContent = {
  /** Mise en scène du tribunal de la JVM. */
  setup: string;
  /** Trois questions de synthèse. */
  questions: Question[];
  /** Texte final si succès complet. */
  resolutionFull: string;
  /** Texte final si succès partiel. */
  resolutionPartial: string;
  /** Fragment de lore débloqué. */
  loreFragment: {
    id: string;
    title: string;
    body: string; // 4-6 phrases, ton VanderMeer/Severance/SCP
  };
};

/* =====================================================================
 * Module export type — agrégé.
 * ===================================================================== */
export type AnomalieContent = {
  briefing: BriefingContent;
  interrogatoires: Interrogatoire[];
  stackTrace: StackTraceContent;
  uml: UMLContent;
  codeArena: CodeArenaContent;
  verdict: VerdictContent;
};

export const PHASE_ORDER = [
  "briefing",
  "interrogatoires",
  "stack-trace",
  "uml",
  "code",
  "verdict",
] as const;

export type Phase = (typeof PHASE_ORDER)[number];
