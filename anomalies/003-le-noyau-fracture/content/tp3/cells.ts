import type { Cell, TPContent } from "../cell-types";

/**
 * TP3 — Masques de signaux + composition minishell. Stub initial.
 */

const cells: Cell[] = [
  {
    id: "tp3-01-sigprocmask",
    number: 1,
    title: "sigprocmask : masquer un signal",
    concept: ["sigprocmask", "section-critique"],
    theory:
      "Un **masque** de signaux dit au kernel : « pour ce processus, retiens ces signaux au lieu de les délivrer ». Ils restent **pending** jusqu'au démasquage. `sigprocmask(SIG_BLOCK, &set, NULL)` ajoute au masque ; `SIG_UNBLOCK` retire ; `SIG_SETMASK` remplace.",
    whyBox:
      "Pourquoi masquer plutôt qu'ignorer ? **Ignorer** (`SIG_IGN`) = le signal est perdu. **Masquer** = le signal est mis en file d'attente, livré dès que tu démasques. Utile pour les sections critiques : tu n'ignores pas SIGINT pendant que tu mets à jour une structure, tu le retardes.",
    starterCode: `#include <stdio.h>
#include <signal.h>
#include <unistd.h>

int main(void) {
    sigset_t s;
    sigemptyset(&s);
    sigaddset(&s, SIGUSR1);

    sigprocmask(SIG_BLOCK, &s, NULL);
    printf("SIGUSR1 masque\\n");

    raise(SIGUSR1);                 // en attente, pas delivre
    printf("encore en vie apres raise\\n");

    sigprocmask(SIG_UNBLOCK, &s, NULL);
    // SIGUSR1 est delivre ici, action par defaut = terminer
    printf("pas atteint si SIGUSR1 par defaut termine\\n");
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["SIGUSR1 masque", "encore en vie"] },
      ],
    },
    analysis:
      "L'action par défaut de SIGUSR1 est `Term` (cf. `man 7 signal`). Une fois démasqué, il termine le programme — donc la troisième ligne n'apparaît pas si tu n'as pas installé de handler.",
  },

  {
    id: "tp3-02-pipe",
    number: 2,
    title: "pipe : tuyau entre deux processus",
    concept: ["pipe", "dup2", "fd"],
    theory:
      "`pipe(fds)` crée un **tube** anonyme. `fds[0]` = lecture, `fds[1]` = écriture. Après `fork()`, les deux processus voient les deux extrémités → typiquement le père ferme une, le fils ferme l'autre.\n\nCombiné à `dup2()`, on redirige stdin/stdout pour brancher la sortie d'une commande à l'entrée d'une autre. C'est ainsi qu'un shell implémente `cmd1 | cmd2`.",
    whyBox:
      "Un pipe est un buffer kernel (~64 KB par défaut). `write` sur un pipe plein bloque ; `read` sur un pipe vide bloque ; `write` sur un pipe sans lecteur lève SIGPIPE et le `write` rend `EPIPE`. C'est de la backpressure intégrée — un pipeline shell s'adapte à la vitesse du consommateur le plus lent.",
    starterCode: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
#include <string.h>

int main(void) {
    int fds[2];
    pipe(fds);

    pid_t pid = fork();
    if (pid == 0) {
        close(fds[0]);
        const char *msg = "salut depuis le fils\\n";
        write(fds[1], msg, strlen(msg));
        close(fds[1]);
        return 0;
    }
    close(fds[1]);
    char buf[64] = {0};
    ssize_t n = read(fds[0], buf, sizeof buf - 1);
    (void)n;
    printf("pere a lu : %s", buf);
    close(fds[0]);
    wait(NULL);
    return 0;
}
`,
    starterValidation: {
      type: "and",
      rules: [
        { type: "compile-ok" },
        { type: "stdout-contains", substrings: ["pere a lu : salut depuis le fils"] },
      ],
    },
    analysis:
      "Pour un vrai pipeline `cmd1 | cmd2`, tu ferais `dup2(fds[1], STDOUT_FILENO)` dans le fils côté `cmd1`, et `dup2(fds[0], STDIN_FILENO)` dans le fils côté `cmd2`, avant chaque `execvp`.",
    refs: [
      { label: "man 2 pipe", url: "https://man7.org/linux/man-pages/man2/pipe.2.html" },
      { label: "man 2 dup2", url: "https://man7.org/linux/man-pages/man2/dup.2.html" },
    ],
  },

  {
    id: "tp3-03-minishell",
    number: 3,
    title: "Composition minishell",
    concept: ["minishell", "synthese"],
    theory:
      "Tu as : `fork`, `exec`, `wait`, `sigaction`, `sigprocmask`, `pipe`, `dup2`. C'est tout ce qu'il faut pour le minishell complet (avec redirections, pipes, background). La Chambre du rendu rassemble le code dans `minishell.c` linké contre `libreadcmd.a`.",
    whyBox:
      "Le minishell prouve que tu maîtrises les briques. Si une seule manque, il casse — tu ne peux pas exec sans avoir forké, tu ne peux pas wait sans avoir un fils, tu ne peux pas piper sans avoir dup2é. C'est l'épreuve d'intégration de la matière.",
    starterCode: `// Ce stub se compose dans la Chambre du rendu TP3.
int main(void) { return 0; }
`,
    starterValidation: { type: "compile-ok" },
    analysis:
      "La Chambre du rendu TP3 contiendra le `minishell.c` complet + le `Makefile` fourni par les profs + `readcmd.h` + `libreadcmd.a`, archivés en `.tar` pour le rendu Moodle.",
  },
];

export const TP3: TPContent = {
  tpId: "tp3",
  cells,
  renduFile: {
    name: "minishell.c",
    brief:
      "Minishell complet : fork + execvp + wait + handler SIGCHLD + pipes + redirections. Squelette à compléter pendant la séance.",
    initialContent: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <signal.h>
#include "readcmd.h"

/* Minishell — squelette TP3.
   Boucle : prompt, lecture readcmd, dispatch, fork+exec+wait. */

int main(void) {
    char *ligne;
    struct cmdline *cmd;

    while (1) {
        printf("minishell> ");
        fflush(stdout);
        cmd = readcmd();
        if (cmd == NULL) break;
        if (cmd->err != NULL) { fprintf(stderr, "%s\\n", cmd->err); continue; }
        if (cmd->seq[0] == NULL) continue;

        char **une_commande = cmd->seq[0];
        if (strcmp(une_commande[0], "exit") == 0) break;

        pid_t pid = fork();
        if (pid == 0) {
            execvp(une_commande[0], une_commande);
            perror(une_commande[0]);
            _exit(1);
        }
        int status;
        wait(&status);
    }
    (void)ligne;
    return 0;
}
`,
  },
};
