"use server";

import { getListWithSheets as getListWithSheetsBE } from "@/be/list/get-list-with-sheets";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getListWithSheets(listId: string) {
  return handleGuardedApi(() => getListWithSheetsBE({ listId }));
}
