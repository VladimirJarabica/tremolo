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
import { deleteCacheKey } from "@/be/db/cache";
import { allSheetsCacheKey } from "./get-all-sheets";
import { sheetBySlugCacheKey } from "./get-sheet-by-slug";

export async function updateSheet(
  input: UpdateSheetInput,
): Promise<ApiResponse<{ id: string; slug: string }>> {
  const { user } = await requireSheetOwnership(input.sheetId);

  const parsed = updateSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const {
    sheetId,
    content,
    title,
    author,
    source,
    meter,
    tempo,
    scale,
  } = parsed.data;

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

    const cacheKeys = [
      sheetBySlugCacheKey(user.id, currentSheet.slug),
      allSheetsCacheKey(user.id),
    ];

    // Also delete new slug cache in case a 404 was cached there previously
    if (newSlug !== currentSheet.slug) {
      cacheKeys.push(sheetBySlugCacheKey(user.id, newSlug));
    }

    await deleteCacheKey(cacheKeys);

    return apiSuccess({ id: sheet.id, slug: sheet.slug });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_UPDATE);
  }
}

export type UpdateSheetData = ApiResponseData<typeof updateSheet>;
