import { db } from "@/be/db";
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

export async function createSheet(
  input: CreateSheetInput,
): Promise<ApiResponse<{ id: string }>> {
  const parsed = createSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { content, tagIds } = parsed.data;

  try {
    const sheet = await db
      .insertInto("Sheet")
      .values({ content })
      .returning(["id"])
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

    return apiSuccess({ id: sheet.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_CREATE);
  }
}

export type CreateSheetData = ApiResponseData<typeof createSheet>;
