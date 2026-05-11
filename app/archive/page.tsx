import { HubFrame } from "@/components/hub/HubFrame";
import { ANOMALIES } from "@/anomalies/registry";
import { getProgression } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const all = ANOMALIES.map((a) => ({
    meta: a,
    progression: getProgression(a.slug),
  }));
  const archived = all.filter(
    (d) => d.progression?.status === "resolved" || d.progression?.status === "partial",
  );

  return (
    <HubFrame
      title="ARCHIVE"
      subtitle="// dossiers clôturés — replayables"
    >
      {archived.length === 0 ? (
        <p
          className="text-[0.92rem] leading-relaxed max-w-prose italic"
          style={{ color: "var(--ink-dim)" }}
        >
          L&apos;archive est vide. Toute intervention résolue y déposera son
          dossier. Ils restent consultables — l&apos;Interpréteur n&apos;efface jamais.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {archived.map((d) => (
            <li key={d.meta.slug}>
              <Link
                href={`/anomalie/${d.meta.slug}`}
                prefetch={false}
                className="block px-5 py-4 border border-[color:var(--rule)] hover:border-[color:var(--phosphor)] transition-colors"
              >
                <div
                  className="text-[0.62rem] tracking-classified mb-1"
                  style={{ color: "var(--ink-faint)" }}
                >
                  DOSSIER {d.meta.code}
                  <span
                    className="ml-3"
                    style={{
                      color:
                        d.progression?.status === "resolved"
                          ? "var(--phosphor)"
                          : "var(--seal)",
                    }}
                  >
                    {d.progression?.status === "resolved" ? "RÉSOLU" : "PARTIEL"}
                  </span>
                </div>
                <div className="font-mono text-[1rem]">{d.meta.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HubFrame>
  );
}
