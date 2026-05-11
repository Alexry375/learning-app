import { notFound } from "next/navigation";
import { getAnomalie } from "@/anomalies/registry";
import { getTP } from "@/anomalies/003-le-noyau-fracture/content/tp-index";
import { getTPContent } from "@/anomalies/003-le-noyau-fracture/content";
import { RenduCockpit } from "@/components/anomalie-003/RenduCockpit";

export const dynamic = "force-dynamic";

export default async function RenduPage({
  params,
}: {
  params: Promise<{ slug: string; tp: string }>;
}) {
  const { slug, tp } = await params;
  const meta = getAnomalie(slug);
  if (!meta || slug !== "003-le-noyau-fracture") notFound();

  const tpMeta = getTP(tp);
  const content = getTPContent(tp);
  if (!tpMeta || !content) notFound();

  return <RenduCockpit slug={slug} tpMeta={tpMeta} content={content} />;
}
