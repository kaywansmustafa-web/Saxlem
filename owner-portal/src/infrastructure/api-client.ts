import "server-only";

import type { ZodType } from "zod";
import type { OwnerSession } from "@/domain/session";
import type { OwnerConfiguration } from "./config";

export class OwnerApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(
      status === 401
        ? "Your session has expired."
        : status === 403
          ? "You do not have permission to access this resource."
          : status === 404
            ? "The requested resource was not found."
            : status === 429
              ? "Too many requests. Try again shortly."
              : "Saxlem services are temporarily unavailable.",
    );
    this.name = "OwnerApiError";
  }
}

export interface OwnerApiRequest<T> {
  readonly path: `/api/v1/${string}`;
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly session?: OwnerSession;
  readonly schema?: ZodType<T>;
  readonly idempotencyKey?: string;
}

export class OwnerApiClient {
  constructor(
    private readonly configuration: Pick<
      OwnerConfiguration,
      "backendUrl" | "timeoutMs"
    >,
    private readonly transport: typeof fetch = fetch,
  ) {}
  async request<T = undefined>(input: OwnerApiRequest<T>): Promise<T> {
    if (
      !input.path.startsWith("/api/v1/") ||
      input.path.includes("..") ||
      input.path.includes("\\") ||
      input.path.includes("//") ||
      /[\u0000-\u001f\u007f]/u.test(input.path)
    )
      throw new OwnerApiError(500, "OWNER_INVALID_PATH");
    const url = new URL(input.path, `${this.configuration.backendUrl.origin}/`);
    if (
      url.origin !== this.configuration.backendUrl.origin ||
      !url.pathname.startsWith("/api/v1/")
    )
      throw new OwnerApiError(500, "OWNER_INVALID_PATH");
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.configuration.timeoutMs,
    );
    try {
      const headers = new Headers({ accept: "application/json" });
      if (input.body !== undefined)
        headers.set("content-type", "application/json");
      if (input.session)
        headers.set("authorization", `Bearer ${input.session.accessToken}`);
      if (input.idempotencyKey)
        headers.set("idempotency-key", input.idempotencyKey);
      const response = await this.transport(url, {
        method: input.method ?? "GET",
        headers,
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      if (response.status === 204) return undefined as T;
      if (
        !response.headers
          .get("content-type")
          ?.toLowerCase()
          .includes("application/json")
      )
        throw new OwnerApiError(502, "OWNER_INVALID_RESPONSE");
      let raw: unknown;
      try {
        const declaredLength = Number(
          response.headers.get("content-length") ?? "0",
        );
        if (Number.isFinite(declaredLength) && declaredLength > 1_048_576)
          throw new Error();
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > 1_048_576)
          throw new Error();
        raw = JSON.parse(text);
      } catch {
        throw new OwnerApiError(502, "OWNER_INVALID_RESPONSE");
      }
      if (!response.ok) {
        const envelope =
          raw && typeof raw === "object" && "error" in raw
            ? (raw as { error?: { code?: unknown; requestId?: unknown } }).error
            : undefined;
        throw new OwnerApiError(
          response.status,
          typeof envelope?.code === "string"
            ? envelope.code
            : `BACKEND_${response.status}`,
          typeof envelope?.requestId === "string"
            ? envelope.requestId
            : undefined,
        );
      }
      if (!input.schema) return raw as T;
      const parsed = input.schema.safeParse(raw);
      if (!parsed.success)
        throw new OwnerApiError(502, "OWNER_INVALID_RESPONSE");
      return parsed.data;
    } catch (error) {
      if (error instanceof OwnerApiError) throw error;
      throw new OwnerApiError(
        error instanceof DOMException && error.name === "AbortError"
          ? 504
          : 503,
        "OWNER_BACKEND_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
