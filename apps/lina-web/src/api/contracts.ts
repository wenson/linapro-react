export interface ApiEnvelope<T> {
  code: number;
  data?: T;
  error?: string;
  message?: string;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: number,
    readonly messageKey: string,
    readonly messageParams: Record<string, unknown>,
    readonly fallback: string,
    message = fallback,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
