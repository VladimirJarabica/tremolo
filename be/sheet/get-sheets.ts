import { db } from "@/be/db";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponseData,
} from "@/be/response";
import { getSheetsSchema, type GetSheetsInput } from "./validation-schema";

export async function getSheets(input?: GetSheetsInput) {
  const parsed = getSheetsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    let query = db
      .selectFrom("Sheet")
      .select([
        "id",
        "slug",
        "title",
        "content",
        "meter",
        "tempo",
        "userId",
        "createdAt",
        "updatedAt",
      ])
      .where("deletedAt", "is", null);

    if (parsed.data.tagId) {
      query = query
        .innerJoin("_SheetToTag", "Sheet.id", "_SheetToTag.A")
        .where("_SheetToTag.B", "=", parsed.data.tagId);
    }

    const sheets = await query.orderBy("createdAt", "desc").execute();

    return apiSuccess(sheets);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetSheetsData = ApiResponseData<typeof getSheets>;
