"use server";

import { getSheets as getSheetsBE } from "@/be/sheet/get-sheets";
import type { GetSheetsInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getSheets(input?: GetSheetsInput) {
  return handleGuardedApi(() => getSheetsBE(input));
}
