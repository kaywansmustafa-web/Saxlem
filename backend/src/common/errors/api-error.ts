export interface FieldError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly retryable: boolean;
    readonly fieldErrors: readonly FieldError[];
  };
}
