import { db } from "@/be/db";
import { requireSheetOwnership } from "@/be/auth/guards";
import { updateSheetSchema, type UpdateSheetInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { createSheetSlug } from "./create-sheet-slug";

export async function updateSheet(
  input: UpdateSheetInput,
): Promise<ApiResponse<{ id: string; slug: string }>> {
  const { user } = await requireSheetOwnership(input.sheetId);

  const parsed = updateSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { sheetId, content, title, author, source, meter, tempo, scale, tagIds } = parsed.data;

  try {
    // Get current sheet to check if title changed
    const currentSheet = await db
      .selectFrom("Sheet")
      .select(["title", "slug"])
      .where("id", "=", sheetId)
      .executeTakeFirst();

    if (!currentSheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    // Only regenerate slug if title changed
    const newTitle = title ?? currentSheet.title;
    const newSlug =
      title !== undefined && title !== currentSheet.title
        ? await createSheetSlug(newTitle)
        : currentSheet.slug;

    const sheet = await db
      .updateTable("Sheet")
      .set({
        ...(content !== undefined && { content }),
        ...(title !== undefined && { title: newTitle }),
        ...(author !== undefined && { author }),
        ...(source !== undefined && { source }),
        ...(meter !== undefined && { meter }),
        ...(tempo !== undefined && { tempo }),
        ...(scale !== undefined && { scale }),
        slug: newSlug,
        updatedAt: new Date(),
      })
      .where("id", "=", sheetId)
      .where("userId", "=", user.id)
      .returning(["id", "slug"])
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

    return apiSuccess({ id: sheet.id, slug: sheet.slug });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_UPDATE);
  }
}

export type UpdateSheetData = ApiResponseData<typeof updateSheet>;
