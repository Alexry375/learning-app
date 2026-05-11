"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TPContent } from "@/anomalies/003-le-noyau-fracture/content/cell-types";
import type { TPMeta } from "@/anomalies/003-le-noyau-fracture/content/tp-index";
import { validate } from "@/anomalies/003-le-noyau-fracture/content/validate";
import { KernelProvider, useKernel } from "./kernel-store";
import { KernelMonitor } from "./KernelMonitor";
import { KernelAlerts } from "./KernelAlerts";
import { KernelOutput } from "./KernelOutput";
import { CodeEditorC } from "./CodeEditorC";
import { RunResult } from "./RunResult";
import { useCompileC } from "./useCompileC";

type Props = {
  slug: string;
  tpMeta: TPMeta;
  content: TPContent;
};

export function RenduCockpit({ slug, tpMeta, content }: Props) {
  return (
    <KernelProvider>
      <KernelMonitor tpLabel={`${tpMeta.code} · RENDU`} />
      <KernelAlerts />
      <Body slug={slug} tpMeta={tpMeta} content={content} />
    </KernelProvider>
  );
}

function Body({ slug, tpMeta, content }: Props) {
  const storageKey = `interpreteur-rendu:${tpMeta.id}:${content.renduFile.name}`;
  const [code, setCode] = useState(content.renduFile.initialContent);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const { run, running, result } = useCompileC();
  const { observeSource, observeRunResult } = useKernel();

  // Persistance localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && saved.length > 0) setCode(saved);
    } catch {
      /* noop */
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, code);
    } catch {
      /* noop */
    }
  }, [code, storageKey]);

  async function handleCompile() {
    setValidationMsg(null);
    setValidated(false);
    observeSource(code);
    const r = await run({ code, timeoutMs: 5000 });
    if (!r) return;
    observeRunResult(r);
    if (content.renduFile.validation) {
      const v = validate(content.renduFile.validation, {
        compileOk: r.compileOk,
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.exitCode,
        exitSignalName: r.exitSignalName,
      });
      if (v.ok) setValidated(true);
      else setValidationMsg(v.reason ?? "validation refusée");
    } else if (r.compileOk) {
      setValidated(true);
    }
  }

  function handleReset() {
    setCode(content.renduFile.initialContent);
    setValidationMsg(null);
    setValidated(false);
  }

  function handleDownload() {
    const blob = new Blob([code], { type: "text/x-c" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = content.renduFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "1.5rem clamp(1rem, 5vw, 3rem) 4rem",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <Link
        href={`/anomalie/${slug}/${tpMeta.slug}`}
        prefetch={false}
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--allocataire-ink-faint)",
          textDecoration: "none",
        }}
      >
        ← retour aux cellules
      </Link>

      <header style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <div
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--allocataire-kernel-dim)",
          }}
        >
          {tpMeta.code} · CHAMBRE DU RENDU
        </div>
        <h1
          style={{
            margin: "0.4rem 0",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            fontWeight: 300,
            color: "var(--allocataire-ink)",
          }}
        >
          {content.renduFile.name}
        </h1>
        <p
          style={{
            margin: "0.6rem 0 0",
            maxWidth: "75ch",
            fontSize: "0.8rem",
            lineHeight: 1.55,
            color: "var(--allocataire-ink-dim)",
          }}
        >
          {content.renduFile.brief}
        </p>
      </header>

      {/* Éditeur full */}
      <section
        className="cell-card"
        data-state={validated ? "ok" : "active"}
        style={{ marginBottom: "1.5rem" }}
      >
        <div
          style={{
            padding: "0.6rem 1rem",
            borderBottom: "1px solid var(--allocataire-rule)",
            display: "flex",
            alignItems: "baseline",
            gap: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
          }}
        >
          <span
            style={{
              color: "var(--allocataire-ink-faint)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.55rem",
            }}
          >
            file
          </span>
          <span style={{ color: "var(--allocataire-kernel)" }}>
            {content.renduFile.name}
          </span>
          <span
            style={{
              marginLeft: "auto",
              color: validated
                ? "var(--allocataire-kernel)"
                : "var(--allocataire-ink-faint)",
              fontSize: "0.55rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            [ {validated ? "validé" : "non validé"} ]
          </span>
        </div>
        <div style={{ padding: "0.8rem" }}>
          <CodeEditorC
            value={code}
            onChange={(v) => {
              setCode(v);
              setValidated(false);
            }}
            minHeight={420}
          />
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
              marginTop: "0.8rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn-kernel"
              data-variant="syscall"
              onClick={handleCompile}
              disabled={running}
            >
              {running ? "compilation…" : "compiler"}
            </button>
            <button
              type="button"
              className="btn-kernel"
              onClick={handleDownload}
            >
              télécharger .{content.renduFile.name.split(".").pop()}
            </button>
            <button
              type="button"
              className="btn-kernel"
              onClick={handleReset}
              disabled={running}
              style={{ color: "var(--allocataire-signal)" }}
            >
              réinitialiser
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
              sauvegarde locale active · gcc 13.3 aarch64
            </span>
          </div>
          {result && <RunResult result={result} />}
          {validationMsg && !validated && (
            <div
              style={{
                marginTop: "0.6rem",
                padding: "0.6rem 0.8rem",
                border: "1px solid var(--allocataire-panic)",
                color: "var(--allocataire-panic)",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>Validation refusée.</strong>
              {"\n"}
              {validationMsg}
            </div>
          )}
          {validated && (
            <div
              style={{
                marginTop: "0.6rem",
                padding: "0.6rem 0.8rem",
                border: "1px solid var(--allocataire-kernel-dim)",
                color: "var(--allocataire-kernel)",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              Rendu validé. Tu peux télécharger {content.renduFile.name} et le
              déposer dans ton dossier local.
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <KernelOutput />
      </section>
    </main>
  );
}
