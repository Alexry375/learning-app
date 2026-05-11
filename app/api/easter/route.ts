import { NextRequest, NextResponse } from "next/server";
import { bumpEgg } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { id?: string } = {};
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const id = (body.id ?? "").toString().slice(0, 64);
  if (!/^[a-z0-9_-]{2,64}$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const hits = bumpEgg(id);
  return NextResponse.json({ hits });
}
