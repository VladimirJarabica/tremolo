export enum ApiErrorCode {
  INVALID_INPUT = "INVALID_INPUT",
  NOT_FOUND = "NOT_FOUND",
  FAILED_TO_CREATE = "FAILED_TO_CREATE",
  FAILED_TO_UPDATE = "FAILED_TO_UPDATE",
  FAILED_TO_DELETE = "FAILED_TO_DELETE",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: ApiErrorCode;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ApiResponseData<T extends (...args: never) => Promise<ApiResponse<unknown>>> =
  ReturnType<T> extends Promise<ApiResponse<infer D>> ? D : never;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function apiError(code: ApiErrorCode, details?: unknown): ApiError {
  return { success: false, error: { code, details } };
}

export function paginatedApiSuccess<T>(data: T[], total: number): ApiSuccess<{ items: T[]; total: number }> {
  return { success: true, data: { items: data, total } };
}
