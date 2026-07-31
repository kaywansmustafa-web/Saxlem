export type PortalApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "timeout"
  | "offline"
  | "invalidResponse"
  | "unavailable";

export interface NormalizedApiError {
  readonly kind: PortalApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
  readonly retryable: boolean;
}

export class PortalApiError extends Error {
  constructor(readonly detail: NormalizedApiError) {
    super(detail.message);
    this.name = "PortalApiError";
  }
}

export const safeApiMessage = Object.freeze({
  unauthorized: "Your email or password is incorrect.",
  forbidden: "Your account does not have access to the Clinic Portal.",
  validation: "Check the information you entered and try again.",
  timeout: "The service took too long to respond. Please try again.",
  offline: "The service cannot be reached. Check your connection and try again.",
  invalidResponse: "The service returned an unexpected response.",
  unavailable: "The service could not complete the request.",
});
