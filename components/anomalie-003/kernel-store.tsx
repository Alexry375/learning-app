"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";

/** Événements affichés dans le KernelOutput (dmesg-style). */
export type KernelEvent = {
  id: string;
  /** ms depuis kernel boot session. */
  t: number;
  /** Niveau de log. */
  level: "info" | "warn" | "alert" | "syscall" | "signal";
  /** Texte court. */
  message: string;
};

/** Notification slide-in éphémère. */
export type KernelAlert = {
  id: string;
  /** ms depuis kernel boot session. */
  t: number;
  level: "info" | "warn" | "alert";
  message: string;
  /** Détail facultatif (man ref, contexte). */
  detail?: string;
};

export type KernelState = {
  /** ms depuis le boot kernel de cette session (pas process.uptime). */
  bootAt: number;
  /** Compteur de processus actifs (incrémenté par fork dans le code compilé). */
  procCount: number;
  /** Signaux totaux délivrés depuis le boot. */
  signalCount: number;
  /** Dernière syscall détectée dans une compile (ex "fork()", "exec()", "wait()"). */
  lastSyscall: string | null;
  /** Status général : ok / partial / panic. */
  status: "boot" | "fracture" | "stable";
  /** Log dmesg-style. Capped à 200 entrées. */
  events: KernelEvent[];
  /** Notifs slide-in actives. */
  alerts: KernelAlert[];
  /** IDs des cellules complétées (validation passée). */
  cellsCompleted: Set<string>;
};

type Action =
  | { type: "boot" }
  | { type: "set-status"; status: KernelState["status"] }
  | { type: "set-syscall"; syscall: string }
  | { type: "spawn-proc"; n: number }
  | { type: "raise-signal"; n: number }
  | { type: "log"; level: KernelEvent["level"]; message: string }
  | { type: "alert"; level: KernelAlert["level"]; message: string; detail?: string }
  | { type: "dismiss-alert"; id: string }
  | { type: "complete-cell"; cellId: string };

function initial(): KernelState {
  return {
    bootAt: Date.now(),
    procCount: 1,
    signalCount: 0,
    lastSyscall: null,
    status: "fracture",
    events: [],
    alerts: [],
    cellsCompleted: new Set<string>(),
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function reducer(state: KernelState, action: Action): KernelState {
  const t = Date.now() - state.bootAt;
  switch (action.type) {
    case "boot":
      return initial();
    case "set-status":
      return { ...state, status: action.status };
    case "set-syscall":
      return { ...state, lastSyscall: action.syscall };
    case "spawn-proc":
      return { ...state, procCount: state.procCount + action.n };
    case "raise-signal":
      return { ...state, signalCount: state.signalCount + action.n };
    case "log": {
      const ev: KernelEvent = {
        id: uid(),
        t,
        level: action.level,
        message: action.message,
      };
      const events = [...state.events, ev].slice(-200);
      return { ...state, events };
    }
    case "alert": {
      const a: KernelAlert = {
        id: uid(),
        t,
        level: action.level,
        message: action.message,
        detail: action.detail,
      };
      return { ...state, alerts: [...state.alerts, a].slice(-5) };
    }
    case "dismiss-alert":
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.id),
      };
    case "complete-cell": {
      if (state.cellsCompleted.has(action.cellId)) return state;
      const next = new Set(state.cellsCompleted);
      next.add(action.cellId);
      return { ...state, cellsCompleted: next };
    }
    default:
      return state;
  }
}

type Ctx = {
  state: KernelState;
  dispatch: React.Dispatch<Action>;
  /** Helper : analyse le source C et logue les syscalls détectées. */
  observeSource(source: string): void;
  /** Helper : pousse les events corrects à partir d'un résultat compile. */
  observeRunResult(r: {
    compileOk: boolean;
    exitCode: number | null;
    exitSignal: number | null;
    exitSignalName: string | null;
    timedOut: boolean;
    durationRunMs: number;
  }): void;
};

const KernelContext = createContext<Ctx | null>(null);

export function KernelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);

  useEffect(() => {
    dispatch({ type: "log", level: "info", message: "kernel: agent attached, PID 1" });
  }, []);

  function observeSource(source: string) {
    const has = (re: RegExp) => re.test(source);
    if (has(/\bfork\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "fork()" });
      dispatch({ type: "spawn-proc", n: 1 });
      dispatch({ type: "log", level: "syscall", message: "user: fork() invoked" });
    }
    if (has(/\bexecvp?\s*\(|\bexecl[ep]?\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "exec()" });
      dispatch({ type: "log", level: "syscall", message: "user: exec() invoked" });
    }
    if (has(/\bwait(pid)?\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "wait()" });
      dispatch({ type: "log", level: "syscall", message: "user: wait() invoked" });
    }
    if (has(/\braise\s*\(/) || has(/\bkill\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "kill()" });
      dispatch({ type: "raise-signal", n: 1 });
      dispatch({ type: "log", level: "signal", message: "user: signal raised" });
    }
    if (has(/\bsigaction\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "sigaction()" });
      dispatch({ type: "log", level: "syscall", message: "user: sigaction()" });
    }
    if (has(/\bpipe\s*\(/)) {
      dispatch({ type: "set-syscall", syscall: "pipe()" });
      dispatch({ type: "log", level: "syscall", message: "user: pipe() invoked" });
    }
  }

  function observeRunResult(r: {
    compileOk: boolean;
    exitCode: number | null;
    exitSignal: number | null;
    exitSignalName: string | null;
    timedOut: boolean;
    durationRunMs: number;
  }) {
    if (!r.compileOk) {
      dispatch({
        type: "log",
        level: "alert",
        message: `gcc: compilation failed`,
      });
      dispatch({
        type: "alert",
        level: "alert",
        message: "Compilation refusée",
        detail: "Le kernel n'a pas reçu de binaire exécutable.",
      });
      return;
    }
    if (r.timedOut || r.exitSignalName === "SIGKILL") {
      dispatch({
        type: "log",
        level: "alert",
        message: `kernel: process killed (timeout ou ulimit) — ${r.durationRunMs.toFixed(0)}ms`,
      });
      dispatch({
        type: "alert",
        level: "warn",
        message: "Process tué par SIGKILL",
        detail: "Timeout dépassé ou ulimit atteint. Vérifie une boucle infinie.",
      });
      return;
    }
    if (r.exitSignal !== null && r.exitSignalName) {
      dispatch({
        type: "log",
        level: "alert",
        message: `kernel: child died from ${r.exitSignalName} (${r.exitSignal})`,
      });
      if (r.exitSignalName === "SIGSEGV") {
        dispatch({
          type: "alert",
          level: "alert",
          message: "SEGFAULT détecté",
          detail: "Déréférencement de pointeur invalide. Vérifie tes accès mémoire.",
        });
      }
      return;
    }
    dispatch({
      type: "log",
      level: "info",
      message: `kernel: exec ok, exit ${r.exitCode} — ${r.durationRunMs.toFixed(0)}ms`,
    });
  }

  return (
    <KernelContext.Provider
      value={{ state, dispatch, observeSource, observeRunResult }}
    >
      {children}
    </KernelContext.Provider>
  );
}

export function useKernel(): Ctx {
  const c = useContext(KernelContext);
  if (!c) throw new Error("useKernel must be used within KernelProvider");
  return c;
}
