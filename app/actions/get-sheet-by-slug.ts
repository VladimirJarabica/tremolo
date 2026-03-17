"use server";

import { handleGuardedApi } from "@/app/utils/handle-guarded-api";
import { getSheetBySlug as getSheetBySlugBE } from "@/be/sheet/get-sheet-by-slug";
import type { GetSheetBySlugInput } from "@/be/sheet/validation-schema";

export async function getSheetBySlug(input: GetSheetBySlugInput) {
  return handleGuardedApi(() => getSheetBySlugBE(input));
}
