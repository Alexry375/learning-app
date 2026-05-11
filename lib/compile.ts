/**
 * Compile Lab — sandbox locale.
 * Pas de Docker / seccomp : c'est la machine d'Alexis, son code,
 * contre lui-même. Risque interne nul. Limites posées via ulimit.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export type CompileLanguage = "java" | "python";

export type CompileRequest = {
  language: CompileLanguage;
  code: string;
  stdin?: string;
  /** Nom de classe forcé pour Java (sinon extrait du code). */
  className?: string;
};

export type CompileResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  phase: "compile" | "run" | "ok" | "timeout";
};

const SANDBOX_ROOT = path.join(os.tmpdir(), "interpreteur-compile");
const TIMEOUT_MS = 10_000;

function extractJavaClassName(code: string): string {
  const m = code.match(/public\s+class\s+([A-Z][A-Za-z0-9_]*)/);
  return m?.[1] ?? "Main";
}

/**
 * Lance une commande shell avec timeout et limites ulimit en front.
 * On passe par `bash -c "ulimit ...; cmd"` car ulimit est un builtin.
 */
function runWithLimits(
  cmd: string,
  cwd: string,
  stdin: string,
  timeoutMs: number,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    // 12s CPU, 50 MB file size, 96 procs. Pas de -v : la JVM ARM64 a besoin
    // de >1 GB d'address space rien que pour booter ; le timeout reste le
    // garde-fou principal. Risque interne nul (machine d'Alexis).
    const wrapped = `ulimit -t 12; ulimit -f 51200; ${cmd}`;
    // Important : pas de _JAVA_OPTIONS dans l'env (sinon "Picked up …" pollue
    // stderr de chaque exécution). Les options JVM sont passées en argv direct
    // via le wrapper `java -Xmx… -XX:… …`.
    const env = { ...process.env };
    delete (env as Record<string, string | undefined>)._JAVA_OPTIONS;
    delete (env as Record<string, string | undefined>).JAVA_TOOL_OPTIONS;
    const child = spawn("bash", ["-c", wrapped], { cwd, env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > 100_000) {
        stdout = stdout.slice(0, 100_000) + "\n…[output tronquée]";
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 100_000) {
        stderr = stderr.slice(0, 100_000);
      }
    });
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });
    child.on("error", (err) => {
      clearTimeout(t);
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1, timedOut });
    });
  });
}

export async function runCompile(req: CompileRequest): Promise<CompileResult> {
  const start = Date.now();
  const id = crypto.randomBytes(6).toString("hex");
  // mkdtemp safer than path.join
  let dir: string;
  try {
    // Ensure root exists
    const fs = await import("node:fs");
    if (!fs.existsSync(SANDBOX_ROOT)) fs.mkdirSync(SANDBOX_ROOT, { recursive: true });
    dir = mkdtempSync(path.join(SANDBOX_ROOT, `${id}-`));
  } catch (e) {
    return {
      ok: false,
      stdout: "",
      stderr: `Sandbox setup failed: ${(e as Error).message}`,
      exitCode: 1,
      durationMs: Date.now() - start,
      phase: "compile",
    };
  }

  try {
    if (req.language === "java") {
      const className = req.className ?? extractJavaClassName(req.code);
      writeFileSync(path.join(dir, `${className}.java`), req.code);
      const compile = await runWithLimits(
        `javac ${className}.java`,
        dir,
        "",
        TIMEOUT_MS,
      );
      if (compile.timedOut) {
        return {
          ok: false,
          stdout: compile.stdout,
          stderr: compile.stderr || "Compilation timeout (>10s).",
          exitCode: null,
          durationMs: Date.now() - start,
          phase: "timeout",
        };
      }
      if (compile.exitCode !== 0) {
        return {
          ok: false,
          stdout: compile.stdout,
          stderr: compile.stderr,
          exitCode: compile.exitCode,
          durationMs: Date.now() - start,
          phase: "compile",
        };
      }
      const run = await runWithLimits(
        `java -Xmx128m -XX:MaxMetaspaceSize=128m -Djava.awt.headless=true ${className}`,
        dir,
        req.stdin ?? "",
        TIMEOUT_MS,
      );
      return {
        ok: !run.timedOut && run.exitCode === 0,
        stdout: run.stdout,
        stderr: run.stderr,
        exitCode: run.exitCode,
        durationMs: Date.now() - start,
        phase: run.timedOut ? "timeout" : run.exitCode === 0 ? "ok" : "run",
      };
    }

    if (req.language === "python") {
      writeFileSync(path.join(dir, "main.py"), req.code);
      const run = await runWithLimits(
        `python3 main.py`,
        dir,
        req.stdin ?? "",
        TIMEOUT_MS,
      );
      return {
        ok: !run.timedOut && run.exitCode === 0,
        stdout: run.stdout,
        stderr: run.stderr,
        exitCode: run.exitCode,
        durationMs: Date.now() - start,
        phase: run.timedOut ? "timeout" : run.exitCode === 0 ? "ok" : "run",
      };
    }

    return {
      ok: false,
      stdout: "",
      stderr: `Langage non supporté : ${req.language}`,
      exitCode: 1,
      durationMs: Date.now() - start,
      phase: "compile",
    };
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* noop */
    }
  }
}
