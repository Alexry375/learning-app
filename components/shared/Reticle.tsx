"use client";

import { useEffect, useRef } from "react";

const HOT_SELECTOR = "a, button, [role='button'], input, textarea, .dossier";

export function Reticle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) {
      // mobile / tactile : pas de réticule
      document.body.removeAttribute("data-cursor");
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let nextX = 0;
    let nextY = 0;

    function onMove(e: MouseEvent) {
      // hide on Anomalie scenes (they manage their own cursor / atmosphere)
      const inAnomalie = document.querySelector("[data-anomalie]");
      if (el) el.style.opacity = inAnomalie ? "0" : "1";
      nextX = e.clientX;
      nextY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          if (el) {
            el.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
          }
          raf = 0;
        });
      }
    }

    function onOver(e: MouseEvent) {
      const t = e.target as Element | null;
      const hot = t?.closest(HOT_SELECTOR);
      if (el) el.dataset.hot = hot ? "1" : "0";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="reticle" aria-hidden="true" />;
}
