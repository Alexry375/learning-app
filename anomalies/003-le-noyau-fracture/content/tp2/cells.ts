import type { Cell, TPContent } from "../cell-types";

/**
 * TP2 — Signaux. Stub initial : 3 cellules pour démarrer.
 * À étendre une fois TP1 validé.
 */

const cells: Cell[] = [
  {
    id: "tp2-01-signaux-sms",
    number: 1,
    title: "Signaux : SMS d'urgence kernel",
    concept: ["signal", "kill", "asynchrone"],
    theory:
      "Un **signal** est une notification asynchrone qu'un processus envoie à un autre (ou au kernel lui envoie). Le programme cible est interrompu n'importe où dans son flot, le handler s'exécute, puis le programme reprend.\n\nListe complète : `kill -l`. Les plus courants : `SIGINT` (Ctrl-C), `SIGTERM` (terminate poli), `SIGKILL` (mort sans appel), `SIGCHLD` (un fils est mort), `SIGSEGV` (segfault), `SIGPIPE` (write sur pipe fermé).",
    whyBox:
      "Les signaux sont l'unique mécanisme inter-processus **asynchrone** d'Unix historique. Tout le reste (pipes, sockets) est synchrone ou polling. Coût : un signal est *extrêmement* limité — il ne peut transporter qu'un numéro (et un siginfo léger). C'est un SMS, pas un mail.",
    starterCode: `#include <stdio.h>
#include <signal.h>
#include <unistd.h>

int main(void) {
    printf("PID=%d, envoie-moi un signal\\n", getpid());
    raise(SIGTERM);                 // s'envoie SIGTERM a lui-meme
    printf("apres raise — pas atteint si SIGTERM termine\\n");
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "exit-signal", signalName: "SIGTERM" },
      ],
    },
    analysis:
      "Le programme se tue lui-même. La ligne après `raise()` n'est jamais atteinte. Le décodage côté père donnerait `WIFSIGNALED=1, WTERMSIG=15`.",
    refs: [
      { label: "man 7 signal", url: "https://man7.org/linux/man-pages/man7/signal.7.html" },
    ],
  },

  {
    id: "tp2-02-sigaction",
    number: 2,
    title: "sigaction : installer un handler",
    concept: ["sigaction", "handler", "SA_RESTART"],
    theory:
      "`signal()` est **legacy** : sémantique variable entre Unix. `sigaction()` est portable et explicite. Tu remplis une `struct sigaction { sa_handler, sa_mask, sa_flags }` et tu l'installes pour un numéro de signal.\n\n**Règle d'or** : dans un handler, n'utilise que des fonctions **async-signal-safe** (cf. `man 7 signal-safety`). `printf` ne l'est pas — préfère `write(STDOUT_FILENO, ...)`.",
    whyBox:
      "Pourquoi cette contrainte ? Le handler peut s'exécuter **au milieu** d'un `malloc()` ou `printf()` du programme principal. Si le handler appelle aussi `malloc`, tu te retrouves à modifier les structures internes de l'allocateur depuis deux endroits → corruption garantie.",
    starterCode: `#include <stdio.h>
#include <signal.h>
#include <unistd.h>
#include <string.h>

static volatile sig_atomic_t got = 0;

static void handler(int sig) {
    (void)sig;
    got = 1;
    const char *msg = "handler appele\\n";
    write(1, msg, 15);              // write est async-signal-safe
}

int main(void) {
    struct sigaction sa;
    memset(&sa, 0, sizeof sa);
    sa.sa_handler = handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    sigaction(SIGUSR1, &sa, NULL);

    raise(SIGUSR1);
    printf("got=%d\\n", got);
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["handler appele", "got=1"] },
      ],
    },
    analysis:
      "`volatile sig_atomic_t` est le seul type sûr à manipuler depuis un handler et le main concurremment. Le handler met le flag, le main le lit.",
    refs: [
      {
        label: "man 7 signal-safety",
        url: "https://man7.org/linux/man-pages/man7/signal-safety.7.html",
      },
    ],
  },

  {
    id: "tp2-03-sigchld",
    number: 3,
    title: "SIGCHLD : récolter les zombies",
    concept: ["sigchld", "wait", "minishell"],
    theory:
      "À chaque mort d'un fils, le kernel envoie `SIGCHLD` au père. Un handler `SIGCHLD` qui appelle `waitpid(-1, &s, WNOHANG)` en boucle empêche l'accumulation de zombies — pratique pour un shell qui lance plein de commandes.\n\n**Important** : utilise `WNOHANG` pour ne pas bloquer si aucun fils n'est récoltable, et boucle parce que plusieurs SIGCHLD peuvent se condenser en un seul.",
    whyBox:
      "Pourquoi le kernel envoie un signal au lieu de juste faire le ménage ? Le code de retour du fils (`WEXITSTATUS`) appartient au père — c'est sa décision de le récupérer ou pas. Le signal sert juste à notifier *« quelque chose s'est passé, regarde »*.",
    starterCode: `#include <stdio.h>
#include <signal.h>
#include <unistd.h>
#include <sys/wait.h>
#include <string.h>

static void reaper(int sig) {
    (void)sig;
    int saved = errno;              // a placer en pratique
    while (waitpid(-1, NULL, WNOHANG) > 0) { /* recolte tout */ }
}

int main(void) {
    struct sigaction sa;
    memset(&sa, 0, sizeof sa);
    sa.sa_handler = reaper;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART | SA_NOCLDSTOP;
    sigaction(SIGCHLD, &sa, NULL);

    for (int i = 0; i < 3; i++) {
        pid_t pid = fork();
        if (pid == 0) { _exit(i); }
    }
    sleep(1);
    printf("aucun zombie ne traine\\n");
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["aucun zombie ne traine"] },
      ],
    },
    analysis:
      "Sans le handler SIGCHLD, les trois fils mourraient zombies (le père est dans sleep, ne wait jamais). Avec le reaper, ils sont récoltés automatiquement.",
    refs: [
      { label: "man 2 waitpid", url: "https://man7.org/linux/man-pages/man2/waitpid.2.html" },
    ],
  },
];

export const TP2: TPContent = {
  tpId: "tp2",
  cells,
  renduFile: {
    name: "tp2.c",
    brief:
      "TP2 — gestionnaire de signaux. À assembler après les cellules sur sigaction et SIGCHLD.",
    initialContent: `#include <stdio.h>
#include <signal.h>
#include <unistd.h>
#include <string.h>

/* TP2 — squelette à compléter pendant la séance. */

int main(void) {
    printf("TP2 squelette — implemente ton handler\\n");
    return 0;
}
`,
  },
};
