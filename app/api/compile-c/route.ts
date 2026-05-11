import { NextRequest, NextResponse } from "next/server";
import {
  compileC,
  validateRequest,
  ALLOWED_EXTRA_FLAGS,
  type AllowedFlag,
  type CompileCRequest,
} from "@/lib/compile-c";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asStringArray(v: unknown): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is string => typeof x === "string");
}

function asFlagArray(v: unknown): AllowedFlag[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v)) return undefined;
  const out: AllowedFlag[] = [];
  for (const f of v) {
    if (typeof f !== "string") continue;
    if ((ALLOWED_EXTRA_FLAGS as readonly string[]).includes(f)) {
      out.push(f as AllowedFlag);
    } else {
      // Signal d'erreur — laissé à validateRequest pour la réponse 400.
      return [f as AllowedFlag];
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid-payload", details: "JSON malformé." },
      { status: 400 },
    );
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const reqObj: CompileCRequest = {
    code: typeof b.code === "string" ? b.code : "",
    stdin: typeof b.stdin === "string" ? b.stdin : undefined,
    args: asStringArray(b.args),
    timeoutMs:
      typeof b.timeoutMs === "number" && Number.isFinite(b.timeoutMs)
        ? b.timeoutMs
        : undefined,
    extraFlags: asFlagArray(b.extraFlags),
  };

  const err = validateRequest(reqObj);
  if (err) {
    if (err.kind === "code-too-large") {
      return NextResponse.json(
        { error: "code-too-large", details: "Source > 50 KB." },
        { status: 400 },
      );
    }
    if (err.kind === "invalid-flag") {
      return NextResponse.json(
        {
          error: "invalid-flag",
          details: `Flag refusé: ${err.flag}. Autorisés: ${ALLOWED_EXTRA_FLAGS.join(", ")}.`,
        },
        { status: 400 },
      );
    }
  }

  try {
    const result = await compileC(reqObj);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "sandbox-error", details: (e as Error).message },
      { status: 500 },
    );
  }
}
