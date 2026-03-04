import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  createSheetSchema,
  type CreateSheetInput,
} from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { createSheetSlug } from "./create-sheet-slug";

export async function createSheet(
  input: CreateSheetInput,
): Promise<ApiResponse<{ id: string; slug: string }>> {
  const { user } = await getUserContext();

  const parsed = createSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { content, title, tagIds } = parsed.data;
  const sheetTitle = title ?? "Untitled";

  try {
    const slug = await createSheetSlug(sheetTitle);

    const sheet = await db
      .insertInto("Sheet")
      .values({ content, title: sheetTitle, slug, userId: user.id })
      .returning(["id", "slug"])
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.FAILED_TO_CREATE);
    }

    if (tagIds && tagIds.length > 0) {
      await db
        .insertInto("_SheetToTag")
        .values(tagIds.map((tagId) => ({ A: sheet.id, B: tagId })))
        .execute();
    }

    return apiSuccess({ id: sheet.id, slug: sheet.slug });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_CREATE);
  }
}

export type CreateSheetData = ApiResponseData<typeof createSheet>;
