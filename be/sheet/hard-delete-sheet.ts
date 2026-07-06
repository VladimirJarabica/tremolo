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
import { allSheetsCacheKey } from "./get-all-sheets";

export async function hardDeleteSheet(
  input: DeleteSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const { user } = await requireSheetOwnership(input.sheetId);

  const parsed = deleteSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // The userId filter guarantees we never touch a sheet the caller does not own.
    const sheet = await db.transaction().execute(async (trx) => {
      return trx
        .deleteFrom("Sheet")
        .where("id", "=", parsed.data.sheetId)
        .where("userId", "=", user.id)
        .returning(["id"])
        .executeTakeFirst();
    });

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    await deleteCacheKey(allSheetsCacheKey(user.id));

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type HardDeleteSheetData = ApiResponseData<typeof hardDeleteSheet>;
