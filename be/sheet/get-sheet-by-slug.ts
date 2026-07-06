import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  getSheetBySlugSchema,
  type GetSheetBySlugInput,
} from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { cached } from "../db/cache";

// Cache key is user-scoped so a sheet cached for one owner is never handed to
// another user querying the same slug.
export const sheetBySlugCacheKey = (userId: string, slug: string) =>
  `getSheetBySlug:${userId}:${slug}`;

export async function getSheetBySlug(input: GetSheetBySlugInput): Promise<
  ApiResponse<{
    id: string;
    slug: string;
    title: string;
    author: string | null;
    source: string | null;
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
  const { user } = await getUserContext();

  const parsed = getSheetBySlugSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  return await cached(async () => {
    try {
      const sheet = await db
        .selectFrom("Sheet")
        .select([
          "id",
          "slug",
          "title",
          "author",
          "source",
          "content",
          "meter",
          "tempo",
          "scale",
          "userId",
          "createdAt",
          "updatedAt",
        ])
        .where("slug", "=", parsed.data.slug)
        .where("userId", "=", user.id)
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
  }, sheetBySlugCacheKey(user.id, parsed.data.slug));
}

export type SheetBySlug = ApiResponseData<typeof getSheetBySlug>;
