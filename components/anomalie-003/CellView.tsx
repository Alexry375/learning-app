"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cell } from "@/anomalies/003-le-noyau-fracture/content/cell-types";
import {
  validate,
  validateOpenText,
} from "@/anomalies/003-le-noyau-fracture/content/validate";
import { CodeEditorC } from "./CodeEditorC";
import { useCompileC, type CompileCResponse } from "./useCompileC";
import { useKernel } from "./kernel-store";
import { RunResult } from "./RunResult";

type Props = {
  cell: Cell;
  total: number;
};

type Phase = "idle" | "compiling" | "ok" | "fail";

export function CellView({ cell, total }: Props) {
  const [code, setCode] = useState(cell.starterCode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [openTextValue, setOpenTextValue] = useState("");
  const [openTextResult, setOpenTextResult] = useState<{
    ok: boolean;
    reason?: string;
  } | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const { run, running, result } = useCompileC();
  const { state, dispatch, observeSource, observeRunResult } = useKernel();
  const sealed = state.cellsCompleted.has(cell.id);

  useEffect(() => {
    setCode(cell.starterCode);
    setPhase("idle");
    setValidationMsg(null);
    setOpenTextResult(null);
    setOpenTextValue("");
    setShowHint(false);
    setAttempts(0);
  }, [cell.id, cell.starterCode]);

  async function handleCompile() {
    setPhase("compiling");
    setValidationMsg(null);
    observeSource(code);
    const challenge =
      cell.challenge?.kind === "compile" ? cell.challenge : null;
    const r = await run({
      code,
      stdin: challenge?.stdin,
      args: challenge?.args,
      timeoutMs: 4000,
    });
    if (!r) {
      setPhase("fail");
      return;
    }
    observeRunResult(r);
    handleValidationAfterRun(r);
  }

  function handleValidationAfterRun(r: CompileCResponse) {
    setAttempts((a) => a + 1);
    const rule =
      cell.challenge?.kind === "compile"
        ? cell.challenge.validate
        : cell.starterValidation;
    if (!rule) {
      // Pas de validation : on considère OK si compile + run ok.
      const ok = r.compileOk && r.exitSignalName === null;
      setPhase(ok ? "ok" : "fail");
      if (ok) {
        dispatch({ type: "complete-cell", cellId: cell.id });
        dispatch({
          type: "log",
          level: "info",
          message: `cell ${cell.id}: sealed`,
        });
      }
      return;
    }
    const v = validate(rule, {
      compileOk: r.compileOk,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: r.exitCode,
      exitSignalName: r.exitSignalName,
    });
    if (v.ok) {
      setPhase("ok");
      setValidationMsg(null);
      dispatch({ type: "complete-cell", cellId: cell.id });
      dispatch({
        type: "log",
        level: "info",
        message: `cell ${cell.id}: validation passed`,
      });
    } else {
      setPhase("fail");
      setValidationMsg(v.reason ?? "validation refusée");
    }
  }

  function handleOpenTextSubmit() {
    const ch = cell.challenge;
    if (!ch || ch.kind !== "open-text") return;
    const v = validateOpenText(ch.validate, openTextValue);
    setOpenTextResult(v);
    setAttempts((a) => a + 1);
    if (v.ok) {
      dispatch({ type: "complete-cell", cellId: cell.id });
      dispatch({
        type: "log",
        level: "info",
        message: `cell ${cell.id}: quiz validé`,
      });
    }
  }

  function handleReset() {
    setCode(cell.starterCode);
    setPhase("idle");
    setValidationMsg(null);
  }

  const stateAttr: "active" | "ok" | "fail" | "sealed" = sealed
    ? "sealed"
    : phase === "ok"
      ? "ok"
      : phase === "fail"
        ? "fail"
        : "active";

  const headerStatus = useMemo(() => {
    if (sealed) return { label: "scellé", color: "var(--allocataire-kernel-dim)" };
    if (running)
      return { label: "compilation", color: "var(--allocataire-syscall)" };
    if (phase === "ok")
      return { label: "ok", color: "var(--allocataire-kernel)" };
    if (phase === "fail")
      return { label: "refusé", color: "var(--allocataire-panic)" };
    return { label: "idle", color: "var(--allocataire-ink-dim)" };
  }, [sealed, running, phase]);

  return (
    <article className="cell-card" data-state={stateAttr} id={`cell-${cell.id}`}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "1rem",
          padding: "0.7rem 1rem",
          borderBottom: "1px solid var(--allocataire-rule)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: "var(--allocataire-ink-faint)",
            fontSize: "0.62rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          CELL {String(cell.number).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "var(--allocataire-ink)",
          }}
        >
          {cell.title}
        </h3>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: headerStatus.color,
          }}
        >
          [ {headerStatus.label} ]
        </span>
      </header>

      <div style={{ padding: "1rem" }}>
        {/* Théorie */}
        <Section label="THÉORIE">
          <Prose body={cell.theory} />
        </Section>

        {/* Pourquoi ce design */}
        {cell.whyBox && (
          <WhyBox body={cell.whyBox} />
        )}

        {/* Code */}
        <Section label="CODE">
          <CodeEditorC
            value={code}
            onChange={setCode}
            readOnly={sealed}
            minHeight={140}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginTop: "0.6rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn-kernel"
              data-variant="syscall"
              onClick={handleCompile}
              disabled={running || sealed}
            >
              {running ? "compilation…" : "compiler"}
            </button>
            <button
              type="button"
              className="btn-kernel"
              onClick={handleReset}
              disabled={running}
            >
              reset
            </button>
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                color: "var(--allocataire-ink-faint)",
                textTransform: "uppercase",
              }}
            >
              gcc 13.3 · aarch64 · sandbox /tmp/interpreteur-c
            </span>
          </div>
        </Section>

        {/* Run result */}
        {result && <RunResult result={result} />}

        {/* Validation msg */}
        {validationMsg && phase === "fail" && (
          <div
            style={{
              marginTop: "0.6rem",
              padding: "0.6rem 0.8rem",
              border: "1px solid var(--allocataire-panic)",
              color: "var(--allocataire-panic)",
              fontSize: "0.72rem",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-mono)",
            }}
          >
            <strong>Validation refusée.</strong>
            {"\n"}
            {validationMsg}
          </div>
        )}

        {/* Analyse — seulement après première compile réussie */}
        {cell.analysis && (phase === "ok" || sealed) && (
          <Section label="ANALYSE">
            <Prose body={cell.analysis} />
          </Section>
        )}

        {/* Défi */}
        {cell.challenge && cell.challenge.kind === "compile" && (
          <Section label="DÉFI">
            <Prose body={cell.challenge.prompt} />
            {cell.challenge.hint && (
              <div style={{ marginTop: "0.4rem" }}>
                {!showHint && attempts >= 2 && (
                  <button
                    type="button"
                    className="btn-kernel"
                    onClick={() => setShowHint(true)}
                    style={{ fontSize: "0.6rem", padding: "2px 10px" }}
                  >
                    afficher un indice
                  </button>
                )}
                {showHint && (
                  <div
                    style={{
                      marginTop: "0.4rem",
                      padding: "0.5rem 0.8rem",
                      border: "1px dashed var(--allocataire-userspace-dim)",
                      color: "var(--allocataire-userspace)",
                      fontSize: "0.72rem",
                    }}
                  >
                    <Prose body={cell.challenge.hint} />
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {/* Quiz texte ouvert */}
        {cell.challenge && cell.challenge.kind === "open-text" && (
          <Section label="QUIZ">
            <Prose body={cell.challenge.prompt} />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <input
                value={openTextValue}
                onChange={(e) => setOpenTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOpenTextSubmit();
                }}
                style={{
                  flex: 1,
                  background: "rgba(5, 8, 19, 0.8)",
                  border: "1px solid var(--allocataire-rule-strong)",
                  color: "var(--allocataire-ink)",
                  padding: "0.45rem 0.7rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  outline: "none",
                }}
                placeholder="ta réponse"
                disabled={sealed}
              />
              <button
                type="button"
                className="btn-kernel"
                data-variant="syscall"
                onClick={handleOpenTextSubmit}
                disabled={sealed || !openTextValue.trim()}
              >
                envoyer
              </button>
            </div>
            {openTextResult && (
              <div
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.7rem",
                  color: openTextResult.ok
                    ? "var(--allocataire-kernel)"
                    : "var(--allocataire-panic)",
                }}
              >
                {openTextResult.ok
                  ? "validé."
                  : `refusé. ${openTextResult.reason ?? ""}`}
              </div>
            )}
            {cell.challenge.hint && attempts >= 2 && !openTextResult?.ok && (
              <div
                style={{
                  marginTop: "0.4rem",
                  padding: "0.5rem 0.8rem",
                  border: "1px dashed var(--allocataire-userspace-dim)",
                  color: "var(--allocataire-userspace)",
                  fontSize: "0.7rem",
                }}
              >
                indice : {cell.challenge.hint}
              </div>
            )}
          </Section>
        )}

        {/* Refs */}
        {cell.refs && cell.refs.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.6rem",
              borderTop: "1px dashed var(--allocataire-rule)",
              fontSize: "0.62rem",
              color: "var(--allocataire-ink-faint)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            référence ·{" "}
            {cell.refs.map((r, i) => (
              <span key={r.url}>
                {i > 0 && " · "}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--allocataire-syscall)" }}
                >
                  {r.label}
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--allocataire-ink-faint)",
          marginBottom: "0.4rem",
        }}
      >
        ▸ {label}
      </div>
      {children}
    </section>
  );
}

function WhyBox({ body }: { body: string }) {
  return (
    <div
      style={{
        margin: "0.4rem 0 1rem",
        padding: "0.7rem 0.9rem",
        background: "rgba(94, 193, 255, 0.04)",
        borderLeft: "2px solid var(--allocataire-syscall)",
      }}
    >
      <div
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--allocataire-syscall)",
          marginBottom: "0.3rem",
        }}
      >
        Pourquoi ce design ?
      </div>
      <Prose body={body} accent />
    </div>
  );
}

/**
 * Mini-renderer markdown léger : **gras**, _italic_, `code`, et
 * paragraphes séparés par double-newline.
 */
function Prose({ body, accent = false }: { body: string; accent?: boolean }) {
  const parts = body.split(/\n\n+/);
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
        lineHeight: 1.55,
        color: accent ? "var(--allocataire-ink)" : "var(--allocataire-ink-dim)",
        whiteSpace: "pre-wrap",
      }}
    >
      {parts.map((p, i) => (
        <p
          key={i}
          style={{ margin: i === 0 ? 0 : "0.5rem 0 0" }}
          dangerouslySetInnerHTML={{ __html: renderInline(p) }}
        />
      ))}
    </div>
  );
}

function renderInline(s: string): string {
  // Escape HTML.
  const escaped = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(
      /`([^`]+)`/g,
      '<code style="color:var(--allocataire-kernel);background:rgba(157,255,209,0.08);padding:0 4px;border-radius:2px">$1</code>',
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--allocataire-ink)">$1</strong>')
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}
