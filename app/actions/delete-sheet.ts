"use server";

import { revalidatePath } from "next/cache";
import { deleteSheet as deleteSheetBE } from "@/be/sheet/delete-sheet";
import type { DeleteSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function deleteSheet(input: DeleteSheetInput) {
  const result = await handleGuardedApi(() => deleteSheetBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
