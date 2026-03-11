import { db } from "@/be/db";
import {
  paginatedApiSuccess,
  apiError,
  ApiErrorCode,
  type ApiResponseData,
} from "@/be/response";
import {
  getPublicSheetsSchema,
  tempoRanges,
  type GetPublicSheetsInput,
} from "./validation-schema";
import type { Meter, Scale } from "@/be/db/enums";

const ITEMS_PER_PAGE = 10;

export type PublicSheetItem = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  meter: Meter;
  tempo: number;
  scale: Scale;
  tags: { id: string; name: string }[];
  createdAt: Date;
};

export async function getPublicSheets(input?: GetPublicSheetsInput) {
  const parsed = getPublicSheetsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { page, orderBy, order, meter, tempoRange, scale, search } =
    parsed.data;

  try {
    // Build the base query for counting
    let countQuery = db
      .selectFrom("Sheet")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .where("deletedAt", "is", null);

    // Build the base query for data
    let dataQuery = db
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
      .where("deletedAt", "is", null);

    // Apply filters to both queries
    if (meter) {
      countQuery = countQuery.where("meter", "=", meter);
      dataQuery = dataQuery.where("meter", "=", meter);
    }

    if (tempoRange) {
      const range = tempoRanges[tempoRange];
      countQuery = countQuery
        .where("tempo", ">=", range.min)
        .where("tempo", "<=", range.max);
      dataQuery = dataQuery
        .where("tempo", ">=", range.min)
        .where("tempo", "<=", range.max);
    }

    if (scale) {
      countQuery = countQuery.where("scale", "=", scale);
      dataQuery = dataQuery.where("scale", "=", scale);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("title", "ilike", searchPattern),
          eb("author", "ilike", searchPattern),
        ]),
      );
      dataQuery = dataQuery.where((eb) =>
        eb.or([
          eb("title", "ilike", searchPattern),
          eb("author", "ilike", searchPattern),
        ]),
      );
    }

    // Get total count
    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    // Get paginated data
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const sheets = await dataQuery
      .orderBy(orderBy, order)
      .limit(ITEMS_PER_PAGE)
      .offset(offset)
      .execute();

    // Fetch tags for each sheet
    const sheetIds = sheets.map((s) => s.id);
    const tagRelations =
      sheetIds.length > 0
        ? await db
            .selectFrom("_SheetToTag")
            .innerJoin("Tag", "_SheetToTag.B", "Tag.id")
            .select(["_SheetToTag.A as sheetId", "Tag.id", "Tag.name"])
            .where("_SheetToTag.A", "in", sheetIds)
            .execute()
        : [];

    // Group tags by sheet id
    const tagsBySheetId = new Map<string, { id: string; name: string }[]>();
    for (const rel of tagRelations) {
      const existing = tagsBySheetId.get(rel.sheetId) ?? [];
      existing.push({ id: rel.id, name: rel.name });
      tagsBySheetId.set(rel.sheetId, existing);
    }

    // Build final result
    const items: PublicSheetItem[] = sheets.map((sheet) => ({
      id: sheet.id,
      slug: sheet.slug,
      title: sheet.title,
      author: sheet.author,
      meter: sheet.meter,
      tempo: sheet.tempo,
      scale: sheet.scale,
      tags: tagsBySheetId.get(sheet.id) ?? [],
      createdAt: sheet.createdAt,
    }));

    return paginatedApiSuccess(items, total);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetPublicSheetsData = ApiResponseData<typeof getPublicSheets>;
