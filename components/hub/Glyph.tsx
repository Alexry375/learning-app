"use client";

import { useRef, useState } from "react";

/**
 * Glyphe ASCII de l'Interpréteur — sceau octogonal stylisé.
 * Pas de logo. Une marque typographique uniquement.
 *
 * Easter egg : triple-click révèle une signature alternative.
 */
const GLYPH = `      ╓──────╖
   ╓─┘░▒▓██▓▒░└─╖
  ┃░▒▓█  Ω  █▓▒░┃
  ┃▒▓█  ╱│╲  █▓▒┃
  ┃▓█  ╱ │ ╲  █▓┃
  ┃█  ┤  ●  ├  █┃
  ┃▓█  ╲ │ ╱  █▓┃
  ┃▒▓█  ╲│╱  █▓▒┃
  ┃░▒▓█  Σ  █▓▒░┃
   ╙─╖░▒▓██▓▒░╓─╜
      ╙──────╜`;

const GLYPH_SIGMA = `      ╓──────╖
   ╓─┘░▒▓██▓▒░└─╖
  ┃░▒▓█  Σ  █▓▒░┃
  ┃▒▓█  ╲│╱  █▓▒┃
  ┃▓█  ╲ │ ╱  █▓┃
  ┃█  ┤  ◦  ├  █┃
  ┃▓█  ╱ │ ╲  █▓┃
  ┃▒▓█  ╱│╲  █▓▒┃
  ┃░▒▓█  Σ  █▓▒░┃
   ╙─╖░▒▓██▓▒░╓─╜
      ╙──────╜`;

export function Glyph({ size = "0.55rem" }: { size?: string }) {
  const [flipped, setFlipped] = useState(false);
  const clicks = useRef<number[]>([]);

  function onClick() {
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < 700);
    clicks.current.push(now);
    if (clicks.current.length >= 3) {
      setFlipped(true);
      clicks.current = [];
      fetch("/api/easter", {
        method: "POST",
        body: JSON.stringify({ id: "glyph-flip" }),
      }).catch(() => {});
      setTimeout(() => setFlipped(false), 4000);
    }
  }

  return (
    <pre
      className="glyph select-none"
      style={{ fontSize: size, margin: 0, cursor: "pointer" }}
      aria-hidden="true"
      onClick={onClick}
      title=""
    >
      {flipped ? GLYPH_SIGMA : GLYPH}
    </pre>
  );
}

export const SHORT_GLYPH = "⟨ Ω ⟩";
