import { NextResponse } from "next/server";
import { getCompilerHealth } from "@/lib/compile-c";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getCompilerHealth();
  return NextResponse.json(health);
}
