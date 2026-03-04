"use server";

import { getSheet as getSheetBE } from "@/be/sheet/get-sheet";
import type { GetSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getSheet(input: GetSheetInput) {
  return handleGuardedApi(() => getSheetBE(input));
}
