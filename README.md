# learning-app · L'Interpréteur

> Webapp d'apprentissage ludique conçue comme l'expérience d'un opérateur de la
> *réalité compilée*. Chaque cours/matière est un **dossier d'anomalie** : on
> diagnostique le substrat, on identifie la dérive, on stabilise.

État : V0 publique pour transparence. Itération continue.

## Pourquoi

Apprendre en faisant des TPs sur Moodle est correct. Apprendre dans une UI qui
*joue* avec toi, qui rend la matière vivante, qui te donne le sentiment
d'agir sur un système — c'est différent. C'est le pari de ce projet.

Le scope actuel couvre les matières du **cursus 1SN ENSEEIHT** :

| Code | Anomalie | Couche | Matière |
|------|----------|--------|---------|
| `001` | Le Compilateur Hanté | Objet | TOB / Java |
| `003` | Le Noyau Fracturé | Système | Système d'exploitation |

D'autres dossiers s'ajouteront au rythme des matières où la mise en interactif
fait gagner réellement quelque chose par rapport au PDF.

## Stack

- **Next.js 16** (App Router, RSC, Turbopack)
- **TypeScript strict**
- **Tailwind CSS v4**
- **Framer Motion / motion**
- **better-sqlite3** (persistance de progression locale)
- **Three.js / React Three Fiber** *(en cours d'intégration pour la navigation 3D entre dossiers)*

## Architecture

```
learning-app/
├── app/                    routes Next.js (App Router)
│   ├── page.tsx            home — index des anomalies
│   ├── anomalie/[slug]/    dossier d'anomalie (un par cours)
│   ├── prototype-r3f/      banc d'essai du composant <Bubble> R3F
│   └── ...
├── anomalies/              définitions des anomalies (metadata + content)
│   ├── registry.ts         liste centrale
│   └── <slug>/             un dossier par anomalie
├── components/             composants UI
│   ├── bubble/             Bubble R3F (futur node du graphe 3D)
│   ├── anomalie-001/       composants spécifiques à un dossier
│   ├── anomalie-003/       ...
│   └── ...
├── lib/                    helpers transverses (db, etc.)
└── data/                   sqlite local (gitignored)
```

Chaque dossier d'anomalie possède son propre runner (UI propre) + son contenu.
La home agit comme **registry**, en attendant l'interface 3D de navigation par
graphe de bulles qui remplacera ce panneau.

## Démarrer en local

```bash
git clone https://github.com/Alexry375/learning-app.git
cd learning-app
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Le contexte plus large

Ce repo n'est pas autonome dans son arborescence locale — il vit comme la
brique permanente d'un **project-lab** au sens d'[agentic-workspace](https://github.com/Alexry375/agentic-workspace) :

```
learning-lab/                  ← container conceptuel pour tout ce qui touche à l'apprentissage
└── linterpreteur/             ← le project-lab de cette webapp
    ├── learning-app/          ← ← ← CE DÉPÔT (code permanent, public)
    └── workspaces/            ← workspaces jetables qui contribuent au repo
        ├── interpreteur/      (seed)
        ├── bulle-prototype/   (prototypes visuels pour le graphe 3D)
        └── ...
```

Les workspaces sont **locaux et non publiés** : ils servent à explorer,
prototyper, intégrer une nouvelle anomalie en isolation, avant que leurs
`outputs/` soient repris ici dans `learning-app/`. Voir le repo
`agentic-workspace` pour la philosophie complète.

## Statut

Expérimental, en construction publique. Le but n'est pas d'être utilisable par
n'importe quel étudiant out-of-the-box (le contenu est ancré dans le cursus
1SN ENSEEIHT), mais d'être transparent sur ce qu'on essaie de prouver :
*l'UI peut transformer l'apprentissage si elle est conçue comme un jeu, pas
comme un formulaire*.

## Licence

MIT. Voir [LICENSE](./LICENSE).
