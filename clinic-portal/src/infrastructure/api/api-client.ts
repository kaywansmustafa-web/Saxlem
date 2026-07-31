import "server-only";

import type { ZodType } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { PortalConfiguration } from "@/infrastructure/config/environment";
import {
  PortalApiError,
  safeApiMessage,
  type NormalizedApiError,
} from "./api-error";

interface BackendErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly retryable: boolean;
  };
}
const MAXIMUM_JSON_BYTES = 1_048_576;

export interface ApiResult<T> {
  readonly data: T;
  readonly status: number;
  readonly requestId?: string;
}

export interface ApiRequest<T> {
  readonly path: `/api/v1/${string}`;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly schema?: ZodType<T>;
  readonly session?: AuthenticatedSession;
}

export class BackendApiClient {
  constructor(
    private readonly configuration: Pick<
      PortalConfiguration,
      "backendApiUrl" | "requestTimeoutMs"
    >,
    private readonly transport: typeof fetch = fetch,
  ) {}

  async request<T = undefined>(input: ApiRequest<T>): Promise<ApiResult<T>> {
    const requestUrl = this.requestUrl(input.path);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.configuration.requestTimeoutMs,
    );

    try {
      const headers = new Headers({ accept: "application/json" });
      if (input.body !== undefined) {
        headers.set("content-type", "application/json");
      }
      if (input.session) {
        headers.set("authorization", `Bearer ${input.session.accessToken}`);
        if (input.session.context) {
          headers.set(
            "x-organization-id",
            input.session.context.organizationId,
          );
          headers.set("x-clinic-id", input.session.context.clinicId);
        }
      }

      const response = await this.transport(
        requestUrl,
        {
          method: input.method ?? "GET",
          headers,
          body: input.body === undefined ? undefined : JSON.stringify(input.body),
          signal: controller.signal,
          cache: "no-store",
          redirect: "error",
        },
      );
      const headerRequestId = this.safeRequestId(response.headers.get("x-request-id"));

      if (response.status === 204) {
        if (!response.ok) {
          throw this.errorForStatus(response.status, headerRequestId);
        }
        return { data: undefined as T, status: 204, requestId: headerRequestId };
      }

      const raw = await this.readJson(response, headerRequestId);
      if (!response.ok) {
        throw this.backendError(response.status, raw, headerRequestId);
      }

      if (!input.schema) {
        return { data: raw as T, status: response.status, requestId: headerRequestId };
      }
      const parsed = input.schema.safeParse(raw);
      if (!parsed.success) {
        throw this.invalidResponse(response.status, headerRequestId);
      }
      return {
        data: parsed.data,
        status: response.status,
        requestId: headerRequestId,
      };
    } catch (error) {
      if (error instanceof PortalApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new PortalApiError({
          kind: "timeout",
          status: 504,
          code: "PORTAL_BACKEND_TIMEOUT",
          message: safeApiMessage.timeout,
          retryable: true,
        });
      }
      throw new PortalApiError({
        kind: "offline",
        status: 503,
        code: "PORTAL_BACKEND_UNREACHABLE",
        message: safeApiMessage.offline,
        retryable: true,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private requestUrl(path: string): URL {
    if (
      !path.startsWith("/api/v1/") ||
      path.includes("\\") ||
      path.includes("..") ||
      path.includes("//") ||
      /[\u0000-\u001f\u007f]/u.test(path)
    ) {
      throw new PortalApiError({
        kind: "invalidResponse",
        status: 500,
        code: "PORTAL_INVALID_BACKEND_PATH",
        message: safeApiMessage.invalidResponse,
        retryable: false,
      });
    }

    const baseOrigin = this.configuration.backendApiUrl.origin;
    const url = new URL(path, `${baseOrigin}/`);
    if (url.origin !== baseOrigin || !url.pathname.startsWith("/api/v1/")) {
      throw new PortalApiError({
        kind: "invalidResponse",
        status: 500,
        code: "PORTAL_INVALID_BACKEND_PATH",
        message: safeApiMessage.invalidResponse,
        retryable: false,
      });
    }
    return url;
  }

  private async readJson(
    response: Response,
    requestId?: string,
  ): Promise<unknown> {
    const contentType = response.headers.get("content-type")?.toLowerCase();
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (
      !contentType?.includes("application/json") ||
      (Number.isFinite(contentLength) && contentLength > MAXIMUM_JSON_BYTES)
    ) {
      throw this.invalidResponse(response.status, requestId);
    }
    try {
      const raw = await response.text();
      if (new TextEncoder().encode(raw).byteLength > MAXIMUM_JSON_BYTES) {
        throw new Error("oversized");
      }
      return JSON.parse(raw) as unknown;
    } catch {
      throw this.invalidResponse(response.status, requestId);
    }
  }

  private backendError(
    status: number,
    value: unknown,
    headerRequestId?: string,
  ): PortalApiError {
    const envelope = this.isErrorEnvelope(value) ? value : undefined;
    const detail = this.errorForStatus(
      status,
      this.safeRequestId(envelope?.error.requestId) ?? headerRequestId,
    );
    return new PortalApiError({
      ...detail.detail,
      code: envelope?.error.code ?? detail.detail.code,
      retryable: envelope?.error.retryable ?? detail.detail.retryable,
    });
  }

  private errorForStatus(status: number, requestId?: string): PortalApiError {
    const kind: NormalizedApiError["kind"] =
      status === 401
        ? "unauthorized"
        : status === 403
          ? "forbidden"
          : status === 400 || status === 422
            ? "validation"
            : "unavailable";
    return new PortalApiError({
      kind,
      status,
      code: `BACKEND_${status}`,
      message: safeApiMessage[kind],
      requestId,
      retryable: status >= 500,
    });
  }

  private invalidResponse(status: number, requestId?: string): PortalApiError {
    return new PortalApiError({
      kind: "invalidResponse",
      status: status >= 400 ? status : 502,
      code: "PORTAL_INVALID_BACKEND_RESPONSE",
      message: safeApiMessage.invalidResponse,
      requestId,
      retryable: true,
    });
  }

  private isErrorEnvelope(value: unknown): value is BackendErrorEnvelope {
    if (!value || typeof value !== "object" || !("error" in value)) return false;
    const error = (value as { error?: unknown }).error;
    return Boolean(
      error &&
        typeof error === "object" &&
        typeof (error as Record<string, unknown>).code === "string" &&
        typeof (error as Record<string, unknown>).requestId === "string" &&
        typeof (error as Record<string, unknown>).retryable === "boolean",
    );
  }

  private safeRequestId(value: string | null | undefined): string | undefined {
    return value && /^[A-Za-z0-9._:-]{1,128}$/u.test(value) ? value : undefined;
  }
}
