import { safeJson } from "./auth/route-response";
export const invalidClinicalRequest = () =>
  safeJson(
    {
      ok: false,
      error: {
        code: "PORTAL_VALIDATION_FAILED",
        message: "Check the information and try again.",
      },
    },
    400,
  );
export async function readClinicalJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json") return { ok: false };
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}
