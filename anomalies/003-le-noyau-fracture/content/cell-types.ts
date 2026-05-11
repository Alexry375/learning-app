/**
 * Schéma typé des cellules pédagogiques de l'Anomalie #003.
 *
 * Une Cell est l'unité de calibration minimale : une portion de noyau à
 * recoder. Théorie courte + code C qui compile réellement + analyse +
 * défi optionnel validé par compilation.
 *
 * Pas de JSON brut : tout est exporté en TS avec ces types.
 */

export type ValidationRule =
  | { type: "stdout-equals"; expected: string }
  | { type: "stdout-contains"; substrings: string[] }
  | { type: "stdout-matches"; pattern: string; flags?: string }
  | { type: "exit-code"; code: number }
  | { type: "exit-signal"; signalName: string }
  | { type: "stderr-empty" }
  | { type: "compile-ok" }
  | { type: "and"; rules: ValidationRule[] }
  | { type: "or"; rules: ValidationRule[] };

export type OpenTextValidation =
  | { type: "equals-int"; value: number }
  | { type: "equals-string"; value: string; ci?: boolean }
  | { type: "matches"; pattern: string; flags?: string };

export type ChallengeCompile = {
  kind: "compile";
  prompt: string;
  validate: ValidationRule;
  /** Hint affichable si l'agent échoue 2+ fois. */
  hint?: string;
  /** Stdin injecté lors du test. */
  stdin?: string;
  /** Args argv[1..] injectés lors du test. */
  args?: string[];
};

export type ChallengeOpenText = {
  kind: "open-text";
  prompt: string;
  validate: OpenTextValidation;
  hint?: string;
};

export type Challenge = ChallengeCompile | ChallengeOpenText;

export type CellRef = {
  label: string;
  /** URL absolue (man.cx, kernel.org) ou interne (#cell-XX). */
  url: string;
};

export type Cell = {
  id: string;
  /** Numéro dans le TP courant (1-based). */
  number: number;
  /** Titre court diégétique. */
  title: string;
  /** Tags conceptuels (pour recherche / dépendances éventuelles). */
  concept: string[];

  /** 3-5 lignes max. Markdown léger (gras, ital, code inline). */
  theory: string;

  /** Encart "Pourquoi ce design ?". Court (3-5 lignes). */
  whyBox?: string;

  /** Code C de départ (éditable côté UI). */
  starterCode: string;

  /** Stdin défaut pour le run. */
  defaultStdin?: string;

  /** Notes affichées après la première compile réussie. */
  analysis?: string;

  /** Validation par défaut sur le starter code (peut être absente). */
  starterValidation?: ValidationRule;

  /** Défi optionnel — différent du starter. */
  challenge?: Challenge;

  /** Références : man pages, source kernel, etc. */
  refs?: CellRef[];

  /** Si présent : ce code est suggéré à épingler dans la Chambre du rendu. */
  pinForRendu?: {
    section: string;
    snippet: string;
  };
};

export type TPContent = {
  tpId: string;
  /** Cellules dans l'ordre canonique. */
  cells: Cell[];
  /** Fichier cible de la Chambre du rendu (ex "exo1.c", "minishell.c"). */
  renduFile: {
    name: string;
    /** Squelette initial du fichier dans la Chambre. */
    initialContent: string;
    /** Validation finale du rendu (peut être absente). */
    validation?: ValidationRule;
    /** Description courte affichée en haut de la Chambre. */
    brief: string;
  };
};
