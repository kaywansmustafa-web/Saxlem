import { logoutOwner } from "@/infrastructure/auth";
import { sameOrigin } from "@/infrastructure/request-security";

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    await logoutOwner(true);
  } catch {
    // The encrypted local session is cleared even if backend revocation fails.
  }
  return Response.redirect(new URL("/login", request.url), 303);
}
