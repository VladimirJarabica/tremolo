import { db } from "@/be/db";
import { deleteSheetSchema, type DeleteSheetInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { deleteCacheKey } from "@/be/db/cache";
import { ALL_SHEETS_CACHE_KEY } from "./get-all-sheets";

export async function hardDeleteSheet(
  input: DeleteSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const parsed = deleteSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // First delete tag relations
    await db
      .deleteFrom("_SheetToTag")
      .where("A", "=", parsed.data.sheetId)
      .execute();

    const sheet = await db
      .deleteFrom("Sheet")
      .where("id", "=", parsed.data.sheetId)
      .returning(["id"])
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    await deleteCacheKey(ALL_SHEETS_CACHE_KEY);

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type HardDeleteSheetData = ApiResponseData<typeof hardDeleteSheet>;
