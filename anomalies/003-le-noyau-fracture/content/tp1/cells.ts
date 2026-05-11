import type { Cell, TPContent } from "../cell-types";

/**
 * TP1 — Processus. 10 cellules.
 *
 * Profil d'Alexis pris en compte (rapport-os.md) :
 * - 1.1 et 1.2 déjà acquis (fork basique, COW). On consolide rapidement.
 * - 1.3 partiel : il sait wait(&status), il ne sait pas encore décoder
 *   le mode de fin (WIFEXITED/WIFSIGNALED). Cell 07 cible cela.
 * - Confusion historique zombie/orphelin → cell 08 consolide.
 * - exec, convention argv NULL-terminé, famille execl/execv → cell 09.
 * - Le minishell (section 2 TP1) → la Chambre du rendu.
 *
 * Voix : sec, tutoiement, factuelle. Pas d'emoji.
 * "Pourquoi ce design ?" sur ~70% des cellules (architectures / choix
 * historiques).
 */

const cells: Cell[] = [
  // ============================================================
  // CELL 01 — Le noyau live
  // ============================================================
  {
    id: "tp1-01-noyau-live",
    number: 1,
    title: "Le noyau live",
    concept: ["pid", "getpid", "getppid", "userspace"],
    theory:
      "Tu es un agent dans l'espace utilisateur. Le kernel t'a alloué un **PID**, une stack, un espace adressable virtuel. `getpid()` renvoie ton PID. `getppid()` renvoie celui de ton processus parent — typiquement le shell qui t'a lancé.",
    whyBox:
      "`getppid()` existe pour qu'un processus sache **qui l'a spawné** sans le demander au shell. Utile pour : un fils qui veut signaler son père, un daemon qui détecte qu'il a été détaché (`getppid() == 1`), un debugger qui se cale sur le tracee.",
    starterCode: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("PID=%d PPID=%d\\n", getpid(), getppid());
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-matches", pattern: "^PID=\\d+ PPID=\\d+$", flags: "m" },
        { type: "exit-code", code: 0 },
      ],
    },
    analysis:
      "Le PID change à chaque run — il est attribué dynamiquement par le kernel. Le PPID est ici le PID du `bash -c` qui lance ton binaire dans la sandbox (donc lui aussi varie).",
    refs: [
      {
        label: "man 2 getpid",
        url: "https://man7.org/linux/man-pages/man2/getpid.2.html",
      },
    ],
  },

  // ============================================================
  // CELL 02 — fork : la photocopie
  // ============================================================
  {
    id: "tp1-02-fork-photocopie",
    number: 2,
    title: "fork() : la photocopie",
    concept: ["fork", "duplication", "cow"],
    theory:
      "`fork()` crée un nouveau processus : copie quasi-identique de l'appelant (mêmes data, même stack, même PC). Après `fork()`, **deux processus** exécutent la suite. Le kernel les ordonnance indépendamment.",
    whyBox:
      "Unix a choisi *cloner* plutôt que *spawn(new_program)* (modèle Windows `CreateProcess`). Avantage : le fils peut **modifier son environnement** (descripteurs, ulimits, masque de signaux) avant d'éventuellement exec. C'est ce qui rend les shells implémentables avec si peu de primitives.",
    starterCode: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("avant fork — PID=%d\\n", getpid());
    fork();
    printf("après fork — PID=%d\\n", getpid());
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["avant fork", "après fork"] },
      ],
    },
    analysis:
      "Tu vois **trois** lignes : une `avant fork` (le père seul l'exécute), puis **deux** `après fork` (père et fils, dans un ordre non garanti). Si tu n'en vois que deux totales, ton stdout a été ligne-bufferisé et le buffer s'est dupliqué dans le fils — pratique anti-piège : flushe (`fflush(stdout)`) ou termine par `\\n` chaque ligne avant fork.",
    refs: [
      {
        label: "man 2 fork",
        url: "https://man7.org/linux/man-pages/man2/fork.2.html",
      },
    ],
  },

  // ============================================================
  // CELL 03 — Le retour de fork
  // ============================================================
  {
    id: "tp1-03-fork-retour",
    number: 3,
    title: "Le retour de fork",
    concept: ["fork", "valeur-retour", "discrimination"],
    theory:
      "`fork()` retourne **trois valeurs distinctes** depuis un seul appel :\n\n- `> 0` côté **père** → PID du fils\n- `== 0` côté **fils** → marqueur (0 n'est jamais un PID légal, init = 1)\n- `-1` → échec (table des processus pleine, ulimit, etc.), `errno` posé",
    whyBox:
      "Un seul appel système renvoie deux contextes — économique : pas d'autre syscall pour « savoir qui je suis ». Le 0 côté fils a un autre rôle : il vaut « faux » dans une condition, donc `if (fork())` est l'idiome historique du père. Détail : on déprécie aujourd'hui parce qu'il masque l'erreur (-1 est aussi « vrai »). Préfère `if (pid > 0)` / `else if (pid == 0)`.",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main(void) {
    pid_t pid = fork();
    if (pid > 0)        printf("pere, fils=%d\\n", pid);
    else if (pid == 0)  printf("fils\\n");
    else                perror("fork");
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["pere, fils=", "fils"] },
      ],
    },
    analysis:
      "L'ordre d'affichage **n'est PAS garanti**. Tu peux voir `fils\\npere, fils=…` selon le scheduler. Le kernel ne promet rien sur lequel des deux s'exécute en premier après `fork()`.",
    challenge: {
      kind: "compile",
      prompt:
        "Modifie le code pour que l'ordre soit **déterministe** : le **fils affiche d'abord**, le père ensuite. La sortie attendue (strict) :\n\n```\nfils\npere, fils=<N>\n```\n\nIndice : il existe une syscall qui bloque le père jusqu'à mort du fils. Place-la AVANT le `printf` du père.",
      validate: {
        type: "and",
        rules: [
          { type: "stdout-matches", pattern: "^fils\\npere, fils=\\d+\\n$" },
          { type: "exit-code", code: 0 },
        ],
      },
      hint: "Dans la branche père : appelle `wait(NULL)` AVANT le `printf`. Le père est ainsi bloqué jusqu'à ce que le fils ait fini son printf et soit mort. Garantit l'ordre.",
    },
    refs: [
      {
        label: "man 2 fork (RETURN VALUE)",
        url: "https://man7.org/linux/man-pages/man2/fork.2.html#RETURN_VALUE",
      },
    ],
  },

  // ============================================================
  // CELL 04 — Copy-on-Write
  // ============================================================
  {
    id: "tp1-04-cow",
    number: 4,
    title: "Copy-on-Write",
    concept: ["cow", "memoire", "fork"],
    theory:
      "Après `fork()`, père et fils ont **deux espaces mémoire séparés** — mais le kernel ne copie rien physiquement tant qu'aucun des deux ne modifie une page. C'est le **Copy-on-Write**. Quand l'un écrit, le kernel duplique la page concernée à la volée.",
    whyBox:
      "Avant COW (Unix 7th edition), `fork()` copiait toute la mémoire du processus → coûteux + souvent inutile si le fils va exec immédiatement. COW rend `fork()` quasi-gratuit en RAM : si fils + père ne modifient rien, ils partagent. Combiné à `exec()` derrière, c'est la fondation de la cheap-fork-then-exec sur laquelle reposent les shells.",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    int variable = 0;
    if (fork() == 0) {
        variable = 10;
        printf("fils  : variable = %d\\n", variable);
    } else {
        wait(NULL);
        variable = 100;
        printf("pere  : variable = %d\\n", variable);
    }
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        {
          type: "stdout-matches",
          pattern: "fils\\s+:\\s+variable\\s*=\\s*10.*pere\\s+:\\s+variable\\s*=\\s*100",
          flags: "s",
        },
      ],
    },
    analysis:
      "Le fils écrit 10 dans **sa** copie de la page contenant `variable` — le kernel dédouble la page à ce moment-là. Le père garde l'originale et y écrit 100. Les deux entiers vivent à la même **adresse virtuelle**, mais à deux adresses **physiques** distinctes après le COW.",
    refs: [
      {
        label: "kernel.org · fork & COW",
        url: "https://www.kernel.org/doc/Documentation/vm/overcommit-accounting.txt",
      },
    ],
  },

  // ============================================================
  // CELL 05 — Hiérarchie & init
  // ============================================================
  {
    id: "tp1-05-hierarchie-init",
    number: 5,
    title: "Hiérarchie & init",
    concept: ["hierarchy", "init", "pid1", "orphan"],
    theory:
      "Tout processus a un père. Le premier processus (`PID 1`) est `init` (souvent `systemd` ou `busybox init`). Si un père meurt avant son fils, le fils devient **orphelin** et est **adopté par `init`**.",
    whyBox:
      "Pourquoi `init` et pas le grand-père ? Pour garder une garantie unique : il **existe toujours un wait()ant** quelque part. Le grand-père peut être mort aussi, l'arrière-grand-père aussi. `init` est éternel (par convention) et il `wait()` continuellement → toute table de processus reste collectable. Solution **unique** et **simple**.",
    starterCode: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        sleep(1);                          // laisse le pere mourir
        printf("fils — PPID=%d\\n", getppid());
    } else {
        printf("pere meurt — fils=%d\\n", pid);
        return 0;                          // pere termine sans wait
    }
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["pere meurt", "fils — PPID="] },
      ],
    },
    analysis:
      "Le fils affiche un PPID qui **n'est plus** le PID original du père. Dans la sandbox, le fils est typiquement reparenté vers le PID de `bash -c` ou directement vers `1`. Comportement réel sur la plupart des Linux : reparentage vers le **subreaper** le plus proche (cf. `prctl(PR_SET_CHILD_SUBREAPER)`) — sinon `init` (PID 1).",
    refs: [
      {
        label: "man 2 prctl (PR_SET_CHILD_SUBREAPER)",
        url: "https://man7.org/linux/man-pages/man2/prctl.2.html",
      },
    ],
  },

  // ============================================================
  // CELL 06 — wait : la famille signe les papiers
  // ============================================================
  {
    id: "tp1-06-wait",
    number: 6,
    title: "wait() : la famille signe les papiers",
    concept: ["wait", "zombie", "synchronisation"],
    theory:
      "`wait(&status)` **bloque le père** jusqu'à ce qu'un de ses fils meure. Sans `wait()`, le fils mort reste dans la table des processus comme **zombie** — son entrée tient parce que le père doit pouvoir lire son code de retour.\n\nAnalogie : le fils mort est un **cadavre à l'hôpital**, et `wait()` est la **famille qui signe les papiers**. Tant que personne ne signe, le lit (PID) reste occupé.",
    whyBox:
      "Le modèle est **asynchrone par défaut** : le père ne sait pas quand le fils mourra. `wait()` lui permet de se synchroniser sans polling. La table des processus a une taille finie (`/proc/sys/kernel/pid_max`) → si tu accumules trop de zombies, `fork()` échoue avec ENOMEM ou EAGAIN. C'est un *resource leak*, pas une fuite mémoire au sens C.",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        printf("fils PID=%d, je meurs dans 1s\\n", getpid());
        sleep(1);
        return 0;
    }
    int status;
    pid_t collected = wait(&status);
    printf("pere : fils %d recolte\\n", collected);
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        {
          type: "stdout-matches",
          pattern: "fils PID=(\\d+).*pere : fils \\1 recolte",
          flags: "s",
        },
      ],
    },
    analysis:
      "L'ordre est garanti : le père est bloqué dans `wait()` tant que le fils ne meurt pas. Le `collected` retourné par `wait()` est le PID du fils mort — utile quand tu en as plusieurs et que tu veux savoir lequel vient de tomber.",
    refs: [
      {
        label: "man 2 wait",
        url: "https://man7.org/linux/man-pages/man2/wait.2.html",
      },
    ],
  },

  // ============================================================
  // CELL 07 — Le status est un entier riche  (CIBLE 1.3 ALEXIS)
  // ============================================================
  {
    id: "tp1-07-status-decode",
    number: 7,
    title: "Le status est un entier riche",
    concept: ["wait", "WIFEXITED", "WIFSIGNALED", "WEXITSTATUS", "WTERMSIG"],
    theory:
      "L'`int status` retourné par `wait(&status)` **n'est pas** un simple code. Il encode **comment** le fils est mort.\n\n- bits 0-6 : numéro de signal qui l'a tué (si applicable)\n- bit 7    : core dump produit ?\n- bits 8-15: code de sortie passé à `exit()` (si applicable)\n\nLes macros POSIX décodent ça :\n- `WIFEXITED(s)` → vrai si exit normal\n- `WEXITSTATUS(s)` → code donné à `exit()` (bits 8-15 décalés)\n- `WIFSIGNALED(s)` → vrai si tué par signal\n- `WTERMSIG(s)` → numéro de signal qui a tué",
    whyBox:
      "Pourquoi tout caser dans un `int` ? Historique : Unix v1 avait peu de syscalls et le retour de `wait` était déjà cet entier. Avantage moderne : **un seul appel** te dit tout (mode de fin + valeur). Si tu avais deux syscalls (`how_died()` + `exit_value()`), tu aurais une race condition entre les deux. Les macros existent parce que l'encodage **dépend de la libc** — code portable = jamais accéder aux bits à la main, toujours via `WIFx`.",
    starterCode: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>

int main(void) {
    // CAS 1 — fils qui exit(40)
    pid_t pid1 = fork();
    if (pid1 == 0) exit(40);
    int s1;
    wait(&s1);
    if (WIFEXITED(s1))
        printf("cas1 : exit normal, code=%d\\n", WEXITSTATUS(s1));
    else if (WIFSIGNALED(s1))
        printf("cas1 : tue par signal %d\\n", WTERMSIG(s1));

    // CAS 2 — fils qui raise(SIGTERM)
    pid_t pid2 = fork();
    if (pid2 == 0) { raise(SIGTERM); _exit(0); }
    int s2;
    wait(&s2);
    if (WIFEXITED(s2))
        printf("cas2 : exit normal, code=%d\\n", WEXITSTATUS(s2));
    else if (WIFSIGNALED(s2))
        printf("cas2 : tue par signal %d\\n", WTERMSIG(s2));

    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        {
          type: "stdout-equals",
          expected:
            "cas1 : exit normal, code=40\ncas2 : tue par signal 15\n",
        },
      ],
    },
    analysis:
      "Cas 1 : `WIFEXITED` est vrai, `WEXITSTATUS` rend 40 (la valeur donnée à `exit`). Cas 2 : `WIFSIGNALED` est vrai, `WTERMSIG` rend 15 = SIGTERM. **C'est exactement ce qui manque à ton exo1.c (1.3)** : actuellement tu fais `wait(&status)` puis tu n'affiches pas si le fils est mort par exit normal ou par signal. Combine cette cellule à la Chambre du rendu pour fixer le typo `\"variable = d\\n\"` (oubli du `%d`) et ajouter le décodage propre.",
    challenge: {
      kind: "open-text",
      prompt:
        "Question rapide : si un fils appelle `exit(127)` (convention shell pour « commande introuvable »), que rend `WEXITSTATUS(status)` côté père ?",
      validate: { type: "equals-int", value: 127 },
      hint: "WEXITSTATUS extrait simplement les bits 8-15. La valeur passée à exit(N) avec N entre 0 et 255 est récupérée telle quelle.",
    },
    refs: [
      {
        label: "man 2 wait (Macros for inspecting status)",
        url: "https://man7.org/linux/man-pages/man2/wait.2.html",
      },
    ],
    pinForRendu: {
      section: "decoder-status",
      snippet: `if (WIFEXITED(status))
    printf("fils termine normalement, code = %d\\n", WEXITSTATUS(status));
else if (WIFSIGNALED(status))
    printf("fils tue par signal %d\\n", WTERMSIG(status));`,
    },
  },

  // ============================================================
  // CELL 08 — Zombie vs orphelin
  // ============================================================
  {
    id: "tp1-08-zombie-orphelin",
    number: 8,
    title: "Zombie vs orphelin",
    concept: ["zombie", "orphan", "consolidation"],
    theory:
      "Deux états distincts, souvent confondus :\n\n- **Zombie** : fils **mort**, père vivant, mais le père n'a pas encore appelé `wait()`. Entrée résiduelle dans la table.\n- **Orphelin** : fils **vivant**, père mort. Le fils est reparenté vers `init` (PID 1). `init` `wait()` en permanence → l'orphelin ne deviendra pas zombie.",
    whyBox:
      "Le zombie est un *leak* de la table des processus, pas de mémoire C. L'orphelin n'est pas un problème : il a juste changé de PPID. La confusion vient de ce que les deux concernent un fils dont quelque chose s'est mal passé avec le père — mais la nature du problème est inverse (mort sans wait VS père absent).",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    // Demo : produit un zombie pendant 1 seconde
    pid_t pid = fork();
    if (pid == 0) {
        printf("fils : je meurs maintenant\\n");
        return 0;
    }
    printf("pere : fils=%d, je ne wait pas, je dors\\n", pid);
    sleep(1);
    int s;
    wait(&s);
    printf("pere : ok j'ai signe les papiers\\n");
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["je ne wait pas", "signe les papiers"] },
      ],
    },
    analysis:
      "Pendant 1 seconde, le fils est **zombie** : tu peux le voir dans `ps -e` avec l'état `Z`. Une fois `wait()` appelé, l'entrée disparaît. Sur les vrais minishells, on évite les zombies en installant un gestionnaire `SIGCHLD` (cf. TP2) qui `wait()` automatiquement à chaque mort de fils.",
    challenge: {
      kind: "open-text",
      prompt:
        "Cas : `fork()` réussit, le **fils** se termine immédiatement avec `exit(0)`, le **père** est dans un `sleep(60)` sans avoir appelé `wait()`. Comment qualifies-tu le fils pendant ces 60 secondes ? (un seul mot)",
      validate: { type: "equals-string", value: "zombie", ci: true },
      hint: "Le fils est mort. Le père est vivant mais n'a pas signé. Pense à l'analogie du cadavre à l'hôpital.",
    },
    refs: [
      {
        label: "ps(1) — STATE codes",
        url: "https://man7.org/linux/man-pages/man1/ps.1.html#PROCESS_STATE_CODES",
      },
    ],
  },

  // ============================================================
  // CELL 09 — exec : on remplace le code
  // ============================================================
  {
    id: "tp1-09-exec",
    number: 9,
    title: "exec() : on remplace le code",
    concept: ["exec", "execvp", "argv"],
    theory:
      "`exec()` **remplace** le code, les données et la stack du processus appelant par ceux d'un autre binaire. **Le PID ne change pas.** Si `exec()` réussit, il ne retourne **jamais** — la suite du C n'est pas exécutée.\n\nFamille : `execl` (varargs), `execv` (vecteur), suffixe `p` = recherche dans `$PATH`. La plus pratique : `execvp(file, argv)`.\n\nConvention : `argv[0]` = nom du programme (par convention le binaire), tableau **NULL-terminé**.",
    whyBox:
      "Pourquoi séparer `fork()` (créer) de `exec()` (remplacer) ? **Flexibilité.** Entre les deux, le fils peut configurer : redirections (`dup2`), `chdir`, ulimits, masque de signaux. C'est ce qui rend les shells implémentables. Windows `CreateProcess` fait tout d'un coup → moins flexible : impossible d'injecter une redirection sans API spécifique.",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        char *argv[] = { "echo", "hello kernel", NULL };
        execvp(argv[0], argv);
        perror("execvp");           // n'est atteint que si exec echoue
        return 1;
    }
    int status;
    wait(&status);
    printf("pere : enfant=%d, exit=%d\\n", pid, WEXITSTATUS(status));
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["hello kernel", "exit=0"] },
      ],
    },
    analysis:
      "Trois étapes critiques pour le minishell :\n\n1. **fork** — créer un processus fils\n2. **exec** dans le fils — devenir la commande à exécuter\n3. **wait** dans le père — attendre que le fils termine, récupérer son status\n\n`une_commande` (le `char**` produit par `readcmd`) est déjà NULL-terminé et a la commande en `argv[0]` → tu le passes tel quel à `execvp(une_commande[0], une_commande)`.",
    challenge: {
      kind: "compile",
      prompt:
        "Écris un programme qui fork, et dans le fils exec **`/bin/echo`** avec l'argument `hello`. Le père doit afficher `pere ok` après que le fils a fini. Sortie attendue (ordre strict) :\n\n```\nhello\npere ok\n```",
      validate: {
        type: "stdout-equals",
        expected: "hello\npere ok\n",
      },
      hint: "execvp dans le fils, wait(NULL) dans le père avant son printf. argv doit être NULL-terminé : { \"echo\", \"hello\", NULL }.",
    },
    refs: [
      {
        label: "man 3 exec",
        url: "https://man7.org/linux/man-pages/man3/exec.3.html",
      },
    ],
    pinForRendu: {
      section: "fork-exec-wait",
      snippet: `pid_t pid = fork();
if (pid == 0) {
    execvp(une_commande[0], une_commande);
    perror("execvp");
    _exit(1);
}
int status;
wait(&status);`,
    },
  },

  // ============================================================
  // CELL 10 — Chambre du rendu
  // ============================================================
  {
    id: "tp1-10-rendu",
    number: 10,
    title: "Chambre du rendu : assemblage d'exo1.c",
    concept: ["chambre-rendu", "exo1", "synthese"],
    theory:
      "Tu as réinstancié les neuf primitives. Il reste à composer **`exo1.c`** : un programme qui fork, où le fils dort `tempsFils` secondes puis exit avec un code, et où le père attend, décode `status` (WIFEXITED + WEXITSTATUS, ou WIFSIGNALED + WTERMSIG) et l'affiche proprement.\n\nLes fragments collectés dans les cellules 07 et 09 vont dans la Chambre du rendu.",
    whyBox:
      "C'est aussi là que tu corriges le typo connu : `printf(\"variable = d\\n\", variable)` → `printf(\"variable = %d\\n\", variable)`. Le `%d` était oublié — le compilateur ne le voit pas comme une erreur car la chaîne est valide.",
    starterCode: `// ouvre la Chambre du rendu via le bouton ci-dessous
// pour composer exo1.c complet
int main(void) { return 0; }
`,
    starterValidation: { type: "compile-ok" },
    analysis:
      "Cette cellule est un point de passage. Une fois la Chambre validée, tu peux télécharger `exo1.c` et le coller dans `TP1/` de ton projet local — il est prêt pour le rendu.",
  },
];

export const TP1: TPContent = {
  tpId: "tp1",
  cells,
  renduFile: {
    name: "exo1.c",
    brief:
      "Programme final du TP1 — fork + sleep configurable + wait + décodage propre du mode de fin (WIFEXITED / WIFSIGNALED). Corrige le typo `\"variable = d\\n\"` (manque %d).",
    initialContent: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(int argc, char *argv[]) {
    int tempsFils = (argc > 1) ? atoi(argv[1]) : 1;
    int tempsPere = (argc > 2) ? atoi(argv[2]) : 2;
    int variable = 0;

    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        return 1;
    }

    if (pid == 0) {
        // ----- FILS -----
        variable = 10;
        printf("fils  PID=%d  PPID=%d  variable = %d\\n",
               getpid(), getppid(), variable);
        sleep(tempsFils);
        return 0;
    }

    // ----- PERE -----
    variable = 100;
    printf("pere  PID=%d  fils=%d  variable = %d\\n",
           getpid(), pid, variable);

    int status;
    wait(&status);

    if (WIFEXITED(status))
        printf("pere : fils termine normalement, code = %d\\n",
               WEXITSTATUS(status));
    else if (WIFSIGNALED(status))
        printf("pere : fils tue par signal %d\\n", WTERMSIG(status));

    (void)tempsPere;  // pas utilise dans cette version (cf. sujet)
    return 0;
}
`,
    validation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["variable = 10", "variable = 100", "termine normalement"] },
        { type: "exit-code", code: 0 },
      ],
    },
  },
};
