import { HubFrame } from "@/components/hub/HubFrame";
import { listLoreFragments } from "@/lib/db";

export const dynamic = "force-dynamic";

const PLACEHOLDER_LINES = [
  "// fragment dormant",
  "// fragment dormant",
  "// fragment dormant",
  "// fragment dormant",
  "// fragment dormant",
];

export default function JournalPage() {
  const fragments = listLoreFragments();

  return (
    <HubFrame
      title="JOURNAL DE TERRAIN"
      subtitle="// fragments collectés au fil des interventions"
    >
      <div className="flex flex-col gap-6">
        {fragments.length === 0 ? (
          <div>
            <p
              className="text-[0.92rem] leading-relaxed mb-6 max-w-prose"
              style={{ color: "var(--ink-dim)" }}
            >
              Le journal est encore vide. Chaque Anomalie résolue dépose un
              fragment. Les fragments seuls ne disent rien. Ensemble, parfois.
            </p>
            <ol className="flex flex-col gap-3">
              {PLACEHOLDER_LINES.map((line, i) => (
                <li
                  key={i}
                  className="border border-[color:var(--rule)] px-4 py-3 text-[0.78rem]"
                  style={{ color: "var(--ink-faint)" }}
                >
                  <span style={{ color: "var(--ink-faint)" }}>
                    [—] dossier-?-frag-{(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="ml-3 italic">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <ol className="flex flex-col gap-5">
            {fragments.map((f) => (
              <li
                key={f.id}
                className="border border-[color:var(--classified-dim)] px-5 py-4"
                style={{ background: "rgba(212, 165, 72, 0.04)" }}
              >
                <div
                  className="text-[0.62rem] tracking-classified mb-2 flex items-center gap-3"
                  style={{ color: "var(--ink-faint)" }}
                >
                  <span style={{ color: "var(--classified)" }}>
                    {f.id}
                  </span>
                  <span>·</span>
                  <span>{f.unlocked_at}</span>
                </div>
                <h3
                  className="font-mono text-[0.95rem] mb-2"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[0.85rem] leading-relaxed font-serif italic"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {f.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </HubFrame>
  );
}
