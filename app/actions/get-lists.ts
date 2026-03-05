"use server";

import { getLists as getListsBE } from "@/be/list/get-lists";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getLists() {
  return handleGuardedApi(() => getListsBE());
}
