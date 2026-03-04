import { db } from "@/be/db";
import { deleteSheetSchema, type DeleteSheetInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function deleteSheet(
  input: DeleteSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const parsed = deleteSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const sheet = await db
      .updateTable("Sheet")
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where("id", "=", parsed.data.sheetId)
      .where("deletedAt", "is", null)
      .returning(["id"])
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type DeleteSheetData = ApiResponseData<typeof deleteSheet>;
