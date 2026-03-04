"use server";

import { revalidatePath } from "next/cache";
import { createSheet as createSheetBE } from "@/be/sheet/create-sheet";
import type { CreateSheetInput } from "@/be/sheet/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function createSheet(input: CreateSheetInput) {
  const result = await handleGuardedApi(() => createSheetBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
