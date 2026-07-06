import { ApiErrorCode, type ApiResponse } from "@/be/response";
import { AuthError, AuthErrorCode } from "@/be/auth/auth-error";

export async function handleGuardedApi<T>(
  fn: () => Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    // Let auth failures surface as a distinct code so the client can pick the
    // right UX (redirect to login vs. show "not allowed" vs. generic error).
    if (error instanceof AuthError) {
      const code =
        error.code === AuthErrorCode.AUTH_NOT_AUTHENTICATED
          ? ApiErrorCode.UNAUTHENTICATED
          : ApiErrorCode.UNAUTHORIZED;
      return { success: false, error: { code } };
    }

    // Log the real error server-side; do not forward internal details (e.g.
    // Postgres/Kysely messages, connection-string fragments) to the client.
    console.error("handleGuardedApi internal error:", error);
    return { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR } };
  }
}
