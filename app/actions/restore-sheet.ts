"use server";

import { revalidatePath } from "next/cache";
import { restoreSheet as restoreSheetBE } from "@/be/sheet/restore-sheet";
import type { DeleteSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function restoreSheet(input: DeleteSheetInput) {
  const result = await handleGuardedApi(() => restoreSheetBE(input));
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/trash");
  }
  return result;
}
