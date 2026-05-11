/**
 * Compile + exécute du C réel sur la machine (gcc).
 *
 * Distinct de `lib/compile.ts` (Java/Python) parce que le C a des
 * besoins propres : décodage du signal de mort (WIFSIGNALED), gestion
 * fine du timeout, capture séparée du stderr de gcc vs du runtime.
 *
 * Pas de Docker / seccomp : c'est la machine d'Alexis, son code, contre
 * lui-même. Risque interne nul. Limites posées via ulimit + timeout JS.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export const ALLOWED_EXTRA_FLAGS = ["-pthread", "-lm"] as const;
export type AllowedFlag = (typeof ALLOWED_EXTRA_FLAGS)[number];

export type CompileCRequest = {
  code: string;
  stdin?: string;
  args?: string[];
  timeoutMs?: number;
  extraFlags?: AllowedFlag[];
};

export type CompileCResult = {
  stdout: string;
  stderr: string;
  compileOk: boolean;
  compileStderr: string;
  exitCode: number | null;
  exitSignal: number | null;
  exitSignalName: string | null;
  durationMs: number;
  durationCompileMs: number;
  durationRunMs: number;
  timedOut: boolean;
  outOfMemory: boolean;
};

const SANDBOX_ROOT = path.join(os.tmpdir(), "interpreteur-c");
const MAX_CODE_BYTES = 50 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;
const COMPILE_TIMEOUT_MS = 8_000;
const DEFAULT_RUN_TIMEOUT_MS = 5_000;
const MAX_RUN_TIMEOUT_MS = 10_000;
const ULIMIT_VIRT_KB = 131_072; // 128 MB
const ULIMIT_CPU_S = 10;

// Mapping signal name → numéro POSIX classique (linux x86/arm).
const SIGNAL_NUMBERS: Record<string, number> = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGQUIT: 3,
  SIGILL: 4,
  SIGTRAP: 5,
  SIGABRT: 6,
  SIGBUS: 7,
  SIGFPE: 8,
  SIGKILL: 9,
  SIGUSR1: 10,
  SIGSEGV: 11,
  SIGUSR2: 12,
  SIGPIPE: 13,
  SIGALRM: 14,
  SIGTERM: 15,
  SIGCHLD: 17,
  SIGCONT: 18,
  SIGSTOP: 19,
  SIGTSTP: 20,
  SIGTTIN: 21,
  SIGTTOU: 22,
};

type RawRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
};

function runRaw(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  stdin: string,
): Promise<RawRunResult> {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete (env as Record<string, string | undefined>)._JAVA_OPTIONS;
    delete (env as Record<string, string | undefined>).JAVA_TOOL_OPTIONS;
    // LC_ALL pour éviter les messages gcc localisés (cohérence stderr).
    env.LC_ALL = "C";
    env.LANG = "C";

    const child = spawn(command, args, { cwd, env });
    let stdout = "";
    let stderr = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let timedOut = false;

    const t = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      if (stdoutTruncated) return;
      stdout += d.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
        stdoutTruncated = true;
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (d) => {
      if (stderrTruncated) return;
      stderr += d.toString();
      if (stderr.length > MAX_OUTPUT_BYTES) {
        stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
        stderrTruncated = true;
      }
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();

    child.on("close", (code, signal) => {
      clearTimeout(t);
      resolve({ stdout, stderr, exitCode: code, signal, timedOut });
    });
    child.on("error", (err) => {
      clearTimeout(t);
      resolve({
        stdout,
        stderr: stderr + "\n[spawn error] " + err.message,
        exitCode: 1,
        signal: null,
        timedOut,
      });
    });
  });
}

function ensureSandboxRoot() {
  if (!existsSync(SANDBOX_ROOT)) {
    mkdirSync(SANDBOX_ROOT, { recursive: true, mode: 0o700 });
  }
}

function decodeStatus(raw: RawRunResult): {
  exitCode: number | null;
  exitSignal: number | null;
  exitSignalName: string | null;
} {
  if (raw.signal) {
    const name = raw.signal as string;
    return {
      exitCode: null,
      exitSignal: SIGNAL_NUMBERS[name] ?? null,
      exitSignalName: name,
    };
  }
  return { exitCode: raw.exitCode, exitSignal: null, exitSignalName: null };
}

export type CompileCError =
  | { kind: "code-too-large" }
  | { kind: "invalid-flag"; flag: string };

export function validateRequest(req: CompileCRequest): CompileCError | null {
  if (typeof req.code !== "string") return { kind: "code-too-large" };
  if (Buffer.byteLength(req.code, "utf8") > MAX_CODE_BYTES) {
    return { kind: "code-too-large" };
  }
  if (req.extraFlags) {
    for (const flag of req.extraFlags) {
      if (!ALLOWED_EXTRA_FLAGS.includes(flag as AllowedFlag)) {
        return { kind: "invalid-flag", flag: flag };
      }
    }
  }
  return null;
}

export async function compileC(req: CompileCRequest): Promise<CompileCResult> {
  const totalStart = performance.now();
  ensureSandboxRoot();

  const id = crypto.randomBytes(6).toString("hex");
  const sandboxDir = mkdtempSync(path.join(SANDBOX_ROOT, `${id}-`));
  const sourcePath = path.join(sandboxDir, "program.c");
  const binaryPath = path.join(sandboxDir, "a.out");

  try {
    writeFileSync(sourcePath, req.code, { encoding: "utf-8", mode: 0o600 });

    // 1. Compile
    const extra = (req.extraFlags ?? []).filter((f) =>
      ALLOWED_EXTRA_FLAGS.includes(f),
    );
    const compileStart = performance.now();
    const compileRaw = await runRaw(
      "gcc",
      ["-Wall", "-Wextra", "-O0", "-o", binaryPath, sourcePath, ...extra],
      sandboxDir,
      COMPILE_TIMEOUT_MS,
      "",
    );
    const durationCompileMs = performance.now() - compileStart;
    const compileOk = compileRaw.exitCode === 0 && !compileRaw.timedOut;

    if (!compileOk) {
      return {
        stdout: "",
        stderr: compileRaw.stderr,
        compileOk: false,
        compileStderr: compileRaw.stderr,
        exitCode: null,
        exitSignal: null,
        exitSignalName: null,
        durationMs: performance.now() - totalStart,
        durationCompileMs,
        durationRunMs: 0,
        timedOut: compileRaw.timedOut,
        outOfMemory: false,
      };
    }

    // 2. Run avec ulimit (wrapper bash) — ulimit -v 128 MB, -t 10s.
    const runTimeoutMs = Math.min(
      Math.max(req.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS, 100),
      MAX_RUN_TIMEOUT_MS,
    );

    // On enveloppe la commande dans bash pour ulimit. Les args sont
    // shell-quotés via printf %q externe : ici on construit la cmd avec
    // arguments echappés simplement (pas d'entrée user libre).
    const userArgs = (req.args ?? []).map((a) => shellQuote(a));
    const cmdLine = `ulimit -v ${ULIMIT_VIRT_KB}; ulimit -t ${ULIMIT_CPU_S}; exec ${shellQuote(binaryPath)} ${userArgs.join(" ")}`;

    const runStart = performance.now();
    const runRaw1 = await runRaw(
      "bash",
      ["-c", cmdLine],
      sandboxDir,
      runTimeoutMs,
      req.stdin ?? "",
    );
    const durationRunMs = performance.now() - runStart;

    const decoded = decodeStatus(runRaw1);
    // Heuristique OOM : tué par SIGSEGV ou exit 1 avec stderr typique
    // après ulimit -v atteint. Difficile à distinguer en pratique.
    const outOfMemory =
      decoded.exitSignalName === "SIGSEGV" &&
      /Cannot allocate|out of memory|virtual memory exhausted/i.test(
        runRaw1.stderr,
      );

    return {
      stdout: runRaw1.stdout,
      stderr: runRaw1.stderr,
      compileOk: true,
      compileStderr: compileRaw.stderr,
      exitCode: decoded.exitCode,
      exitSignal: decoded.exitSignal,
      exitSignalName: decoded.exitSignalName,
      durationMs: performance.now() - totalStart,
      durationCompileMs,
      durationRunMs,
      timedOut: runRaw1.timedOut,
      outOfMemory,
    };
  } finally {
    try {
      rmSync(sandboxDir, { recursive: true, force: true });
    } catch {
      /* leak silencieux — purgé par cron cleanup */
    }
  }
}

/**
 * Quote shell minimaliste pour bash -c. On vise correctness, pas
 * compatibilité POSIX exotique. Tous les caractères sauf [A-Za-z0-9_/.,-]
 * sont protégés en simple-quote.
 */
function shellQuote(s: string): string {
  if (/^[A-Za-z0-9_/.,=:+-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Cleanup background : balaye SANDBOX_ROOT et supprime les dossiers de
 * plus de 1h. Appelé au module load.
 */
function scheduleCleanup() {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const sweep = async () => {
    try {
      ensureSandboxRoot();
      const fs = await import("node:fs/promises");
      const entries = await fs.readdir(SANDBOX_ROOT, { withFileTypes: true });
      const now = Date.now();
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const full = path.join(SANDBOX_ROOT, ent.name);
        try {
          const stat = await fs.stat(full);
          if (now - stat.mtimeMs > ONE_HOUR_MS) {
            await fs.rm(full, { recursive: true, force: true });
          }
        } catch {
          /* skip */
        }
      }
    } catch {
      /* skip */
    }
  };
  // Lance une fois au boot puis toutes les 30min.
  void sweep();
  setInterval(sweep, 30 * 60 * 1000).unref?.();
}
scheduleCleanup();

export async function getCompilerHealth(): Promise<{
  ok: boolean;
  compiler: string;
  version: string;
  arch: string;
  sandbox: string;
}> {
  const raw = await runRaw("gcc", ["--version"], os.tmpdir(), 3_000, "");
  const versionMatch = /\b(\d+\.\d+\.\d+)\b/.exec(raw.stdout) ?? [];
  return {
    ok: raw.exitCode === 0,
    compiler: "gcc",
    version: versionMatch[1] ?? "unknown",
    arch: process.arch,
    sandbox: SANDBOX_ROOT,
  };
}
