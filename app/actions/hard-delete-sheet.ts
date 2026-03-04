"use server";

import { revalidatePath } from "next/cache";
import { hardDeleteSheet as hardDeleteSheetBE } from "@/be/sheet/hard-delete-sheet";
import type { DeleteSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function hardDeleteSheet(input: DeleteSheetInput) {
  const result = await handleGuardedApi(() => hardDeleteSheetBE(input));
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/trash");
  }
  return result;
}
