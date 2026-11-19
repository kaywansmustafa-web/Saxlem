import { z } from "zod";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return Response.json(
      { error: { message: "Document not found." } },
      { status: 404 },
    );
  const session = await restoreOwnerSession();
  if (!session)
    return Response.json(
      { error: { message: "Sign in is required." } },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  try {
    const result = await ownerApi().download(
      `/api/v1/platform/documents/${id}/download`,
      session,
    );
    return new Response(result.body, {
      headers: {
        "content-type": result.contentType,
        "content-disposition": result.disposition,
        "x-content-type-options": "nosniff",
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return Response.json(
      { error: { message: "The document is unavailable." } },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
