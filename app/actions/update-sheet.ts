"use server";

import { revalidatePath } from "next/cache";
import { updateSheet as updateSheetBE } from "@/be/sheet/update-sheet";
import type { UpdateSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function updateSheet(input: UpdateSheetInput) {
  const result = await handleGuardedApi(() => updateSheetBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
