"use server";

import { getSheetBySlug as getSheetBySlugBE } from "@/be/sheet/get-sheet-by-slug";
import type { GetSheetBySlugInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getSheetBySlug(input: GetSheetBySlugInput) {
  return handleGuardedApi(() => getSheetBySlugBE(input));
}
