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

export async function restoreSheet(
  input: DeleteSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const { user } = await requireSheetOwnership(input.sheetId);

  const parsed = deleteSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const sheet = await db
      .updateTable("Sheet")
      .set({ deletedAt: null, updatedAt: new Date() })
      .where("id", "=", parsed.data.sheetId)
      .where("userId", "=", user.id)
      .where("deletedAt", "is not", null)
      .returning(["id"])
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type RestoreSheetData = ApiResponseData<typeof restoreSheet>;
