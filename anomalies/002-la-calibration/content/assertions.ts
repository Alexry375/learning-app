/**
 * 18 assertions de calibration. Chaque assertion = un QCM 2-4 choix.
 * Ton sec, cyber-clinique. Pas de narratif long.
 */

export type Assertion = {
  id: string;
  prompt: string;
  /** Optionnel : artefact à observer. */
  artefact?: { type: "snippet" | "formula"; body: string };
  options: { id: string; text: string; correct: boolean }[];
  /** Précision affichée APRÈS réponse — courte, sèche. */
  rationale: string;
};

export const ASSERTIONS: Assertion[] = [
  {
    id: "a01",
    prompt:
      "Modèle qui apprend par cœur l'ensemble d'entraînement et généralise mal. Diagnostic ?",
    options: [
      { id: "A", text: "Sous-apprentissage (underfitting)", correct: false },
      { id: "B", text: "Sur-apprentissage (overfitting)", correct: true },
      { id: "C", text: "Biais d'inférence", correct: false },
      { id: "D", text: "Régularisation excessive", correct: false },
    ],
    rationale:
      "Overfitting : faible erreur train, forte erreur test. Sous-apprentissage = forte erreur sur les deux.",
  },
  {
    id: "a02",
    prompt:
      "Avec une régression linéaire mono-variable, la fonction de coût standard est :",
    options: [
      { id: "A", text: "Cross-entropy binaire", correct: false },
      { id: "B", text: "Erreur quadratique moyenne (MSE)", correct: true },
      { id: "C", text: "Hinge loss", correct: false },
      { id: "D", text: "KL-divergence", correct: false },
    ],
    rationale:
      "MSE = 1/n Σ (y_pred − y_vrai)². Convexe pour modèle linéaire ; minimum global atteignable.",
  },
  {
    id: "a03",
    prompt:
      "K-NN, K très petit (1) versus K très grand (≈ n). Quel constat est exact ?",
    options: [
      { id: "A", text: "K=1 augmente le biais et baisse la variance", correct: false },
      { id: "B", text: "K=1 baisse le biais et augmente la variance", correct: true },
      { id: "C", text: "K=n surapprend systématiquement", correct: false },
      { id: "D", text: "Le K n'a aucun impact si normalisation", correct: false },
    ],
    rationale:
      "K=1 colle aux données → faible biais, forte variance. K très grand → forte biais, faible variance (lissage extrême).",
  },
  {
    id: "a04",
    prompt:
      "Validation croisée k-fold : objectif principal ?",
    options: [
      { id: "A", text: "Augmenter la taille du training set", correct: false },
      { id: "B", text: "Estimer plus fidèlement l'erreur de généralisation", correct: true },
      { id: "C", text: "Réduire le temps d'entraînement", correct: false },
      { id: "D", text: "Éliminer les outliers", correct: false },
    ],
    rationale:
      "K-fold moyenne k évaluations sur folds différents → estimation plus stable de la performance hors échantillon.",
  },
  {
    id: "a05",
    prompt:
      "Descente de gradient : taux d'apprentissage trop grand. Symptôme typique ?",
    options: [
      { id: "A", text: "Convergence très lente mais sûre", correct: false },
      { id: "B", text: "Oscillations, divergence possible du loss", correct: true },
      { id: "C", text: "Surapprentissage immédiat", correct: false },
      { id: "D", text: "Aucun impact tant que les gradients sont normalisés", correct: false },
    ],
    rationale:
      "Pas trop grand → on saute de l'autre côté du minimum, le loss oscille voire explose.",
  },
  {
    id: "a06",
    prompt:
      "Données déséquilibrées (95% classe A, 5% classe B). Modèle qui prédit toujours A. Accuracy ?",
    options: [
      { id: "A", text: "0.50", correct: false },
      { id: "B", text: "0.95", correct: true },
      { id: "C", text: "0.05", correct: false },
      { id: "D", text: "Indéfini", correct: false },
    ],
    rationale:
      "L'accuracy seule trompe sur les classes déséquilibrées. Préférer F1, recall par classe, matrice de confusion.",
  },
  {
    id: "a07",
    prompt:
      "Régularisation L2 (ridge) — effet principal ?",
    options: [
      { id: "A", text: "Met certains coefficients exactement à zéro (sparsité)", correct: false },
      { id: "B", text: "Pénalise la norme L2 des coefficients, lisse la solution", correct: true },
      { id: "C", text: "Augmente la variance du modèle", correct: false },
      { id: "D", text: "Équivaut à une normalisation des features", correct: false },
    ],
    rationale:
      "L2 : pénalité λ Σ w². Réduit la magnitude. La sparsité c'est L1 (lasso).",
  },
  {
    id: "a08",
    prompt:
      "Matrice de confusion 2 classes, positives prédites positives = 80, fausses positives = 20, fausses négatives = 40, négatives prédites négatives = 60. Précision (precision) ?",
    artefact: {
      type: "formula",
      body: "precision = TP / (TP + FP)",
    },
    options: [
      { id: "A", text: "0.80", correct: true },
      { id: "B", text: "0.67", correct: false },
      { id: "C", text: "0.50", correct: false },
      { id: "D", text: "0.40", correct: false },
    ],
    rationale: "80 / (80+20) = 0.80. Recall serait 80 / (80+40) = 0.67.",
  },
  {
    id: "a09",
    prompt:
      "Apprentissage non supervisé — algorithme typique ?",
    options: [
      { id: "A", text: "Régression logistique", correct: false },
      { id: "B", text: "K-means", correct: true },
      { id: "C", text: "SVM linéaire", correct: false },
      { id: "D", text: "Random Forest", correct: false },
    ],
    rationale:
      "K-means partitionne sans labels. Régression logistique, SVM, Random Forest sont supervisés.",
  },
  {
    id: "a10",
    prompt:
      "Compromis biais–variance. Augmenter la complexité du modèle :",
    options: [
      { id: "A", text: "Augmente biais et variance", correct: false },
      { id: "B", text: "Diminue biais, augmente variance", correct: true },
      { id: "C", text: "Diminue biais et variance", correct: false },
      { id: "D", text: "Augmente biais, diminue variance", correct: false },
    ],
    rationale:
      "Modèle plus expressif colle mieux aux données (biais ↓) mais devient sensible aux fluctuations (variance ↑).",
  },
  {
    id: "a11",
    prompt: "Régression vs classification — différence cardinale ?",
    options: [
      { id: "A", text: "Régression supervisée, classification non", correct: false },
      { id: "B", text: "Sortie continue vs sortie discrète", correct: true },
      { id: "C", text: "Régression utilise toujours MSE, classification jamais", correct: false },
      { id: "D", text: "Aucune différence formelle", correct: false },
    ],
    rationale:
      "Régression : ŷ ∈ ℝ. Classification : ŷ ∈ classes finies (binaire ou multi-classe).",
  },
  {
    id: "a12",
    prompt:
      "Sigmoïde σ(x) = 1/(1+e⁻ˣ). Sortie pour x très grand positif ?",
    options: [
      { id: "A", text: "→ 0", correct: false },
      { id: "B", text: "→ 1", correct: true },
      { id: "C", text: "→ ∞", correct: false },
      { id: "D", text: "→ 0.5", correct: false },
    ],
    rationale:
      "Asymptote 1 à droite, 0 à gauche. σ(0) = 0.5. Saturation des gradients aux extrêmes (vanishing gradients).",
  },
  {
    id: "a13",
    prompt:
      "Pour comparer deux modèles avec faible écart de performance, l'outil le plus fiable est :",
    options: [
      { id: "A", text: "Une seule passe sur le test set", correct: false },
      { id: "B", text: "Validation croisée + test statistique", correct: true },
      { id: "C", text: "Le score sur le training set", correct: false },
      { id: "D", text: "Le temps d'entraînement", correct: false },
    ],
    rationale:
      "Une seule mesure peut être bruitée. Validation croisée donne une distribution ; test statistique tranche.",
  },
  {
    id: "a14",
    prompt:
      "Feature importante mais à grande échelle, mélangée à des features petites. Avant un k-NN ou un SVM ?",
    options: [
      { id: "A", text: "Rien, l'algo s'en occupe", correct: false },
      { id: "B", text: "Standardiser / normaliser les features", correct: true },
      { id: "C", text: "Discrétiser tout", correct: false },
      { id: "D", text: "Ajouter du bruit aux petites features", correct: false },
    ],
    rationale:
      "k-NN et SVM (avec noyau RBF) sont sensibles à l'échelle. StandardScaler ou MinMaxScaler — sans triche du test set.",
  },
  {
    id: "a15",
    prompt:
      "Boosting (gradient boosting, AdaBoost) — principe central ?",
    options: [
      {
        id: "A",
        text: "Combiner des modèles indépendants entraînés en parallèle",
        correct: false,
      },
      {
        id: "B",
        text: "Entraîner séquentiellement des apprenants faibles, chaque nouveau corrigeant les erreurs du précédent",
        correct: true,
      },
      {
        id: "C",
        text: "Sélectionner aléatoirement des features à chaque arbre",
        correct: false,
      },
      { id: "D", text: "Régulariser par dropout", correct: false },
    ],
    rationale:
      "Bagging = parallèle (Random Forest). Boosting = séquentiel : chaque modèle pèse plus les exemples mal prédits.",
  },
  {
    id: "a16",
    prompt:
      "Fuite de données (data leakage). Cause typique ?",
    options: [
      { id: "A", text: "Trop d'epochs", correct: false },
      {
        id: "B",
        text: "Standardiser sur l'ensemble complet avant de splitter train/test",
        correct: true,
      },
      { id: "C", text: "Utiliser la cross-validation", correct: false },
      { id: "D", text: "Trop de régularisation", correct: false },
    ],
    rationale:
      "Toute statistique apprise sur le test (mean, std, encodage) doit être ajustée UNIQUEMENT sur le train.",
  },
  {
    id: "a17",
    prompt:
      "Réseau de neurones, fonction d'activation ReLU(x) = max(0, x). Avantage majeur sur sigmoïde ?",
    options: [
      { id: "A", text: "Borne la sortie entre 0 et 1", correct: false },
      {
        id: "B",
        text: "Évite le vanishing gradient sur la partie positive",
        correct: true,
      },
      { id: "C", text: "Toujours différentiable", correct: false },
      { id: "D", text: "Nécessite moins de paramètres", correct: false },
    ],
    rationale:
      "Sigmoïde sature : gradient → 0 aux extrêmes, l'apprentissage stagne en profondeur. ReLU laisse passer le gradient = 1 pour x > 0.",
  },
  {
    id: "a18",
    prompt:
      "ROC-AUC sur un classifieur binaire. AUC = 0.5 signifie :",
    options: [
      { id: "A", text: "Classifieur parfait", correct: false },
      { id: "B", text: "Aussi bon que tirer à pile ou face", correct: true },
      { id: "C", text: "Aucune classe positive prédite", correct: false },
      { id: "D", text: "Donnée idéale pour clustering", correct: false },
    ],
    rationale:
      "AUC = 1 → parfait. AUC = 0.5 → aléatoire. AUC < 0.5 → pire que l'aléatoire (modèle inversé).",
  },
];
