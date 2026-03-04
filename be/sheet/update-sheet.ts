import { db } from "@/be/db";
import { updateSheetSchema, type UpdateSheetInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function updateSheet(
  input: UpdateSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const parsed = updateSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { sheetId, content, title, tagIds } = parsed.data;

  try {
    const sheet = await db
      .updateTable("Sheet")
      .set({
        ...(content !== undefined && { content }),
        ...(title !== undefined && { title }),
        updatedAt: new Date(),
      })
      .where("id", "=", sheetId)
      .returning(["id"])
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    if (tagIds !== undefined) {
      await db.deleteFrom("_SheetToTag").where("A", "=", sheetId).execute();

      if (tagIds.length > 0) {
        await db
          .insertInto("_SheetToTag")
          .values(tagIds.map((tagId) => ({ A: sheetId, B: tagId })))
          .execute();
      }
    }

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_UPDATE);
  }
}

export type UpdateSheetData = ApiResponseData<typeof updateSheet>;
