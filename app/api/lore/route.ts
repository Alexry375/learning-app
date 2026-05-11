import { NextRequest, NextResponse } from "next/server";
import { unlockLoreFragment } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { id?: string; slug?: string | null; title?: string; body?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const id = (body.id ?? "").toString().slice(0, 64);
  const title = (body.title ?? "").toString().slice(0, 200);
  const text = (body.body ?? "").toString().slice(0, 4000);
  const slug = body.slug ? body.slug.toString().slice(0, 64) : null;
  if (!id || !title || !text) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  unlockLoreFragment(id, slug, title, text);
  return NextResponse.json({ ok: true });
}
