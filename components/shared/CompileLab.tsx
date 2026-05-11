"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "java" | "python";

type Props = {
  initialCode?: string;
  language?: Lang;
  /** Texte de description diégétique. */
  prompt?: string;
  /** Stdin par défaut (test). */
  stdin?: string;
  /** Test programmatique : si fourni, l'output doit le matcher (string ou regex). */
  expected?: { type: "exact" | "contains" | "regex"; value: string };
  /** Callback quand la compilation passe (output match si expected fourni). */
  onSuccess?: (result: CompileApiResult) => void;
  /** Compact : pas d'éditeur full screen. */
  compact?: boolean;
};

type CompileApiResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  phase: "compile" | "run" | "ok" | "timeout";
};

const PHASE_LABEL: Record<CompileApiResult["phase"], string> = {
  ok: "EXÉCUTION OK",
  compile: "COMPILATION ÉCHOUÉE",
  run: "ERREUR D'EXÉCUTION",
  timeout: "TIMEOUT",
};

const PHASE_COLOR: Record<CompileApiResult["phase"], string> = {
  ok: "var(--phosphor)",
  compile: "var(--alert)",
  run: "var(--classified)",
  timeout: "var(--alert)",
};

function checkExpected(
  stdout: string,
  expected?: Props["expected"],
): boolean {
  if (!expected) return true;
  if (expected.type === "exact") return stdout.trim() === expected.value.trim();
  if (expected.type === "contains") return stdout.includes(expected.value);
  if (expected.type === "regex") return new RegExp(expected.value).test(stdout);
  return false;
}

export function CompileLab({
  initialCode = "",
  language = "java",
  prompt,
  stdin,
  expected,
  onSuccess,
  compact = false,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CompileApiResult | null>(null);
  const [matched, setMatched] = useState<boolean | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(initialCode);
    setResult(null);
    setMatched(null);
  }, [initialCode]);

  async function run() {
    setRunning(true);
    setResult(null);
    setMatched(null);
    try {
      const r = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin }),
      });
      const j: CompileApiResult = await r.json();
      setResult(j);
      const ok = j.ok && checkExpected(j.stdout, expected);
      setMatched(ok);
      if (ok && onSuccess) onSuccess(j);
    } catch (e) {
      setResult({
        ok: false,
        stdout: "",
        stderr: `Erreur transport : ${(e as Error).message}`,
        exitCode: 1,
        durationMs: 0,
        phase: "compile",
      });
    } finally {
      setRunning(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
    // Tab insère 4 espaces
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        background: "rgba(7, 9, 26, 0.7)",
        border: "1px solid var(--rule)",
        padding: "1rem",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-[0.62rem] tracking-classified flex items-center gap-3"
          style={{ color: "var(--ink-faint)" }}
        >
          <span style={{ color: "var(--phosphor)" }}>LE LABORATOIRE</span>
          <span>·</span>
          <span>{language.toUpperCase()}</span>
          {expected && (
            <>
              <span>·</span>
              <span>TEST&nbsp;ATTACHÉ</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="btn-int"
          data-variant={matched ? "" : "classified"}
          onClick={run}
          disabled={running}
        >
          {running ? "// EXÉCUTION…" : "COMPILER ⏎"}
        </button>
      </div>

      {prompt && (
        <p
          className="text-[0.85rem] leading-relaxed"
          style={{ color: "var(--ink-primary)" }}
        >
          {prompt}
        </p>
      )}

      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKey}
        spellCheck={false}
        wrap="off"
        rows={compact ? 8 : 18}
        className="font-mono text-[0.82rem] w-full resize-y outline-none"
        style={{
          background: "var(--bg-void)",
          color: "var(--ink-primary)",
          border: "1px solid var(--rule)",
          padding: "0.7rem",
          tabSize: 4,
          lineHeight: 1.55,
          caretColor: "var(--phosphor)",
        }}
      />

      <div
        className="text-[0.62rem] tracking-classified flex items-center gap-4"
        style={{ color: "var(--ink-faint)" }}
      >
        <span>⌘/Ctrl + ⏎ pour exécuter</span>
        <span>·</span>
        <span>Tab insère 4 espaces</span>
      </div>

      {result && (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-3 text-[0.7rem] tracking-classified"
            style={{ color: PHASE_COLOR[result.phase] }}
          >
            <span>{PHASE_LABEL[result.phase]}</span>
            <span style={{ color: "var(--ink-faint)" }}>
              · {result.durationMs} ms · exit {String(result.exitCode)}
            </span>
            {expected && matched !== null && (
              <span
                style={{
                  color: matched ? "var(--phosphor)" : "var(--alert)",
                }}
              >
                · {matched ? "TEST PASSÉ" : "TEST ÉCHOUÉ"}
              </span>
            )}
          </div>
          {result.stdout && (
            <pre
              className="font-mono text-[0.78rem] whitespace-pre-wrap break-words"
              style={{
                background: "rgba(58, 255, 149, 0.04)",
                color: "var(--phosphor)",
                padding: "0.7rem 0.9rem",
                borderInlineStart: "2px solid var(--phosphor-dim)",
              }}
            >
              {result.stdout}
            </pre>
          )}
          {result.stderr && (
            <pre
              className="font-mono text-[0.78rem] whitespace-pre-wrap break-words"
              style={{
                background: "rgba(255, 58, 58, 0.05)",
                color: "var(--alert)",
                padding: "0.7rem 0.9rem",
                borderInlineStart: "2px solid var(--alert)",
              }}
            >
              {result.stderr}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
