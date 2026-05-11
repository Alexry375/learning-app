"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  /** Hauteur min en px. */
  minHeight?: number;
  /** Si true : redimensionne automatiquement au contenu. */
  autoSize?: boolean;
};

/**
 * Éditeur C minimal — textarea custom + line numbers + palette
 * Allocataire. Pas de Monaco : on garde le bundle léger et la signature
 * visuelle reconnaissable. La coloration syntaxique vient comme overlay
 * dans une v2 si besoin.
 */
export function CodeEditorC({
  value,
  onChange,
  readOnly = false,
  minHeight = 220,
  autoSize = true,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Auto-resize.
  useEffect(() => {
    if (!autoSize || !taRef.current) return;
    const ta = taRef.current;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, minHeight)}px`;
  }, [value, autoSize, minHeight]);

  // Sync scroll gutter <-> textarea.
  useEffect(() => {
    const ta = taRef.current;
    const g = gutterRef.current;
    if (!ta || !g) return;
    const onScroll = () => {
      g.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Indentation Tab → 4 espaces.
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + "    " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }

  const lineCount = Math.max(value.split("\n").length, 1);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: "flex",
        background: "rgba(5, 8, 19, 0.92)",
        border: "1px solid var(--allocataire-rule)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
        position: "relative",
      }}
    >
      <div
        ref={gutterRef}
        style={{
          width: 38,
          padding: "10px 6px",
          background: "rgba(11, 15, 36, 0.55)",
          borderRight: "1px solid var(--allocataire-rule)",
          color: "var(--allocataire-ink-faint)",
          textAlign: "right",
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
          overflow: "hidden",
          lineHeight: 1.55,
          fontSize: "0.7rem",
        }}
      >
        {lines.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        readOnly={readOnly}
        style={{
          flex: 1,
          minHeight,
          padding: "10px 12px",
          color: "var(--allocataire-ink)",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          lineHeight: 1.55,
          tabSize: 4,
          whiteSpace: "pre",
          overflowX: "auto",
          overflowY: "hidden",
          caretColor: "var(--allocataire-kernel)",
        }}
      />
    </div>
  );
}
