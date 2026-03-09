"use server";

import { revalidatePath } from "next/cache";
import { reorderListItem as reorderListItemBE } from "@/be/list/reorder-list-item";
import type { ReorderListItemInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function reorderListItem(input: ReorderListItemInput) {
  const result = await handleGuardedApi(() => reorderListItemBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
