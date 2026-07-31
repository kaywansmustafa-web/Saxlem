import { NextResponse } from "next/server";
import { PortalApiError } from "@/infrastructure/api/api-error";

const NO_STORE_HEADERS = Object.freeze({
  "cache-control": "no-store, max-age=0",
  pragma: "no-cache",
});

export function safeJson(
  body: object,
  status = 200,
): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function safeRouteError(error: unknown): NextResponse {
  if (error instanceof PortalApiError) {
    const status =
      error.detail.kind === "unauthorized"
        ? 401
        : error.detail.kind === "forbidden"
          ? 403
          : error.detail.kind === "validation"
            ? 400
            : 503;
    return safeJson(
      {
        ok: false,
        error: {
          code: error.detail.code,
          message: error.detail.message,
          ...(error.detail.requestId
            ? { requestId: error.detail.requestId }
            : {}),
        },
      },
      status,
    );
  }
  return safeJson(
    {
      ok: false,
      error: {
        code: "PORTAL_REQUEST_FAILED",
        message: "The request could not be completed.",
      },
    },
    500,
  );
}
