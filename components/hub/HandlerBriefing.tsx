"use client";

import { useEffect, useState } from "react";
import { Typewriter } from "@/components/shared/Typewriter";

type Props = {
  handle: string;
  openCount: number;
};

const HOUR_GREETINGS: Array<[number, string]> = [
  [4, "Vigile encore active"],
  [10, "Cycle court engagé"],
  [14, "Plage opérationnelle nominale"],
  [19, "Bascule vers la veille longue"],
  [23, "Veille longue — corridors silencieux"],
];

function pickGreeting(): string {
  const h = new Date().getHours();
  for (const [threshold, text] of HOUR_GREETINGS) {
    if (h < threshold) return text;
  }
  return "Veille longue — corridors silencieux";
}

export function HandlerBriefing({ handle, openCount }: Props) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(pickGreeting());
  }, []);

  const headline = `${greeting ?? "Cycle indéterminé"}, agent ${handle}.`;
  const body = openCount === 0
    ? `Aucune Anomalie active sur ce poste. La couche tient. — Pour le moment.`
    : `${openCount} dossier${openCount > 1 ? "s" : ""} ${openCount > 1 ? "scellés" : "scellé"} attend${openCount > 1 ? "ent" : ""} ouverture. Procédez dans l'ordre que vous jugez. Aucune assistance ne vous sera retirée pour avoir hésité ; on en retire pour avoir tergiversé.`;

  return (
    <section className="flex flex-col gap-4">
      <div
        className="text-[0.7rem] tracking-classified flex items-center gap-3"
        style={{ color: "var(--ink-faint)" }}
      >
        <span style={{ color: "var(--phosphor)" }}>HANDLER</span>
        <span>·</span>
        <span>nœud Δ-7</span>
        <span>·</span>
        <span>canal sécurisé</span>
      </div>

      <h1
        className="font-mono text-[1.45rem] md:text-[1.7rem] leading-tight"
        style={{ color: "var(--ink-primary)" }}
      >
        <Typewriter text={headline} speed={28} jitter={10} caret={false} />
      </h1>

      <p
        className="text-[0.92rem] leading-relaxed max-w-prose"
        style={{ color: "var(--ink-dim)" }}
      >
        <Typewriter text={body} speed={11} jitter={5} startDelay={900} />
      </p>
    </section>
  );
}
