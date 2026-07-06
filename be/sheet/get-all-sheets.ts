import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import { cached } from "@/be/db/cache";
import { TIMES_IN_SECONDS } from "@/lib/constants";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export type SheetItem = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  meter: string;
  tempo: number;
  scale: string;
  createdAt: Date;
};

// Cache key is user-scoped: each user's listing is cached independently so one
// user's sheets can never be served to another.
export const allSheetsCacheKey = (userId: string) => `getAllSheets:${userId}`;

async function fetchAllSheets(userId: string): Promise<SheetItem[]> {
  const sheets = await db
    .selectFrom("Sheet")
    .select([
      "id",
      "slug",
      "title",
      "author",
      "meter",
      "tempo",
      "scale",
      "createdAt",
    ])
    .where("deletedAt", "is", null)
    .where("userId", "=", userId)
    .orderBy("createdAt", "desc")
    .execute();

  if (sheets.length === 0) {
    return [];
  }

  return sheets.map((sheet) => ({
    id: sheet.id,
    slug: sheet.slug,
    title: sheet.title,
    author: sheet.author,
    meter: sheet.meter,
    tempo: sheet.tempo,
    scale: sheet.scale,
    createdAt: sheet.createdAt,
  }));
}

export async function getAllSheets(): Promise<ApiResponse<SheetItem[]>> {
  try {
    const { user } = await getUserContext();
    const sheets = await cached(
      () => fetchAllSheets(user.id),
      allSheetsCacheKey(user.id),
      TIMES_IN_SECONDS.HOUR,
    );
    return apiSuccess(sheets);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetAllSheetsData = ApiResponseData<typeof getAllSheets>;
