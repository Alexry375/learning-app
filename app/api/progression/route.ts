import { NextRequest, NextResponse } from "next/server";
import { upsertProgression, getProgression } from "@/lib/db";
import { ANOMALIES } from "@/anomalies/registry";

export const runtime = "nodejs";

const VALID_STATUS = new Set(["open", "in_progress", "resolved", "partial"]);
const VALID_PHASES = new Set([
  "briefing",
  "interrogatoires",
  "stack-trace",
  "uml",
  "code",
  "verdict",
]);
const VALID_SLUGS = new Set(ANOMALIES.map((a) => a.slug));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug || !VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }
  const row = getProgression(slug);
  return NextResponse.json({ progression: row });
}

export async function POST(req: NextRequest) {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const slug = typeof raw.anomalie_slug === "string" ? raw.anomalie_slug : "";
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }
  const status =
    typeof raw.status === "string" && VALID_STATUS.has(raw.status)
      ? (raw.status as "open" | "in_progress" | "resolved" | "partial")
      : undefined;
  const phase =
    typeof raw.phase === "string" && VALID_PHASES.has(raw.phase)
      ? raw.phase
      : undefined;
  const score =
    typeof raw.score === "number" && Number.isFinite(raw.score)
      ? Math.max(0, Math.min(10000, Math.trunc(raw.score)))
      : undefined;
  const state_json =
    typeof raw.state_json === "string" && raw.state_json.length < 32_000
      ? raw.state_json
      : undefined;

  upsertProgression(slug, { status, phase, score, state_json });
  return NextResponse.json({ ok: true, progression: getProgression(slug) });
}
