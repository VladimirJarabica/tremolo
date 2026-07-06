"use server";

import { getAllSheets as getAllSheetsBE } from "@/be/sheet/get-all-sheets";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getAllSheets() {
  return handleGuardedApi(() => getAllSheetsBE());
}
