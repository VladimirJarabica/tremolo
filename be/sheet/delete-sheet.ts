import { db } from "@/be/db";
import { requireSheetOwnership } from "@/be/auth/guards";
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

export async function deleteSheet(
  input: DeleteSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const { user } = await requireSheetOwnership(input.sheetId);

  const parsed = deleteSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const now = new Date();
    const deletedSlug = `deleted-${now.getTime()}`;

    const sheet = await db
      .updateTable("Sheet")
      .set({ deletedAt: now, updatedAt: now, slug: deletedSlug })
      .where("id", "=", parsed.data.sheetId)
      .where("userId", "=", user.id)
      .where("deletedAt", "is", null)
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

export type DeleteSheetData = ApiResponseData<typeof deleteSheet>;
