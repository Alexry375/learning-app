"use client";

import Link from "next/link";

export function BackToHub({ variant }: { variant: string }) {
  // Couleurs adaptées par anomalie.
  const isKernel = variant === "003";
  return (
    <Link
      href="/"
      prefetch={false}
      className="fixed top-3 right-4 z-[80] text-[0.62rem] tracking-classified px-3 py-1 transition-colors"
      style={
        isKernel
          ? {
              color: "var(--allocataire-ink-faint)",
              background: "rgba(5, 8, 19, 0.8)",
              border: "1px solid var(--allocataire-rule-strong)",
            }
          : {
              color: "var(--ink-paper-dim)",
              background: "var(--paper)",
              border: "1px solid var(--ink-paper-dim)",
            }
      }
    >
      ← RETOUR AU GRAPHE
    </Link>
  );
}
