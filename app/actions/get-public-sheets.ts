"use server";

import { getPublicSheets as getPublicSheetsBE } from "@/be/sheet/get-public-sheets";
import type { GetPublicSheetsInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getPublicSheets(input?: GetPublicSheetsInput) {
  return handleGuardedApi(() => getPublicSheetsBE(input));
}
