import { ANOMALIES } from "@/anomalies/registry";
import { getAgent, getProgression } from "@/lib/db";
import { StatusBar } from "@/components/hub/StatusBar";
import { Dossier } from "@/components/hub/Dossier";
import { CommandLine } from "@/components/hub/CommandLine";
import { CRT } from "@/components/shared/CRT";
import { HandlerBriefing } from "@/components/hub/HandlerBriefing";
import { Glyph } from "@/components/hub/Glyph";

export const dynamic = "force-dynamic";

export default function HubPage() {
  const agent = getAgent();
  const dossiers = ANOMALIES.map((a) => ({
    meta: a,
    progression: getProgression(a.slug),
  }));

  const open = dossiers.filter(
    (d) => !d.progression || d.progression.status !== "resolved",
  );
  const resolved = dossiers.filter(
    (d) => d.progression?.status === "resolved",
  );

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-void)" }}
    >
      <CRT />
      <StatusBar handle={agent.handle} clearance={agent.clearance} />

      {/* Bandeau pleine largeur — citation diégétique */}
      <section className="band band--classified px-6 py-2 text-[0.7rem] tracking-classified flex items-center justify-between">
        <span style={{ color: "var(--classified)" }}>
          // INSTRUCTION PERMANENTE
        </span>
        <span style={{ color: "var(--ink-dim)" }} className="italic">
          Le réel ne se débogue pas seul.
        </span>
        <span style={{ color: "var(--ink-faint)" }}>
          // CHANNEL OPEN
        </span>
      </section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_1fr]">
        {/* Marge latérale gauche : glyphe + meta */}
        <aside className="hidden lg:flex flex-col items-end justify-start pt-12 pr-8 gap-5">
          <Glyph />
          <div
            className="text-[0.62rem] tracking-classified text-right leading-relaxed"
            style={{ color: "var(--ink-faint)" }}
          >
            <div>NŒUD&nbsp;Δ-7 / TLS</div>
            <div>RELAY&nbsp;PI-LOCAL</div>
            <div>POSTURE&nbsp;ACTIVE</div>
          </div>
        </aside>

        {/* Colonne centrale */}
        <div className="px-6 lg:px-2 py-10 lg:py-14 flex flex-col gap-10">
          <HandlerBriefing handle={agent.handle} openCount={open.length} />

          <section>
            <header className="flex items-baseline justify-between mb-4">
              <h2
                className="font-mono text-[0.78rem] tracking-classified"
                style={{ color: "var(--ink-dim)" }}
              >
                DOSSIERS ACTIFS&nbsp;
                <span style={{ color: "var(--classified)" }}>
                  [{open.length}]
                </span>
              </h2>
              <span
                className="text-[0.62rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                CLASSÉ&nbsp;EYES&nbsp;ONLY
              </span>
            </header>
            <div className="flex flex-col gap-4">
              {open.map((d) => (
                <Dossier
                  key={d.meta.slug}
                  meta={d.meta}
                  status={d.progression?.status ?? "open"}
                />
              ))}
              {open.length === 0 && (
                <p
                  className="text-sm italic py-6"
                  style={{ color: "var(--ink-dim)" }}
                >
                  Aucune Anomalie ouverte. Le substrat est calme. — Pour le moment.
                </p>
              )}
            </div>
          </section>

          {resolved.length > 0 && (
            <section>
              <header className="flex items-baseline justify-between mb-3">
                <h2
                  className="font-mono text-[0.78rem] tracking-classified"
                  style={{ color: "var(--ink-faint)" }}
                >
                  ARCHIVÉS&nbsp;[{resolved.length}]
                </h2>
              </header>
              <ul
                className="text-[0.78rem]"
                style={{ color: "var(--ink-dim)" }}
              >
                {resolved.map((d) => (
                  <li key={d.meta.slug} className="py-1">
                    <span style={{ color: "var(--seal)" }}>{d.meta.code}</span>
                    &nbsp;·&nbsp;{d.meta.title}
                    <span
                      className="ml-3 text-[0.62rem]"
                      style={{ color: "var(--phosphor-dim)" }}
                    >
                      RÉSOLU
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Marge latérale droite : transmissions */}
        <aside className="hidden lg:block pt-12 pl-8 pr-6">
          <h3
            className="text-[0.62rem] tracking-classified mb-4"
            style={{ color: "var(--ink-faint)" }}
          >
            TRANSMISSIONS RÉCENTES
          </h3>
          <ol
            className="text-[0.7rem] leading-relaxed flex flex-col gap-3"
            style={{ color: "var(--ink-dim)" }}
          >
            <li>
              <div
                className="text-[0.6rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                T-00:14:22
              </div>
              <div>Confirmation de réception du dossier 001. Sceau intact.</div>
            </li>
            <li>
              <div
                className="text-[0.6rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                T-00:31:08
              </div>
              <div>
                Substrat Système signale dérive. Dossier 003 ouvert pour intervention progressive.
              </div>
            </li>
            <li>
              <div
                className="text-[0.6rem] tracking-classified"
                style={{ color: "var(--ink-faint)" }}
              >
                T-01:42:00
              </div>
              <div className="italic" style={{ color: "var(--ink-faint)" }}>
                /* relevé incomplet — nœud secondaire indisponible */
              </div>
            </li>
          </ol>
        </aside>
      </div>

      <CommandLine />
    </main>
  );
}
