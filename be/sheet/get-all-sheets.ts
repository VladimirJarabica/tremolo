import { db } from "@/be/db";
import { cached } from "@/be/db/cache";
import { TIMES_IN_SECONDS } from "@/lib/constants";

export type SheetItem = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  meter: string;
  tempo: number;
  scale: string;
  tags: { id: string; name: string }[];
  createdAt: Date;
};

export const ALL_SHEETS_CACHE_KEY = "getAllSheets";

async function fetchAllSheets(): Promise<SheetItem[]> {
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
    .orderBy("createdAt", "desc")
    .execute();

  if (sheets.length === 0) {
    return [];
  }

  const sheetIds = sheets.map((s) => s.id);
  const tagRelations = await db
    .selectFrom("_SheetToTag")
    .innerJoin("Tag", "_SheetToTag.B", "Tag.id")
    .select(["_SheetToTag.A as sheetId", "Tag.id", "Tag.name"])
    .where("_SheetToTag.A", "in", sheetIds)
    .execute();

  const tagsBySheetId = new Map<string, { id: string; name: string }[]>();
  for (const rel of tagRelations) {
    const existing = tagsBySheetId.get(rel.sheetId) ?? [];
    existing.push({ id: rel.id, name: rel.name });
    tagsBySheetId.set(rel.sheetId, existing);
  }

  return sheets.map((sheet) => ({
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
}

export async function getAllSheets(): Promise<SheetItem[]> {
  return cached(fetchAllSheets, ALL_SHEETS_CACHE_KEY, TIMES_IN_SECONDS.HOUR);
}
