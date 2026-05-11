import { HubFrame } from "@/components/hub/HubFrame";
import { getAgent, listLoreFragments, getProgression } from "@/lib/db";
import { ANOMALIES } from "@/anomalies/registry";

export const dynamic = "force-dynamic";

const LAYERS = [
  { name: "Objet", domain: "TOB / Java + UML" },
  { name: "Inférentielle", domain: "Apprentissage" },
  { name: "Signal", domain: "Télécommunications" },
  { name: "Topologique", domain: "Réseaux locaux" },
  { name: "Allocataire", domain: "Systèmes d'exploitation" },
  { name: "Numérique", domain: "Calcul Scientifique" },
];

export default function ProfilPage() {
  const agent = getAgent();
  const fragments = listLoreFragments();
  const progressions = ANOMALIES.map((a) => ({
    meta: a,
    progression: getProgression(a.slug),
  }));
  const resolvedCount = progressions.filter(
    (p) => p.progression?.status === "resolved",
  ).length;
  const partialCount = progressions.filter(
    (p) => p.progression?.status === "partial",
  ).length;

  const masteredLayers = new Set(
    progressions
      .filter((p) => p.progression?.status === "resolved")
      .map((p) => p.meta.layer),
  );

  return (
    <HubFrame title="PROFIL DE COMPILATEUR" subtitle="// dossier personnel">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section>
          <h2
            className="text-[0.7rem] tracking-classified mb-4"
            style={{ color: "var(--ink-dim)" }}
          >
            IDENTITÉ
          </h2>
          <dl
            className="text-[0.85rem] flex flex-col gap-2"
            style={{ color: "var(--ink-primary)" }}
          >
            <div className="flex justify-between border-b border-[color:var(--rule)] pb-1">
              <dt
                className="text-[0.7rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                HANDLE
              </dt>
              <dd>{agent.handle}</dd>
            </div>
            <div className="flex justify-between border-b border-[color:var(--rule)] pb-1">
              <dt
                className="text-[0.7rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                CLEARANCE
              </dt>
              <dd style={{ color: "var(--classified)" }}>
                {"τ".repeat(agent.clearance)} ({agent.clearance})
              </dd>
            </div>
            <div className="flex justify-between border-b border-[color:var(--rule)] pb-1">
              <dt
                className="text-[0.7rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                CASSES RÉSOLUS
              </dt>
              <dd style={{ color: "var(--phosphor)" }}>{resolvedCount}</dd>
            </div>
            <div className="flex justify-between border-b border-[color:var(--rule)] pb-1">
              <dt
                className="text-[0.7rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                CASSES PARTIELS
              </dt>
              <dd style={{ color: "var(--seal)" }}>{partialCount}</dd>
            </div>
            <div className="flex justify-between border-b border-[color:var(--rule)] pb-1">
              <dt
                className="text-[0.7rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                FRAGMENTS
              </dt>
              <dd>{fragments.length}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2
            className="text-[0.7rem] tracking-classified mb-4"
            style={{ color: "var(--ink-dim)" }}
          >
            COUCHES DU SUBSTRAT
          </h2>
          <ul className="flex flex-col gap-2">
            {LAYERS.map((l) => {
              const mastered = masteredLayers.has(l.name);
              return (
                <li
                  key={l.name}
                  className="flex items-center justify-between text-[0.82rem] border-b border-[color:var(--rule)] py-2"
                >
                  <span>
                    <span
                      className="font-mono"
                      style={{
                        color: mastered ? "var(--phosphor)" : "var(--ink-primary)",
                      }}
                    >
                      {l.name}
                    </span>
                    <span
                      className="ml-3 text-[0.68rem] tracking-classified"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      {l.domain}
                    </span>
                  </span>
                  <span
                    className="text-[0.62rem] tracking-classified"
                    style={{
                      color: mastered ? "var(--phosphor)" : "var(--ink-faint)",
                    }}
                  >
                    {mastered ? "MAÎTRISÉE" : "EN ÉCOUTE"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p
        className="mt-12 text-[0.78rem] italic max-w-prose"
        style={{ color: "var(--ink-faint)" }}
      >
        Le statut « maîtrisée » d&apos;une couche se débloque dès la résolution
        d&apos;une Anomalie qui en relève. Vos métriques exactes restent
        confidentielles, y compris pour vous.
      </p>
    </HubFrame>
  );
}
