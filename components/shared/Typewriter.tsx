"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number; // ms per char
  jitter?: number; // ± jitter ms
  startDelay?: number;
  onDone?: () => void;
  className?: string;
  /** Show caret while typing. */
  caret?: boolean;
  /** Click anywhere on element to fast-forward. */
  skipable?: boolean;
};

/**
 * Typewriter — speed variable, jittered, click-to-complete.
 * Skipping ne mange pas le clic suivant : il finit le texte, c'est tout.
 */
export function Typewriter({
  text,
  speed = 18,
  jitter = 8,
  startDelay = 0,
  onDone,
  className,
  caret = true,
  skipable = true,
}: Props) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setOut("");
    setDone(false);
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function tick() {
      if (cancelRef.current) return;
      if (i >= text.length) {
        setDone(true);
        onDone?.();
        return;
      }
      i++;
      setOut(text.slice(0, i));
      const delta = speed + (Math.random() * 2 - 1) * jitter;
      timer = setTimeout(tick, Math.max(2, delta));
    }

    const startT = setTimeout(tick, startDelay);
    return () => {
      cancelRef.current = true;
      if (timer) clearTimeout(timer);
      clearTimeout(startT);
    };
  }, [text, speed, jitter, startDelay, onDone]);

  function fastForward() {
    if (!skipable || done) return;
    cancelRef.current = true;
    setOut(text);
    setDone(true);
    onDone?.();
  }

  return (
    <span
      ref={ref}
      className={className}
      onClick={fastForward}
      style={{ cursor: skipable && !done ? "pointer" : undefined }}
    >
      {out}
      {!done && caret && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "0.5ch",
            color: "var(--phosphor)",
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
}
