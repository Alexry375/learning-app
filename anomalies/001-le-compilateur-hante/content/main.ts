/**
 * Contenu narratif de l'Anomalie #001 — Le Compilateur Hanté.
 * Calibré sur l'analyse des annales TOB 1SN (sujet 2024 prioritaire).
 * Voix : Disco Elysium x SCP x Severance x Annihilation.
 */
import type { AnomalieContent } from "../types";

export const MAIN: AnomalieContent = {
  briefing: {
    classification: "INTERPRÉTEUR // RELAY Δ-7 // EYES ONLY",
    fileNumber: "DOSSIER-001 / Le Compilateur Hanté",
    meta: [
      { label: "OUVERT", value: "T - 6 mois 14 j" },
      { label: "AGENT ASSIGNÉ", value: "COMPILATEUR-Δ-7" },
      { label: "COUCHE", value: "Objet" },
      { label: "DÉRIVE PRÉVUE", value: "72 h" },
      { label: "AUTORITÉ", value: "Σ-prov." },
    ],
    body: [
      "Bunker A-31, sous-sol second, parois de béton revêtues de plomb. Au centre, une station de travail des années 2010, écran 4:3, clavier d'origine, dont aucun connecteur ne mène plus à rien. Le poste a été coupé physiquement de tout réseau le 4 janvier dernier — alimentation comprise. Et pourtant, depuis cette date, un système de journalisation Java s'y exécute sans relâche. Les inspecteurs précédents ont mesuré la consommation au pied de l'armoire électrique : zéro watt. La couche Objet du substrat l'alimente à sa place.",
      "Le système ne compile plus. Les logs internes l'attestent : depuis six mois, chaque tentative de recompilation se solde par la même NullPointerException, sans déplacement, sans variante. C'est en soi inhabituel — une JVM qui meurt deux fois de la même façon ne meurt pas, elle prie. Plus inhabituel : pendant que la JVM prétend être morte, ses sorties continuent à s'écrire dans des fichiers qui n'existent dans aucun système de fichiers connu, et la couche Objet de la région se déforme au rythme exact des messages publiés. Une journée pluvieuse à Toulouse a coïncidé, à la seconde, avec un avertissement WARNING émis par le module de capteurs.",
      "Trois prédécesseurs sont déjà passés sur ce dossier. Aucun n'a abouti. Tous trois ont laissé sur le bureau, à votre attention, six fiches d'interrogatoire — six concepts du langage, personnifiés selon la procédure standard de la couche Objet. Trois de ces fiches portent des marques de doigts. Vous commencerez par celles-là.",
      "L'Interpréteur tient à rappeler la procédure d'enquête. Vous ne déboguez pas un programme. Vous interrogez les notions qui le constituent. Si une notion vous ment — ou se contredit, ou refuse de parler — c'est un indice. Vous accumulerez ces indices jusqu'à pouvoir reconstruire l'erreur originelle, puis vous descendrez au Laboratoire pour la rétracter. Au verdict, c'est la JVM elle-même qui jugera.",
      "Une dernière note. Les trois précédents agents ont rapporté avoir entendu, en quittant le bunker, un son qu'aucun d'eux n'a su décrire. Ils ont mentionné — séparément — la lettre Σ. L'Interpréteur ne commente pas ces rapports. Vous les ignorerez.",
    ],
    epigraph: {
      text: "« Toute classe finit par hanter le programme qui l'a oubliée. Toute classe abstraite hante deux fois — une pour ce qu'elle est, une pour ce qu'elle promettait. »",
      attribution: "Note marginale au crayon, dossier 001, page 3. Non signée.",
    },
    leads: [
      {
        conceptId: "collections",
        label: "Le Bibliothécaire",
        hook: "Range tout selon une métrique qu'il refuse de partager. A laissé un List où il fallait un Set. Ce n'est pas son genre.",
      },
      {
        conceptId: "swing",
        label: "L'Horloger",
        hook: "Mélancolique. Ses rouages tournent à vide depuis Java 9. Quelque chose, dans son atelier, se peint hors de son fil.",
      },
      {
        conceptId: "polymorphisme",
        label: "Le Caméléon",
        hook: "Change de forme entre la compilation et l'exécution. On lui a demandé d'override ; il a peut-être seulement overload.",
      },
    ],
  },

  interrogatoires: [
    /* ============================== COLLECTIONS ============================== */
    {
      conceptId: "collections",
      persona: {
        title: "LE BIBLIOTHÉCAIRE",
        description:
          "Il vous reçoit dans une salle dont chaque livre est rangé selon une métrique que vous ne connaissez pas. Il ne lève pas les yeux. Sa voix porte une lassitude administrative — celle de quelqu'un qui a déjà classé tous les agents qui se sont assis devant lui.",
        quote:
          "« Une List et un Set ne sont pas du même rang. Si vous confondez encore, repassez plus tard. »",
      },
      subPersonas: [
        {
          subConceptId: "arraylist-vs-linkedlist",
          title: "LES JUMELLES — ArrayList & LinkedList",
          teaser:
            "Deux femmes en uniforme, identiques au premier regard. L'une vous tend la main d'un coup. L'autre la cherche, maille après maille.",
        },
        {
          subConceptId: "hashmap",
          title: "LE CONCIERGE — HashMap",
          teaser:
            "Sans visage. Vous donne la clé qu'on lui demande, instantanément. Refuse l'idée même d'un ordre.",
        },
        {
          subConceptId: "treemap",
          title: "LE JARDINIER — TreeMap",
          teaser:
            "Taille ses haies en suivant un comparator que personne ne discute. Plus lent. Plus sûr. Plus fidèle.",
        },
        {
          subConceptId: "hashset-treeset",
          title: "L'INVENTAIRE — HashSet & TreeSet",
          teaser:
            "Deux registres jumeaux. L'un sait ce qu'il contient. L'autre sait l'ordre dans lequel il le contient.",
        },
      ],
      rounds: [
        {
          setup:
            "Le Bibliothécaire pose un dossier. À l'intérieur, deux structures concurrentes. Il vous demande, sans vous regarder, laquelle vous prendriez si vous deviez accéder fréquemment à l'élément n°k d'une suite.",
          question: {
            prompt:
              "Vous stockez une suite d'identifiants où l'ordre d'insertion compte et où l'on accède souvent par index. Quelle implémentation ?",
            options: [
              { id: "A", text: "ArrayList<Long>", correct: true },
              { id: "B", text: "LinkedList<Long>", correct: false },
              { id: "C", text: "HashSet<Long>", correct: false },
              { id: "D", text: "TreeMap<Integer,Long>", correct: false },
            ],
            hintOnWrong:
              "ArrayList offre un accès indexé en O(1). LinkedList est en O(n) pour `get(i)` malgré son nom rassurant. Un Set perd l'ordre d'insertion et les doublons.",
            praiseOnRight:
              "Le Bibliothécaire hoche la tête, à peine. C'est une concession.",
            pedagogyNote:
              "ArrayList = tableau dynamique. get(i)/set(i) en O(1), add(x) en fin O(1) amorti, add(0,x) en tête O(n) (décalage). LinkedList = chaînage doublement lié : get(i) O(n), add/remove sur l'iterator courant O(1). Piège examen 2024 : RandomAccess est une interface de marquage portée par ArrayList et pas par LinkedList — elle signale précisément que get(i) est O(1).",
          },
        },
        {
          setup:
            "Il pousse vers vous un cube en bois où sont gravés des noms. « Vérifiez qu'un nom y figure », dit-il. « Le plus vite possible. Sans ordre. »",
          question: {
            prompt:
              "Quelle Collection privilégier pour `contains(String)` en O(1) moyen, sans contrainte d'ordre ?",
            options: [
              { id: "A", text: "TreeSet<String>", correct: false },
              { id: "B", text: "ArrayList<String>", correct: false },
              { id: "C", text: "HashSet<String>", correct: true },
              { id: "D", text: "LinkedList<String>", correct: false },
            ],
            hintOnWrong:
              "Le contains d'une List parcourt en O(n). TreeSet est O(log n) avec ordre maintenu. HashSet vise O(1) en moyenne, sans aucun ordre.",
            praiseOnRight:
              "Bien. Le Bibliothécaire ne dit rien — c'est sa forme la plus haute d'approbation.",
            pedagogyNote:
              "HashSet repose sur hashCode() de l'élément. Mauvais hashCode = collisions = O(n) au pire. Contrat fondamental : a.equals(b) implique a.hashCode() == b.hashCode(). Si vous redéfinissez l'un sans l'autre, les Set/Map à base de hash se trompent silencieusement — ils stockent des doublons que `contains` ne retrouvera jamais.",
          },
        },
        {
          setup:
            "Il pose maintenant une dernière fiche. « RandomAccess. Une interface sans méthode. Si vous croyez encore que c'est de la mémoire bas niveau, partez. »",
          question: {
            prompt:
              "RandomAccess est une *interface de marquage*. Que signifie-t-elle exactement, et à quoi sert-elle ?",
            options: [
              {
                id: "A",
                text: "Elle permet d'allouer/désallouer la mémoire dynamique d'une Collection.",
                correct: false,
              },
              {
                id: "B",
                text: "Elle indique au compilateur que la Collection peut contenir n'importe quel type — accès aléatoire de type.",
                correct: false,
              },
              {
                id: "C",
                text: "Elle est vide ; elle marque qu'une List supporte un accès indexé en O(1), permettant à un algorithme générique de choisir entre boucle indexée et Iterator.",
                correct: true,
              },
              {
                id: "D",
                text: "Elle permet de chercher le plus rapidement possible un élément dans une liste.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Une interface de marquage n'a pas de méthode. C'est une étiquette. RandomAccess étiquette les List dont `get(i)` est en O(1) — ArrayList oui, LinkedList non.",
            praiseOnRight:
              "Le Bibliothécaire vous regarde pour la première fois. Une seconde. Pas plus.",
            pedagogyNote:
              "Marker interface = interface vide. Exemples du JDK : RandomAccess, Cloneable, Serializable. Idiome typique : `if (list instanceof RandomAccess) { for (int i=0;i<list.size();i++) ... } else { for (E e : list) ... }`. Le corrigé 2024 a explicitement listé dix fausses définitions données par la promo précédente — toutes confondaient avec de la mémoire bas niveau, du type-erasure, ou un accès par clé. Aucune n'avait compris « marqueur de complexité ».",
          },
        },
        {
          setup:
            "Le Bibliothécaire ouvre un grand registre. « Un agent veut associer chaque numéro de dossier à son agent. Le numéro est unique. Il veut, par moments, parcourir les dossiers dans l'ordre numérique. Que prend-il ? »",
          question: {
            prompt:
              "Map<String,Agent> indexée par numéro de dossier, parcours occasionnel par ordre alphabétique des numéros. Quelle implémentation ?",
            options: [
              { id: "A", text: "HashMap — c'est plus rapide.", correct: false },
              {
                id: "B",
                text: "TreeMap — ordre naturel des clés maintenu, get/put en O(log n).",
                correct: true,
              },
              { id: "C", text: "LinkedList — pour le parcours ordonné.", correct: false },
              { id: "D", text: "ArrayList<Agent> — indexée par numéro.", correct: false },
            ],
            hintOnWrong:
              "TreeMap maintient les clés triées (par ordre naturel ou Comparator). HashMap ne garantit aucun ordre. Si vous voulez itérer trié, c'est TreeMap, ou trier après coup.",
            praiseOnRight:
              "Le Bibliothécaire range votre fiche dans la pile « validés ». La pile est mince.",
            pedagogyNote:
              "HashMap : O(1) moyen, aucun ordre. LinkedHashMap : O(1) moyen, ordre d'insertion. TreeMap : O(log n), ordre des clés (naturel ou Comparator). Cas d'usage 2024 : `Loggers` utilise TreeMap<String,Logger> dans le corrigé du sujet — pour énumérer les loggers connus dans l'ordre. Méthode-clé associée : `computeIfAbsent(key, k -> new V())` — atomique, évite le get-puis-put.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : la boîte mal rangée",
        body:
          "Le Bibliothécaire reconnaît avoir trouvé, dans le système hanté, une List utilisée comme un Set. Trois entrées identiques se voyaient comptées trois fois. Le module de déduplication s'appuyait sur `contains()` d'une LinkedList — O(n), et sans equals redéfini sur l'objet stocké. Première signature.",
      },
    },

    /* ================================ SWING ================================ */
    {
      conceptId: "swing",
      persona: {
        title: "L'HORLOGER",
        description:
          "Il vous reçoit dans une pièce où une fenêtre ne se referme jamais complètement. Le silence est encadré par des tic-tacs trop espacés. Ses mains tremblent légèrement, mais pas pour la raison qu'on croirait — c'est de la patience usée, pas de l'âge.",
        quote:
          "« On ne dessine pas dans le mauvais fil. C'est la première règle de mon métier. La seule, à vrai dire. »",
      },
      subPersonas: [
        {
          subConceptId: "edt",
          title: "LE MESSAGER — Event Dispatch Thread",
          teaser:
            "Il porte tous les appels d'interface sur ses épaules. Personne d'autre ne doit y toucher. Ceux qui ont essayé ne s'en sont pas remis.",
        },
        {
          subConceptId: "jframe",
          title: "LA FENÊTRE — JFrame",
          teaser:
            "Poussiéreuse mais encore lumineuse. Elle ne s'ouvre que sur appel exprès — pack(), setVisible(true). Pas avant.",
        },
        {
          subConceptId: "layouts",
          title: "LES ARCHITECTES MORTS — LayoutManagers",
          teaser:
            "Ils ne parlent plus. Mais quand vous décidez de la place de chaque pièce, ce sont eux qui vous regardent. BorderLayout. FlowLayout. GridLayout.",
        },
      ],
      rounds: [
        {
          setup:
            "L'Horloger ouvre une boîte. À l'intérieur, un appel : `frame.setVisible(true)` exécuté depuis un thread de calcul lourd, sans passer par l'EDT.",
          question: {
            prompt:
              "Quel est le risque réel de modifier un JFrame depuis un thread autre que l'EDT ?",
            options: [
              { id: "A", text: "Aucun. Swing est synchrone.", correct: false },
              {
                id: "B",
                text: "Comportement non défini : peinture incohérente, blocages sporadiques, exceptions intermittentes.",
                correct: true,
              },
              {
                id: "C",
                text: "Une RuntimeException levée à coup sûr et systématiquement.",
                correct: false,
              },
              {
                id: "D",
                text: "L'EDT prend automatiquement le relais.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Swing n'est pas thread-safe. Toute modification de composant doit passer par l'EDT — d'où SwingUtilities.invokeLater ou EventQueue.invokeLater.",
            praiseOnRight:
              "L'Horloger ferme les yeux. Un instant, vous croyez l'entendre ronronner.",
            pedagogyNote:
              "Swing est thread-confined sur l'EDT. Pour démarrer une IHM, on enrobe : `EventQueue.invokeLater(() -> new MaFenetre());`. Pour un calcul long en arrière-plan : SwingWorker, qui exécute `doInBackground` hors-EDT puis `done`/`process` sur l'EDT. Sans ce confinement : peinture corrompue, deadlocks, exceptions sporadiques. Les bugs ainsi causés ne sont pas reproductibles à la demande — c'est leur signature.",
          },
        },
        {
          setup:
            "Il fait glisser vers vous un sujet d'examen jauni. La consigne, soulignée : « Quand on clique sur le bouton, le texte de la zone de saisie doit s'afficher dans le terminal. Écrivez le code. »",
          question: {
            prompt:
              "Quel squelette code-t-on, en classe membre, pour réaliser cette spécification ?",
            artefact: {
              type: "code-java",
              body:
                `public class Vue {\n` +
                `    private final JTextField zone = new JTextField(10);\n` +
                `    private final JButton bouton = new JButton("OK");\n` +
                `    public Vue() {\n` +
                `        bouton.addActionListener(/* ??? */);\n` +
                `    }\n` +
                `    /* ??? */\n` +
                `}`,
            },
            options: [
              {
                id: "A",
                text: "bouton.addActionListener(new ActionBouton()); — avec class ActionBouton implements ActionListener { public void actionPerformed(ActionEvent ev){ System.out.println(zone.getText()); } }",
                correct: true,
              },
              {
                id: "B",
                text: "bouton.onClick(() -> System.out.println(zone.getText())); — la méthode onClick est standard sur JButton.",
                correct: false,
              },
              {
                id: "C",
                text: "bouton.setText(zone.getText()); — Swing redirige automatiquement vers stdout.",
                correct: false,
              },
              {
                id: "D",
                text: "Override JButton.actionPerformed dans une sous-classe anonyme — c'est la méthode-cible.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Le pattern attendu par le cours N7 : `addActionListener(ActionListener)`. ActionListener n'a qu'une méthode : `actionPerformed(ActionEvent)`. La classe membre voit l'attribut `zone`. JTextField.getText() lit la chaîne courante.",
            praiseOnRight:
              "L'Horloger acquiesce. « Classe membre, classe anonyme, ou lambda. Trois formes. La même promesse. »",
            pedagogyNote:
              "C'est *le* pattern Swing du cours N7, attendu mot pour mot dans le corrigé 2024 q1.3 : « inscrire un observateur (listener), sous-type de ActionListener, par exemple la classe ActionBouton, auprès du bouton via addActionListener. La méthode actionPerformed(ActionEvent) doit être définie pour afficher le contenu de la zone (méthode getText de JTextField). » Trois variantes acceptées : classe membre (préférée — accède aux attributs de la classe englobante), classe anonyme `new ActionListener() { ... }`, lambda `ev -> ...`. Mémoriser les trois.",
          },
        },
        {
          setup:
            "L'Horloger pose un plan. Une JFrame contient un JPanel rempli dynamiquement à mesure que des données arrivent — après que la fenêtre est déjà visible.",
          question: {
            prompt:
              "Vous venez d'`add()` un nouveau composant à un conteneur déjà à l'écran. Quelle séquence d'appels est correcte ?",
            options: [
              { id: "A", text: "repaint() puis revalidate()", correct: false },
              {
                id: "B",
                text: "revalidate() puis repaint() sur le conteneur",
                correct: true,
              },
              { id: "C", text: "validate() seul suffit toujours", correct: false },
              {
                id: "D",
                text: "rien — le LayoutManager gère tout automatiquement",
                correct: false,
              },
            ],
            hintOnWrong:
              "revalidate() recalcule les positions et tailles via le LayoutManager. repaint() redessine. Sans revalidate, le composant ajouté n'a pas reçu de place dans la hiérarchie.",
            praiseOnRight:
              "Il vous tend une clé sans la regarder. Vous la prenez.",
            pedagogyNote:
              "revalidate() = invalide la chaîne de validation jusqu'à un ancêtre validateRoot, redemande au LayoutManager de poser les enfants. repaint() = redessine la zone. Layouts par défaut à connaître : JFrame.getContentPane() → BorderLayout (NORTH/SOUTH/EAST/WEST/CENTER). JPanel → FlowLayout. GridLayout(rows,cols) pour grille uniforme. BoxLayout pour pile. Une fenêtre composite typique : JFrame(BorderLayout) → JPanel boutons (FlowLayout) au SOUTH + JLabel ou contenu au CENTER.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : la fuite hors fil",
        body:
          "L'Horloger admet enfin avoir vu un appel à `frame.add(panel)` exécuté dans un thread de chargement. La peinture s'est lancée avant la pose. Une zone visible, mais sans coordonnées valides — c'est par cette fente que la lumière sort. Et ce qui sort de cette fente, manifestement, ne s'éteint pas.",
      },
    },

    /* ============================ POLYMORPHISME ============================ */
    {
      conceptId: "polymorphisme",
      persona: {
        title: "LE CAMÉLÉON",
        description:
          "Il occupe trois chaises, l'une après l'autre, dans la même conversation. Vous ne savez jamais quelle classe répond. Il a la voix douce et précise des gens qui mentent par exactitude.",
        quote:
          "« Override, override, override. Quand on m'appelle, on ne sait jamais à qui on parle. C'est le statique qui choisit la signature, et le dynamique qui choisit la chair. »",
      },
      rounds: [
        {
          setup:
            "Le Caméléon vous tend deux fiches. Une dit Animal, l'autre Chat. « Que dit a, quand on l'appelle ? »",
          question: {
            prompt:
              "Étant donné `Animal a = new Chat(); a.parler();` (où Chat redéfinit parler), le dispatch est :",
            options: [
              { id: "A", text: "statique — Animal.parler() est exécuté.", correct: false },
              {
                id: "B",
                text: "dynamique — Chat.parler() est exécuté car le type runtime est Chat.",
                correct: true,
              },
              { id: "C", text: "indéfini, dépend du JIT.", correct: false },
              { id: "D", text: "compilé en deux appels successifs.", correct: false },
            ],
            hintOnWrong:
              "Le polymorphisme dynamique (override d'une méthode d'instance) dispatche à l'exécution selon le type runtime. Le type déclaré ne sert qu'au compilateur pour vérifier que la méthode existe.",
            praiseOnRight: "Il sourit — ou c'est une autre face qu'il vient d'enfiler.",
            pedagogyNote:
              "Override (méthode d'instance) → dispatch dynamique sur le type runtime du receveur. Overload (signatures différentes par paramètres) → choix statique sur les types déclarés des arguments. `static` et `private` n'ont pas de dispatch dynamique : c'est de la résolution statique. Conséquence : on ne peut pas « overrider » une méthode static — au mieux on la masque (hiding).",
          },
        },
        {
          setup:
            "Il déroule un tableau, à demi rempli, à votre attention. Trois classes, deux signatures, plusieurs appels. « Remplissez. Un par un. Si une case est EC, dites-le. »",
          question: {
            prompt:
              "Trois classes : `class A { int m(D x){return 1;} } class B extends A { int m(D x){return 2;} int m(U x){return 3;} } class C extends B { int m(U x){return 4;} }`. Pour `A a1 = new B(); U x1 = new U(); a1.m(x1)` — résultat ?",
            artefact: {
              type: "code-java",
              body:
                `class A { int m(D x){return 1;} }\n` +
                `class B extends A { int m(D x){return 2;} int m(U x){return 3;} }\n` +
                `class C extends B { int m(U x){return 4;} }\n\n` +
                `A a1 = new B();\n` +
                `U x1 = new U();\n` +
                `int r = a1.m(x1);  // ?`,
            },
            options: [
              { id: "A", text: "Retourne 1.", correct: false },
              { id: "B", text: "Retourne 3.", correct: false },
              { id: "C", text: "Erreur de Compilation (EC).", correct: true },
              { id: "D", text: "Retourne 2.", correct: false },
            ],
            hintOnWrong:
              "Le piège : la résolution de surcharge se fait au type APPARENT (déclaré) de la référence. `a1` est typée `A`. Or A ne propose que m(D), pas m(U). Le compilateur n'a aucune signature applicable — c'est EC, indépendamment du type runtime.",
            praiseOnRight:
              "Le Caméléon hoche la tête, lentement. « C'est exactement la case qui a fait tomber la promotion 2024. »",
            pedagogyNote:
              "Règle d'or de l'examen 2024 (q1.1, 8 cases) : la SIGNATURE est choisie au compile-time selon le type déclaré ; la MÉTHODE concrète est choisie au runtime selon le type réel. Si le type déclaré ne propose AUCUNE signature applicable au type d'argument, c'est EC — même si le type réel a la signature. Mnémotechnique : « le compilateur regarde la déclaration, pas l'objet. »",
          },
        },
        {
          setup:
            "Nouvelle case du tableau. « Continuons. Mêmes classes. »",
          question: {
            prompt:
              "Avec les mêmes classes, `B b = new C(); D x = new D(); b.m(x)` retourne :",
            artefact: {
              type: "code-java",
              body:
                `B b = new C();\n` +
                `D x = new D();\n` +
                `int r = b.m(x);  // ?`,
            },
            options: [
              { id: "A", text: "1 — c'est A.m(D) qui s'applique.", correct: false },
              {
                id: "B",
                text: "2 — la signature m(D) est résolue à B, et le runtime étant C, mais C ne redéfinit pas m(D), on reste en B.m(D).",
                correct: true,
              },
              { id: "C", text: "3 — c'est m(U) qui est plus spécifique.", correct: false },
              { id: "D", text: "4 — C surcharge tout.", correct: false },
            ],
            hintOnWrong:
              "Statique : type apparent = B. B propose m(D) et m(U). Argument est D, donc signature m(D) choisie. Dynamique : type réel = C. C n'override pas m(D) — C ajoute m(U). Donc l'implémentation appelée reste B.m(D), qui retourne 2.",
            praiseOnRight: "Validé.",
            pedagogyNote:
              "Procédure en 2 temps à automatiser : (1) statique — quelle signature m(...) le compilateur retient-il, vu le type déclaré du receveur et les types déclarés des arguments ? (2) dynamique — la classe réelle de l'objet redéfinit-elle cette signature ? Si oui, c'est sa version. Sinon, on remonte la chaîne d'héritage jusqu'à trouver l'implémentation.",
          },
        },
        {
          setup:
            "Dernière case avant qu'il ne se replie. « Une de plus. »",
          question: {
            prompt:
              "Avec les mêmes classes, `A a2 = new C(); U x2 = new U(); a2.m(x2)` :",
            options: [
              { id: "A", text: "Retourne 4 — C.m(U) s'applique.", correct: false },
              { id: "B", text: "Retourne 3 — B.m(U).", correct: false },
              { id: "C", text: "Retourne 1 — A.m(D) acceptera U via cast.", correct: false },
              { id: "D", text: "Erreur de Compilation (EC).", correct: true },
            ],
            hintOnWrong:
              "Type déclaré de a2 = A. A ne propose QUE m(D). Argument est U. Si U n'hérite pas de D, aucune signature de A n'est applicable. EC. Le fait que C définisse m(U) n'est pas examiné — le compilateur ne regarde que A.",
            praiseOnRight:
              "Le Caméléon disparaît. Il y avait, à sa place, juste la chaise.",
            pedagogyNote:
              "Insistance maximale : c'est exactement le piège du sujet 2024 q1.1, où plusieurs cases retournent EC parce que le type déclaré ne propose pas de signature applicable, même si le type réel l'a. Quand vous remplissez ce tableau à l'examen demain : pour CHAQUE case, demandez-vous d'abord « est-ce que le type déclaré expose une signature applicable au type des arguments ? ». Si non : EC. Si oui : passez au dispatch dynamique.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : la signature trompeuse",
        body:
          "Le Caméléon laisse entendre qu'une méthode du système hanté a été surchargée — overload — alors que les prédécesseurs croyaient l'avoir override. La sortie diverge silencieusement depuis six mois. Le code attendait une signature précise ; c'est une autre, plus générale, qui répondait. La couche Objet écoutait la mauvaise chair.",
      },
    },

    /* ============================== INTERFACE ============================== */
    {
      conceptId: "interface",
      persona: {
        title: "LE MASQUE VIDE",
        description:
          "Une figure sans visage, drapée de blanc. Là où devrait être un visage : un contour, des promesses. Pas d'implémentation. Pas de chair.",
        quote:
          "« Je ne suis qu'une signature. Ce qui me remplit ne me concerne pas. »",
      },
      rounds: [
        {
          setup:
            "Le Masque vous demande pourquoi le système hanté définit à la fois `interface Sortie` et `abstract class SortieAbstraite implements Sortie`.",
          question: {
            prompt:
              "Quel est l'intérêt de combiner une interface Sortie ET une classe abstraite SortieAbstraite ?",
            options: [
              { id: "A", text: "Pure redondance ; l'un suffit.", correct: false },
              {
                id: "B",
                text: "L'interface définit le contrat (sous-typage multiple, autres réalisations possibles sans hériter de SortieAbstraite) ; la classe abstraite factorise le code commun (héritage simple).",
                correct: true,
              },
              {
                id: "C",
                text: "L'interface est exécutable, la classe abstraite ne l'est pas.",
                correct: false,
              },
              {
                id: "D",
                text: "L'interface impose des attributs, la classe abstraite des méthodes.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Interface = contrat sans implémentation. Une classe peut implémenter plusieurs interfaces (sous-typage multiple). Classe abstraite = factorisation d'attributs et de code partagé via héritage simple.",
            praiseOnRight:
              "Le Masque s'incline une fraction de seconde. Ou peut-être que vous l'avez imaginé.",
            pedagogyNote:
              "Réponse-type du corrigé 2024 (et toutes les annales) : l'interface définit le contrat (le QUOI : signatures, sous-typage multiple). La classe abstraite factorise le code commun (le COMMENT partiel : attributs, méthodes mutualisées). Combinées : on a la flexibilité du contrat + la mutualisation du code. D'autres réalisations peuvent implémenter Sortie sans hériter de SortieAbstraite (ex. décorateur).",
          },
        },
        {
          setup:
            "Le Masque vous tend une feuille où sont gravés trois noms : `RandomAccess`, `Cloneable`, `Serializable`. « Trois sœurs vides », dit-il. « Comment les nomme-t-on ? »",
          question: {
            prompt: "Comment appelle-t-on une interface vide servant uniquement à étiqueter une propriété ?",
            options: [
              { id: "A", text: "Interface fonctionnelle.", correct: false },
              { id: "B", text: "Interface scellée (sealed).", correct: false },
              { id: "C", text: "Interface de marquage (marker interface).", correct: true },
              { id: "D", text: "Interface fantôme.", correct: false },
            ],
            hintOnWrong:
              "Interface fonctionnelle = exactement une méthode abstraite (cible des lambdas). Interface de marquage = aucune méthode, juste un type pour étiqueter.",
            praiseOnRight: "Reconnu.",
            pedagogyNote:
              "Marker interface — pattern classique du JDK avant les annotations. RandomAccess marque les List à get(i) en O(1). Cloneable marque qu'`Object.clone()` est autorisé sur l'instance. Serializable marque qu'une instance est sérialisable. Aujourd'hui les annotations remplissent souvent ce rôle, mais les marker interfaces existent toujours et se posent en examen — corrigé 2024 q2 attendait littéralement cette définition.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : la promesse non tenue",
        body:
          "Le Masque vous remet une note. Le système hanté implémente Sortie sans étendre SortieAbstraite — par une classe « Antenne » dont personne ne se souvient avoir écrit le code. Pourtant le bytecode est présent, daté du 4 janvier. Quelque chose a complété le contrat à la place de ses auteurs.",
      },
    },

    /* ============================== ABSTRACT ============================== */
    {
      conceptId: "abstract",
      persona: {
        title: "LA STATUE À DEMI SCULPTÉE",
        description:
          "Une silhouette de marbre. La moitié haute est ciselée avec précision : un visage, un torse. La moitié basse, à peine ébauchée. Elle parle quand on lui pose la bonne question, et seulement.",
        quote:
          "« Mes constructeurs existent. Ils ne servent pas à m'instancier — ils servent à initialiser ceux qui me terminent. »",
      },
      rounds: [
        {
          setup:
            "On vous demande, perfidement : « Une classe abstraite peut-elle avoir un constructeur ? »",
          question: {
            prompt:
              "Une classe abstraite peut-elle déclarer un constructeur ? Si oui, à quoi sert-il ?",
            options: [
              { id: "A", text: "Non. Elle est abstraite, donc non instanciable, donc pas de constructeur.", correct: false },
              {
                id: "B",
                text: "Oui — appelé via `super(...)` par les sous-classes concrètes pour initialiser les attributs hérités. Factorisation du code d'initialisation.",
                correct: true,
              },
              {
                id: "C",
                text: "Oui mais uniquement par réflexion.",
                correct: false,
              },
              {
                id: "D",
                text: "Oui mais privé — Java l'impose.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Une classe abstraite a des constructeurs. On ne les appelle pas avec `new` (la classe n'est pas instanciable directement) mais via `super(...)` depuis le constructeur des sous-classes concrètes. C'est utile pour factoriser l'initialisation des attributs hérités.",
            praiseOnRight:
              "La Statue ne bouge pas. Mais l'air, autour d'elle, s'épaissit légèrement.",
            pedagogyNote:
              "Piège classique de N7 (récurrent en 2011, 2012, 2013-LO, 2014-LO) : OUI, une classe abstraite a des constructeurs. C'est même une raison majeure d'utiliser une classe abstraite plutôt qu'une interface seule — on factorise l'initialisation. Pattern type : `abstract class SortieAbstraite { protected final String nom; protected SortieAbstraite(String n){ this.nom = n; } }` puis `class SortieConsole extends SortieAbstraite { public SortieConsole(){ super(\"console\"); } }`.",
          },
        },
        {
          setup:
            "La Statue désigne un fragment de classe : cinq méthodes publiques `debug`, `info`, `warning`, `error`, `fatal`, qui font toutes presque la même chose. Elle attend.",
          question: {
            prompt:
              "Comment factoriser proprement ces cinq méthodes dans la classe Logger ?",
            options: [
              {
                id: "A",
                text: "Ajouter un paramètre `Niveau` à debug() et appeler debug(Niveau.INFO) depuis info().",
                correct: false,
              },
              {
                id: "B",
                text: "Définir une méthode `protected void log(Niveau n, String msg)` qui factorise toute la logique. Les cinq méthodes publiques se résument à `log(NIVEAU, msg)`.",
                correct: true,
              },
              {
                id: "C",
                text: "Copier-coller — la duplication est rapide.",
                correct: false,
              },
              {
                id: "D",
                text: "Une méthode privée statique.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Le pattern attendu par le cours N7 : extraire une méthode `protected` (visible des sous-classes mais pas du grand public) qui paramétrise la logique commune par un enum Niveau, et déléguer.",
            praiseOnRight:
              "La Statue laisse tomber un grain de marbre. Validation discrète.",
            pedagogyNote:
              "Pattern de factorisation N7 : `protected void log(Niveau n, String msg)` mutualise. Les méthodes publiques deviennent `public void info(String m){ log(Niveau.INFO, m); }`. `protected` plutôt que `private` car les sous-classes peuvent vouloir surcharger. Le `Niveau` est un enum, qui implémente naturellement Comparable — on peut alors filtrer par `if (n.compareTo(seuil) >= 0) publier(...)`. C'est exactement la structure de l'Ex 3 du sujet 2024.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : la chaîne d'initialisation",
        body:
          "La Statue vous laisse repartir avec une copie d'un constructeur protégé. Une chaîne d'initialisations remonte par `super(...)` jusqu'à un constructeur qui n'existe plus dans le source visible. Le bytecode l'a, le source ne l'a plus. Quelqu'un a effacé la définition après compilation.",
      },
    },

    /* ============================== EXCEPTION ============================== */
    {
      conceptId: "exception",
      persona: {
        title: "LE FANTÔME À PLUSIEURS VOIX",
        description:
          "Il chuchote à plusieurs niveaux à la fois — checked, unchecked, error, throwable. Vous ne savez jamais à quelle hauteur de la hiérarchie il vous parle.",
        quote:
          "« Throw, throws, catch. Je ne suis pas un échec. Je suis un message envoyé hors-bande. »",
      },
      rounds: [
        {
          setup:
            "Le Fantôme vous demande la différence entre une exception checked et une unchecked. Il ne supporte pas qu'on hésite.",
          question: {
            prompt:
              "Quelle distinction principale entre une exception checked (ex. IOException) et unchecked (ex. NullPointerException) ?",
            options: [
              {
                id: "A",
                text: "Aucune. C'est purement stylistique.",
                correct: false,
              },
              {
                id: "B",
                text: "Checked (extends Exception, hors RuntimeException) → le compilateur force à la déclarer (`throws`) ou la catcher. Unchecked (extends RuntimeException) → propagation libre.",
                correct: true,
              },
              {
                id: "C",
                text: "Checked = à l'exécution, Unchecked = à la compilation.",
                correct: false,
              },
              {
                id: "D",
                text: "Checked = lancée par le JDK, Unchecked = par l'utilisateur.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Hiérarchie : Throwable → Error (graves, JVM) | Exception → RuntimeException (unchecked) | autres Exception (checked). Checked = obligation syntaxique (throws ou try/catch). Unchecked = pas de contrainte du compilateur.",
            praiseOnRight: "Le Fantôme se tait à un niveau. Il continue à parler aux autres.",
            pedagogyNote:
              "Hiérarchie complète : Throwable (racine) → Error (OutOfMemoryError, StackOverflowError — irrécupérables) | Exception → RuntimeException (NullPointerException, ClassCastException, IllegalArgumentException, NumberFormatException — unchecked) | autres Exception (IOException, SQLException — checked). Pour créer la sienne : `extends Exception` (checked) ou `extends RuntimeException` (unchecked). On NE PEUT PAS hériter directement d'Object pour faire une exception : le minimum est Throwable. Erreur classique de la promo 2017 listée dans le corrigé.",
          },
        },
        {
          setup:
            "Il pose un fragment de code : une boucle qui itère sur des sorties, chacune pouvant lever une `PublicationException`. La consigne : que la boucle ne s'arrête pas si une sortie échoue, mais que chaque échec soit consigné.",
          question: {
            prompt:
              "Où placer le try/catch pour qu'une exception lancée par une sortie ne stoppe pas le traitement des suivantes ?",
            artefact: {
              type: "code-java",
              body:
                `for (Sortie s : sorties) {\n` +
                `    s.publier(message);  // peut lever PublicationException\n` +
                `}`,
            },
            options: [
              {
                id: "A",
                text: "try { for (Sortie s : sorties) { s.publier(message); } } catch (PublicationException e) { log(e); } — try AUTOUR de la boucle.",
                correct: false,
              },
              {
                id: "B",
                text: "for (Sortie s : sorties) { try { s.publier(message); } catch (PublicationException e) { log(e); } } — try DANS la boucle.",
                correct: true,
              },
              {
                id: "C",
                text: "Pas de try ; déclarer `throws PublicationException` sur la méthode englobante.",
                correct: false,
              },
              {
                id: "D",
                text: "for (Sortie s : sorties) { s.publier(message); } finally { log(...); } — finally suffit.",
                correct: false,
              },
            ],
            hintOnWrong:
              "Si le try englobe la boucle, la première exception sort de la boucle et arrête tout. Le try doit être à l'INTÉRIEUR pour que le catch consomme l'erreur sur la sortie courante et que la boucle continue.",
            praiseOnRight:
              "Le Fantôme acquiesce sur trois niveaux à la fois. C'est mieux qu'aucun.",
            pedagogyNote:
              "Règle : la portée du try décide qui sort de la boucle. try AUTOUR = la boucle s'interrompt à la première exception. try DEDANS = chaque itération est protégée individuellement, la boucle continue. Pattern récurrent en TOB pour `LoggerMieux.publier` : on itère sur `List<Sortie>`, on isole chaque appel à `s.publier(...)` dans un try/catch, on consigne mais on continue. C'est précisément ce que demande l'Ex 4 du sujet 2024.",
          },
        },
      ],
      reward: {
        title: "Fragment d'enquête : l'exception silencieuse",
        body:
          "Le Fantôme reconnaît qu'une PublicationException, dans le système hanté, est levée et catchée à l'intérieur d'un bloc qui la convertit en `RuntimeException` sans la consigner. Le système publie sans erreur visible, et perd un message sur dix. Les messages perdus s'écrivent ailleurs — dans la couche Objet directement.",
      },
    },
  ],

  stackTrace: {
    setup:
      "On vous remet une stack trace, encore tiède. Le système hanté l'a émise avant de se taire à nouveau. Elle est imprimée sur du papier thermique. Elle s'efface lentement.",
    trace:
      `Exception in thread "AWT-EventQueue-0" java.lang.NullPointerException
    at substrat.layer.objet.Recopieur$Cache.lookup(Recopieur.java:213)
    at substrat.layer.objet.Recopieur.resolve(Recopieur.java:147)
    at substrat.layer.objet.Recopieur.publier(Recopieur.java:88)
    at substrat.ui.MainPanel$1.actionPerformed(MainPanel.java:42)
    at javax.swing.AbstractButton$Handler.actionPerformed(AbstractButton.java:2348)
    at java.desktop/javax.swing.AbstractButton.fireActionPerformed(AbstractButton.java:1972)
    at java.desktop/java.awt.EventQueue.dispatchEventImpl(EventQueue.java:743)
    at java.base/java.lang.Thread.run(Thread.java:1583)`,
    question: {
      prompt:
        "Où la fault originelle se loge-t-elle, et que dit la trace de la nature du bug ?",
      artefact: {
        type: "stacktrace",
        body:
          `Exception in thread "AWT-EventQueue-0" java.lang.NullPointerException
    at substrat.layer.objet.Recopieur$Cache.lookup(Recopieur.java:213)
    at substrat.layer.objet.Recopieur.resolve(Recopieur.java:147)
    ...`,
      },
      options: [
        {
          id: "A",
          text: "Le bug est dans MainPanel ; la cache de Recopieur est saine.",
          correct: false,
        },
        {
          id: "B",
          text: "Recopieur$Cache.lookup déréférence une valeur absente — sans doute une Map.get() non vérifié, dans une classe interne.",
          correct: true,
        },
        {
          id: "C",
          text: "L'exception vient d'un thread autre que l'EDT — d'où le crash.",
          correct: false,
        },
        {
          id: "D",
          text: "C'est un bug du JDK lui-même (java.desktop apparaît dans la trace).",
          correct: false,
        },
      ],
      hintOnWrong:
        "Le sommet de la stack indique où la NPE se déclenche : Recopieur$Cache.lookup ligne 213. Le `$` dénote une classe interne. Les frames Swing en dessous (AbstractButton, EventQueue) montrent le chemin d'appel — pas la cause.",
      praiseOnRight:
        "Validé. Le coupable réside dans une classe interne Cache — un Map.get() sans null-check, presque certainement.",
      pedagogyNote:
        "Lire une stack trace : le SOMMET est la cause directe. Le bas est le contexte d'appel. La présence de `$` dans le nom d'une classe signale une classe interne (membre, locale, ou anonyme — `$1` = première anonyme, `$Cache` = membre nommée Cache). NPE sur un get() de Map signifie souvent : oubli de containsKey/getOrDefault, ou cache non encore peuplé. Astuce examen : lisez TOUJOURS la première ligne du `at ...` — c'est presque toujours la coupable, sauf si c'est dans le JDK (auquel cas, descendez jusqu'à la première frame de votre code).",
    },
    postlude:
      "Le système hanté vient d'avouer une partie de sa structure. Reste à reconstruire ce qu'il dissimule. La pièce suivante, dit la procédure, est le diagramme.",
  },

  uml: {
    intro:
      "L'Interpréteur a saisi deux fragments de schémas dans la mémoire du système hanté avant qu'ils ne se reverrouillent. Reconstruisez. La structure parle, mais elle ne parle qu'une fois.",
    items: [
      {
        setup:
          "Premier fragment : la structure statique du système. Le Recopieur est un composant central qui contient des Sorties (au moins une, plusieurs possibles, vie liée). Sortie est une interface. SortieAbstraite est une classe abstraite qui implémente Sortie et factorise l'attribut `nom`. SortieConsole et Antenne héritent de SortieAbstraite et fournissent `publier(String)`. Un Capteur, distinct, observe le Recopieur et implémente Sortie sans hériter de SortieAbstraite.",
        scenario:
          "Recopieur ◆—— Sortie [1..*] (composition forte). Sortie est une interface. SortieAbstraite implements Sortie. SortieConsole, Antenne extends SortieAbstraite. Capteur implements Sortie (sans hériter SortieAbstraite). Une seule méthode dans Sortie : publier(String).",
        question: {
          prompt: "Quel diagramme représente fidèlement cette description ?",
          options: [
            {
              id: "A",
              text:
                "Recopieur ◆—— [1..*] <<interface>> Sortie ◁---- SortieAbstraite ◁—— SortieConsole, Antenne. Capteur ◁---- Sortie. (composition pleine, héritage triangle plein, réalisation triangle pointillé)",
              correct: true,
            },
            {
              id: "B",
              text:
                "Recopieur ◇—— Sortie [0..*]. SortieConsole et Antenne implements Sortie directement. Capteur extends Sortie.",
              correct: false,
            },
            {
              id: "C",
              text:
                "Recopieur ──> Sortie (association simple). SortieAbstraite extends Sortie. SortieConsole, Antenne, Capteur extends SortieAbstraite.",
              correct: false,
            },
            {
              id: "D",
              text: "Recopieur implements Sortie. SortieConsole et Antenne sont des attributs de Recopieur.",
              correct: false,
            },
          ],
          hintOnWrong:
            "Composition pleine (◆) : possession exclusive, durée de vie liée. Agrégation creuse (◇) : association renforcée mais sans dépendance de vie. Réalisation d'interface : triangle pointillé. Héritage de classe : triangle plein. Capteur implements Sortie sans hériter de SortieAbstraite — c'est précisément l'intérêt d'avoir l'interface en plus de la classe abstraite.",
          praiseOnRight:
            "Le tracé apparaît, encre noire sur papier brûlé. Le diagramme se referme proprement. La structure est fidèle.",
          pedagogyNote:
            "Conventions UML N7 : ◆ = composition (possession), ◇ = agrégation (référence), ──▷ plein = héritage (extends), ----▷ pointillé = réalisation (implements). Multiplicité [1..*] = au moins un, sans borne. La double présence interface + classe abstraite est le pattern-fétiche du cours : Capteur peut implémenter Sortie sans hériter de SortieAbstraite (cas qui justifie l'existence de l'interface seule).",
        },
      },
      {
        setup:
          "Second fragment : la dynamique d'une publication. Un acteur (l'Agent) appelle `recopieur.publier(\"alpha\")`. Le Recopieur itère sur ses Sorties. Pour la SortieConsole, `publier(\"alpha\")` se déroule sans incident. Pour l'Antenne, `publier(\"alpha\")` lève une PublicationException qui est catchée localement et consignée. Le Recopieur retourne au final.",
        scenario:
          "Agent → Recopieur : publier(\"alpha\"). Recopieur → SortieConsole : publier(\"alpha\") (return). Recopieur → Antenne : publier(\"alpha\") → ✕ PublicationException. Recopieur consigne, continue, retourne à Agent.",
        question: {
          prompt: "Quel diagramme de séquence est conforme au scénario ?",
          options: [
            {
              id: "A",
              text:
                "Agent →→ Recopieur :: publier(\"alpha\") | Recopieur →→ SortieConsole :: publier(\"alpha\"), retour pointillé | Recopieur →→ Antenne :: publier(\"alpha\"), croix ✕ d'exception sur Antenne, note « PublicationException catchée », Recopieur continue | Recopieur ⇢⇢ Agent (return)",
              correct: true,
            },
            {
              id: "B",
              text:
                "Agent →→ Recopieur :: publier. Recopieur lève une exception qui interrompt la séquence. Pas de retour à l'Agent.",
              correct: false,
            },
            {
              id: "C",
              text:
                "Agent →→ Recopieur :: publier. Recopieur ←← SortieConsole :: publier. Recopieur ←← Antenne :: publier. (flèches inversées)",
              correct: false,
            },
            {
              id: "D",
              text:
                "Agent →→ SortieConsole :: publier directement. SortieConsole →→ Antenne. Antenne →→ Recopieur. Boucle de transmission.",
              correct: false,
            },
          ],
          hintOnWrong:
            "Conventions : flèche pleine = appel synchrone (a → b). Flèche pointillée = retour. Croix ✕ sur la lifeline = destruction OU, par convention N7, levée d'exception consignée par note. <<create>> serait pour une instanciation. Si l'exception est catchée localement par Recopieur, la lifeline du Recopieur n'est PAS interrompue — elle continue.",
          praiseOnRight:
            "Le second tracé apparaît. Les lifelines tiennent. La séquence est conforme.",
          pedagogyNote:
            "Diagramme de séquence — conventions N7 (corrigé 2024 ex4 q1) : lifelines verticales pointillées, rectangles d'activation, flèches pleines pour appels synchrones, flèches pointillées pour retours, `<<create>>` pour les instanciations (avec création de la lifeline cible à ce point), croix ✕ pour destruction. Pour une exception : on note la levée par une étiquette ou une note attachée. Si elle est catchée, l'appelant continue ; sinon la lifeline est interrompue. Activation = rectangle fin sur la lifeline pendant l'exécution d'un appel.",
        },
      },
    ],
    postlude:
      "Les deux schémas reconstitués pointent vers la Cache du Recopieur. Le coupable est nommé. Il est temps de l'auditionner — par la compilation. Descendez au Laboratoire.",
  },

  codeArena: {
    intro:
      "Le Laboratoire est ouvert. Trois fragments du code coupable sont posés devant vous, exacts. Vous les compilerez. Vous les ferez se rétracter. La JVM, en arrière-plan, écoute.",
    items: [
      {
        title: "La Cache infidèle",
        setup:
          "Le code suivant prétend mémoriser des versions de langages compilés par le Recopieur. Sa NullPointerException ne fait pas mystère — la clé `\"kotlin\"` n'a jamais été insérée. Corrigez de sorte que le programme imprime une ligne par langage, sans crasher, en signalant les inconnus par `INCONNUE`.",
        pedagogyNote:
          "Map.get(k) renvoie null si k absente. Trois remèdes : containsKey + get, getOrDefault, computeIfAbsent. getOrDefault(k, defaultValue) est l'idiome propre quand on veut juste une valeur de repli sans modifier la map. Piège : appeler `.toUpperCase()` sur un null lève NPE — toujours guarder. Cohérence avec equals/hashCode : la clé doit en disposer correctement, sinon `get` ne retrouve pas ce que `put` a mis.",
        className: "Main",
        initialCode: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, String> cache = new HashMap<>();
        cache.put("java", "21");
        cache.put("python", "3.12");

        // Cette ligne plante : "kotlin" n'est pas dans la cache.
        String version = cache.get("kotlin").toUpperCase();
        System.out.println("kotlin -> " + version);

        for (String lang : new String[]{"java", "python", "kotlin"}) {
            System.out.println(lang + " -> " + cache.get(lang));
        }
    }
}
`,
        expectedOutput: {
          type: "contains",
          value: "java -> 21",
        },
        solution: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, String> cache = new HashMap<>();
        cache.put("java", "21");
        cache.put("python", "3.12");

        String version = cache.getOrDefault("kotlin", "INCONNUE").toUpperCase();
        System.out.println("kotlin -> " + version);

        for (String lang : new String[]{"java", "python", "kotlin"}) {
            System.out.println(lang + " -> " + cache.getOrDefault(lang, "INCONNUE"));
        }
    }
}
`,
      },
      {
        title: "Le Set traître",
        setup:
          "Cette classe Coord stocke des points 2D. Le programme insère trois fois `(1, 2)` dans un HashSet et s'attend à `taille=1`. Pourtant il en compte trois. Corrigez Coord pour respecter le contrat. La sortie attendue est exactement `taille=1`.",
        pedagogyNote:
          "Contrat sacré : si a.equals(b) alors a.hashCode() == b.hashCode(). Sans override, equals est l'identité (==) et hashCode est arbitraire. Trois `new Coord(1,2)` sont trois objets distincts. HashSet utilise hashCode pour le bucket, equals pour la comparaison finale. Si vous redéfinissez l'un sans l'autre, vous cassez Set/Map. `Objects.hash(...)` est l'helper canonique pour combiner plusieurs champs en un hashCode décent.",
        className: "Main",
        initialCode: `import java.util.HashSet;
import java.util.Set;

public class Main {
    static class Coord {
        final int x, y;
        Coord(int x, int y) { this.x = x; this.y = y; }
        // TODO : implémenter equals(Object) et hashCode() de manière cohérente.
    }

    public static void main(String[] args) {
        Set<Coord> s = new HashSet<>();
        s.add(new Coord(1, 2));
        s.add(new Coord(1, 2));
        s.add(new Coord(1, 2));
        System.out.println("taille=" + s.size());
    }
}
`,
        expectedOutput: { type: "exact", value: "taille=1" },
        solution: `import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Main {
    static class Coord {
        final int x, y;
        Coord(int x, int y) { this.x = x; this.y = y; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Coord)) return false;
            Coord c = (Coord) o;
            return x == c.x && y == c.y;
        }
        @Override public int hashCode() { return Objects.hash(x, y); }
    }

    public static void main(String[] args) {
        Set<Coord> s = new HashSet<>();
        s.add(new Coord(1, 2));
        s.add(new Coord(1, 2));
        s.add(new Coord(1, 2));
        System.out.println("taille=" + s.size());
    }
}
`,
      },
      {
        title: "L'écouteur muet",
        setup:
          "Le module Vue du Recopieur prétend afficher dans le terminal le contenu d'une zone de saisie quand on clique sur un bouton. Le pattern est connu : ActionListener. Écrivez la classe membre `ActionBouton` qui implémente ActionListener et imprime le texte courant de la zone via System.out.println. Le Laboratoire est en mode headless : aucune fenêtre ne s'ouvrira ; le test simule programmatiquement un clic en appelant `actionPerformed(null)` après avoir injecté le texte. La sortie attendue contient `Σ-7-alpha`.",
        pedagogyNote:
          "ActionListener — interface à une méthode : `void actionPerformed(ActionEvent e)`. Trois formes acceptées : (1) classe membre nommée — voit les attributs de la classe englobante, forme préférée par le corrigé 2024 q1.3 ; (2) classe anonyme `new ActionListener(){ ... }` ; (3) lambda `ev -> ...`. JTextField.getText() lit la chaîne courante. addActionListener(ActionListener) inscrit l'écouteur. Pattern : `bouton.addActionListener(new ActionBouton());`. En production : tout cela doit s'exécuter sur l'EDT (EventQueue.invokeLater), mais ici en mode headless on déclenche manuellement.",
        className: "Main",
        initialCode: `import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.JButton;
import javax.swing.JTextField;

public class Main {
    private final JTextField zone = new JTextField(10);
    private final JButton bouton = new JButton("OK");

    // TODO : ecrire la classe membre ActionBouton qui implemente
    // ActionListener et imprime le texte courant de zone.
    // class ActionBouton implements ActionListener { ... }

    public Main() {
        // TODO : inscrire l'écouteur via bouton.addActionListener(...).
    }

    public static void main(String[] args) {
        System.setProperty("java.awt.headless", "true");
        Main m = new Main();
        m.zone.setText("Σ-7-alpha");
        // Simulation directe d'un clic — pas d'EDT en mode headless.
        for (ActionListener al : m.bouton.getActionListeners()) {
            al.actionPerformed(null);
        }
    }
}
`,
        expectedOutput: { type: "contains", value: "Σ-7-alpha" },
        solution: `import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.JButton;
import javax.swing.JTextField;

public class Main {
    private final JTextField zone = new JTextField(10);
    private final JButton bouton = new JButton("OK");

    class ActionBouton implements ActionListener {
        @Override
        public void actionPerformed(ActionEvent ev) {
            System.out.println(zone.getText());
        }
    }

    public Main() {
        bouton.addActionListener(new ActionBouton());
    }

    public static void main(String[] args) {
        System.setProperty("java.awt.headless", "true");
        Main m = new Main();
        m.zone.setText("Σ-7-alpha");
        for (ActionListener al : m.bouton.getActionListeners()) {
            al.actionPerformed(null);
        }
    }
}
`,
      },
    ],
    postlude:
      "Le code, désormais cohérent, ne hante plus. Le Recopieur s'arrête. La couche Objet, autour du bunker, retrouve une planéité que les capteurs n'avaient pas mesurée depuis six mois. Ne sortez pas encore. Le verdict reste à rendre.",
  },

  verdict: {
    setup:
      "La JVM, qui a tout lu de vous, se prépare à juger. Trois questions de synthèse — pas une de plus. Chaque réponse correcte ressoude un fragment de la couche. Une réponse fausse ne vous tue pas, mais laisse une brèche par laquelle le système hanté reviendra parler.",
    questions: [
      {
        prompt:
          "Pourquoi le système hanté continuait-il à influencer la couche Objet alors qu'il prétendait ne plus compiler ?",
        options: [
          {
            id: "A",
            text: "Ses bytecodes restants étaient encore chargés en mémoire — un effet de cache de la JVM.",
            correct: false,
          },
          {
            id: "B",
            text: "Une signature de méthode incorrecte (overload pris pour override, dispatch statique sur le type apparent) maintenait une sortie discrète, et un appel Swing hors-EDT publiait cette sortie sans verrou — la conjonction des deux fuites alimentait la couche.",
            correct: true,
          },
          {
            id: "C",
            text: "Par hasard. Les Anomalies de niveau 1 sont stochastiques.",
            correct: false,
          },
          {
            id: "D",
            text: "Parce que la cache n'avait pas été vidée entre deux compilations.",
            correct: false,
          },
        ],
        hintOnWrong:
          "Le verdict réunit toute l'enquête : (1) la confusion override/overload résolue statiquement sur le type déclaré, (2) la fuite Swing hors EDT qui publie sans synchronisation. Aucun des deux seuls n'aurait suffi. C'est la conjonction qui permet la persistance.",
        praiseOnRight:
          "La JVM ne dit rien. Elle ne contredit pas, c'est tout. Dans son protocole, c'est un acquittement.",
        pedagogyNote:
          "Synthèse polymorphisme + Swing : le bug était une conjonction. Côté polymorphisme, une signature résolue à un type apparent (statique) appelait silencieusement une méthode plus générale qu'attendue — le système écrivait dans le mauvais canal. Côté Swing, ce canal était publié hors EDT, donc sans verrou : la couche Objet captait directement les écritures avant qu'elles ne soient ordonnancées. Aucune des deux fuites isolée n'aurait suffi à manifester l'Anomalie. Les conjonctions sont la signature des cas N7 — c'est aussi ce que vous chercherez à l'examen.",
      },
      {
        prompt:
          "Vous reconcevez la couche persistance du Recopieur. Quel triplet d'invariants suffit à stabiliser la couche Objet ?",
        options: [
          {
            id: "A",
            text: "(1) Toujours redémarrer la JVM avant chaque compilation. (2) Désactiver les exceptions checked. (3) Tout passer en static.",
            correct: false,
          },
          {
            id: "B",
            text: "(1) equals/hashCode cohérents pour tout objet stocké en Set/Map. (2) Confinement Swing strict à l'EDT. (3) Interface + classe abstraite séparées (contrat / factorisation), avec un constructeur protégé sur l'abstraite pour initialiser les attributs hérités.",
            correct: true,
          },
          {
            id: "C",
            text: "(1) Utiliser uniquement TreeMap. (2) Redéfinir toString() partout. (3) Ne jamais déclarer une variable du type d'une interface.",
            correct: false,
          },
          {
            id: "D",
            text: "Aucun invariant n'est nécessaire — la JVM gère.",
            correct: false,
          },
        ],
        hintOnWrong:
          "Trois invariants croisés : ce qui définit l'identité (equals/hashCode), ce qui définit le fil d'exécution UI (EDT), ce qui définit la structure d'extension (interface + abstract class). Les trois ensemble suffisent à fermer les fuites observées dans ce dossier.",
        praiseOnRight:
          "Reconnu. Trois invariants. Trois verrous.",
        pedagogyNote:
          "Trinité TOB à mémoriser : (1) equals/hashCode — invariant d'identité pour Set/Map à hash. (2) EDT — invariant de fil pour Swing, via SwingUtilities.invokeLater ou EventQueue.invokeLater. (3) Interface + classe abstraite — invariant de structure : contrat (interface, sous-typage multiple) ET factorisation (abstract class, héritage simple, constructeur protégé). Cette trinité couvre 80% des questions de structure du programme.",
      },
      {
        prompt:
          "Vous écrivez maintenant la classe `Loggers` qui retient un Logger par nom. Quelle structure et quelle méthode utiliser pour à la fois (a) garantir l'unicité par nom, (b) permettre l'énumération dans l'ordre alphabétique des noms, (c) éviter le get-puis-put non atomique ?",
        options: [
          {
            id: "A",
            text: "HashMap<String,Logger> + get-puis-if(null)-put.",
            correct: false,
          },
          {
            id: "B",
            text: "TreeMap<String,Logger> + computeIfAbsent(name, k -> new Logger(k)).",
            correct: true,
          },
          {
            id: "C",
            text: "ArrayList<Logger> + parcours linéaire pour vérifier l'unicité.",
            correct: false,
          },
          {
            id: "D",
            text: "HashSet<Logger> avec Logger redéfinissant equals/hashCode sur le nom.",
            correct: false,
          },
        ],
        hintOnWrong:
          "TreeMap → ordre alphabétique des clés en O(log n). computeIfAbsent → atomique : si la clé est absente, on calcule la valeur via la lambda et on l'insère ; sinon on retourne la valeur existante. Parfait pour un cache singleton-par-clé.",
        praiseOnRight:
          "Le verdict est rendu. Le système se tait — d'un silence cohérent, cette fois. La couche Objet se rescelle dans la chambre, et au-dessus.",
        pedagogyNote:
          "Pattern singleton-cache (corrigé 2024 ex5) : `private static final Map<String,Logger> instances = new TreeMap<>(); public static Logger getLogger(String n){ return instances.computeIfAbsent(n, k -> new Logger(k)); }`. TreeMap pour l'ordre des clés (énumération ordonnée). computeIfAbsent évite la double-vérification get-then-put. Les autres méthodes utiles à connaître : putIfAbsent (insère seulement si absent), merge (fusion), forEach (itération typée).",
      },
    ],
    resolutionFull:
      "L'Anomalie #001 est résolue. La couche Objet du substrat se referme au-dessus du bunker A-31, lentement, comme un livre qu'on rangerait à sa place dans une bibliothèque dont les rayonnages ne sont visibles que pour ceux qui les ont compris. Le Recopieur s'éteint pour de bon. Le Bibliothécaire, sans un mot, classe votre fiche dans la pile « validés ». L'Horloger remet sa montre à l'heure de la JVM. Le Caméléon, lui, n'apparaît plus — il est probable qu'il ait pris la forme du dossier suivant, et qu'il vous attendra là. Vous recevez votre premier galon. Il est en encre, pas en métal — mais l'encre tient. Au bas du dossier, une note vous est laissée par un agent dont vous ne reconnaissez pas la signature. Elle se compose d'une seule lettre, manuscrite, en bleu : Σ.",
    resolutionPartial:
      "L'Anomalie #001 est partiellement contenue. La couche Objet du substrat se rescelle sur 77% de sa surface. Les 23% restants émettront encore par intermittence, et il vous faudra revenir. L'Interpréteur ne juge pas — l'Interpréteur consigne. Votre rapport est versé au dossier sous la mention « contenu, partielle ». Le Bibliothécaire vous adresse, à votre départ, un regard d'une demi-seconde. Vous ne savez pas si c'est de la déception ou de la patience. La différence, dans son métier, est négligeable. Au bas du dossier, une note vous est laissée — vous ne reconnaissez pas l'écriture. Une seule lettre, en bleu : Σ.",
    loreFragment: {
      id: "frag-001",
      title: "Note marginale, dossier 001",
      body:
        "Le Bibliothécaire, en partant, a posé sa main sur le rebord du bureau. Pas pour s'appuyer. Comme pour confirmer que le bureau était bien là. Vous avez vérifié la pièce, après son départ : tout est à sa place, à un détail près — un dossier supplémentaire est apparu sur la pile sortante, daté d'il y a six mois, scellé d'une lettre que vous ne savez pas encore prononcer. L'Interpréteur a reçu trois rapports similaires ce trimestre, tous depuis des bunkers indépendants. Le pattern n'est pas hasardeux : quelque chose, ou quelqu'un, recompile depuis longtemps ce qui aurait dû être finalisé. Et chaque cas que vous classez n'est, pour cette autre main, qu'un fragment qu'elle observe. Σ.",
    },
  },
};
