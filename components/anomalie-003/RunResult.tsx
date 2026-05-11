"use client";

import type { CompileCResponse } from "./useCompileC";

export function RunResult({ result }: { result: CompileCResponse }) {
  if (!result.compileOk) {
    return (
      <div style={{ marginTop: "0.8rem" }}>
        <div
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--allocataire-panic)",
            marginBottom: "0.3rem",
          }}
        >
          ▸ COMPILATION REFUSÉE
        </div>
        <pre
          style={{
            margin: 0,
            padding: "0.6rem 0.8rem",
            background: "rgba(5, 8, 19, 0.9)",
            border: "1px solid var(--allocataire-panic)",
            color: "var(--allocataire-panic)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
{result.compileStderr || "(gcc: aucun message capturé)"}
        </pre>
      </div>
    );
  }

  const statusLabel = result.timedOut
    ? `tué [SIGKILL] · timeout ${result.durationRunMs.toFixed(0)}ms`
    : result.exitSignalName
      ? `tué [${result.exitSignalName}=${result.exitSignal}]`
      : `exit ${result.exitCode} · ${result.durationRunMs.toFixed(0)}ms`;

  const statusColor = result.timedOut
    ? "var(--allocataire-userspace)"
    : result.exitSignalName
      ? "var(--allocataire-panic)"
      : result.exitCode === 0
        ? "var(--allocataire-kernel)"
        : "var(--allocataire-userspace)";

  return (
    <div style={{ marginTop: "0.8rem" }}>
      {result.compileStderr.trim().length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          <div
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--allocataire-userspace)",
              marginBottom: "0.2rem",
            }}
          >
            ▸ GCC WARNINGS
          </div>
          <pre
            style={{
              margin: 0,
              padding: "0.5rem 0.7rem",
              background: "rgba(5, 8, 19, 0.7)",
              border: "1px dashed var(--allocataire-userspace-dim)",
              color: "var(--allocataire-userspace)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.66rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
{result.compileStderr}
          </pre>
        </div>
      )}

      <div
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--allocataire-ink-faint)",
          marginBottom: "0.3rem",
          display: "flex",
          gap: "0.8rem",
          alignItems: "baseline",
        }}
      >
        <span>▸ STDOUT</span>
        <span style={{ color: statusColor, marginLeft: "auto" }}>
          [ {statusLabel} ]
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "0.6rem 0.8rem",
          background: "rgba(5, 8, 19, 0.92)",
          border: "1px solid var(--allocataire-rule)",
          color: "var(--allocataire-ink)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          minHeight: "1.5rem",
        }}
      >
{result.stdout || "(pas de stdout)"}
      </pre>

      {result.stderr.trim().length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--allocataire-signal)",
              marginBottom: "0.2rem",
            }}
          >
            ▸ STDERR
          </div>
          <pre
            style={{
              margin: 0,
              padding: "0.5rem 0.7rem",
              background: "rgba(5, 8, 19, 0.7)",
              border: "1px dashed var(--allocataire-signal)",
              color: "var(--allocataire-signal)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
{result.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}
