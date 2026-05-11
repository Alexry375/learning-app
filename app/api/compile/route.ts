import { NextRequest, NextResponse } from "next/server";
import { runCompile, type CompileLanguage } from "@/lib/compile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const language = b.language as CompileLanguage | undefined;
  const code = typeof b.code === "string" ? b.code : "";
  const stdin = typeof b.stdin === "string" ? b.stdin : undefined;
  const className = typeof b.className === "string" ? b.className : undefined;

  if (!language || (language !== "java" && language !== "python")) {
    return NextResponse.json(
      { error: "language must be 'java' or 'python'" },
      { status: 400 },
    );
  }
  if (!code || code.length > 60_000) {
    return NextResponse.json(
      { error: "code missing or too large" },
      { status: 400 },
    );
  }

  const result = await runCompile({ language, code, stdin, className });
  return NextResponse.json(result);
}
