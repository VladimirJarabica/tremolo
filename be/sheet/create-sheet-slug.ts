import { db } from "@/be/db";

export async function createSheetSlug(title: string): Promise<string> {
  const baseSlug =
    title
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "untitled";

  // Find all slugs that start with this base
  const existingSlugs = await db
    .selectFrom("Sheet")
    .where("slug", "like", `${baseSlug}%`)
    .select(["slug"])
    .execute();

  const slugSet = new Set(existingSlugs.map((s) => s.slug));

  if (!slugSet.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (slugSet.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}
