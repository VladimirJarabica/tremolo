"use server";

import { getDeletedSheets as getDeletedSheetsBE } from "@/be/sheet/get-deleted-sheets";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getDeletedSheets() {
  return handleGuardedApi(() => getDeletedSheetsBE());
}
