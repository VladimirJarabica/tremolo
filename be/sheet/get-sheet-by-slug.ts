import { db } from "@/be/db";
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
  }, `getSheetBySlug:${input.slug}`);
}

export type SheetBySlug = ApiResponseData<typeof getSheetBySlug>;
