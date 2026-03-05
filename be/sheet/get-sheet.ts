import { db } from "@/be/db";
import { getSheetSchema, type GetSheetInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function getSheet(input: GetSheetInput): Promise<
  ApiResponse<{
    id: string;
    title: string;
    content: string;
    meter: string;
    tempo: number;
    scale: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    tags: { id: string; name: string }[];
  }>
> {
  const parsed = getSheetSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const sheet = await db
      .selectFrom("Sheet")
      .select([
        "id",
        "title",
        "content",
        "meter",
        "tempo",
        "scale",
        "userId",
        "createdAt",
        "updatedAt",
      ])
      .where("id", "=", parsed.data.sheetId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    const tags = await db
      .selectFrom("_SheetToTag")
      .innerJoin("Tag", "_SheetToTag.B", "Tag.id")
      .select(["Tag.id", "Tag.name"])
      .where("_SheetToTag.A", "=", sheet.id)
      .execute();

    return apiSuccess({ ...sheet, tags });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type SheetDetail = ApiResponseData<typeof getSheet>;
