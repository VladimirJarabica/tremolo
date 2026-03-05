"use server";

import { revalidatePath } from "next/cache";
import { removeSheetFromList as removeSheetFromListBE } from "@/be/list/remove-sheet-from-list";
import type { RemoveSheetFromListInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function removeSheetFromList(input: RemoveSheetFromListInput) {
  const result = await handleGuardedApi(() => removeSheetFromListBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
