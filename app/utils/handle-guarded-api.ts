import { ApiErrorCode, type ApiResponse } from "@/be/response";

export async function handleGuardedApi<T>(fn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
