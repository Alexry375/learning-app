"use client";

import { useState } from "react";

export type CompileCResponse = {
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

export type CompileCRequest = {
  code: string;
  stdin?: string;
  args?: string[];
  timeoutMs?: number;
  extraFlags?: ("-pthread" | "-lm")[];
};

export function useCompileC() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CompileCResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(req: CompileCRequest): Promise<CompileCResponse | null> {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/compile-c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "unknown" }));
        const msg = `${j.error ?? "erreur"}${j.details ? " · " + j.details : ""}`;
        setError(msg);
        return null;
      }
      const data = (await res.json()) as CompileCResponse;
      setResult(data);
      return data;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { run, running, result, error, reset };
}
