import { notFound } from "next/navigation";
import { getAnomalie } from "@/anomalies/registry";
import { AnomalieRunner } from "@/components/anomalie-001/AnomalieRunner";
import { CONTENT as ANOMALIE_001 } from "@/anomalies/001-le-compilateur-hante";
import { getProgression } from "@/lib/db";
import { NoyauRunner } from "@/components/anomalie-003/NoyauRunner";

export const dynamic = "force-dynamic";

export default async function AnomaliePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getAnomalie(slug);
  if (!meta) notFound();

  const progression = getProgression(slug);
  const initialPhase = progression?.phase ?? "briefing";

  if (slug === "001-le-compilateur-hante") {
    return (
      <AnomalieRunner
        slug={slug}
        meta={meta}
        content={ANOMALIE_001}
        initialPhase={initialPhase}
      />
    );
  }

  if (slug === "003-le-noyau-fracture") {
    return <NoyauRunner slug={slug} meta={meta} />;
  }

  return (
    <div className="p-10 text-[color:var(--ink-dim)]">
      Module non implémenté.
    </div>
  );
}
