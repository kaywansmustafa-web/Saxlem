import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/data/owner-data";
import { restoreOwnerSession } from "@/infrastructure/auth";

export async function GET(request: NextRequest) {
  const session = await restoreOwnerSession();
  if (!session)
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in is required." } },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80 || /[\u0000-\u001f%_*]/u.test(q))
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Enter between 2 and 80 safe characters.",
        },
      },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  try {
    return NextResponse.json(
      { items: await globalSearch(session, q) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Search is temporarily unavailable.",
        },
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
