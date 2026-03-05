"use server";

import { revalidatePath } from "next/cache";
import { addSheetToList as addSheetToListBE } from "@/be/list/add-sheet-to-list";
import type { AddSheetToListInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function addSheetToList(input: AddSheetToListInput) {
  const result = await handleGuardedApi(() => addSheetToListBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
