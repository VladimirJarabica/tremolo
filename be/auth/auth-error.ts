export enum AuthErrorCode {
  AUTH_NOT_AUTHENTICATED = "AUTH_NOT_AUTHENTICATED",
  AUTH_NOT_AUTHORIZED = "AUTH_NOT_AUTHORIZED",
}

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = "AuthError";
  }
}
