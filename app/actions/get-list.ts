"use server";

import { getList as getListBE } from "@/be/list/get-list";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getList(listId: string) {
  return handleGuardedApi(() => getListBE({ listId }));
}
