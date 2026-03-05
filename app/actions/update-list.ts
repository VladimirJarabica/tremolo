"use server";

import { revalidatePath } from "next/cache";
import { updateList as updateListBE } from "@/be/list/update-list";
import type { UpdateListInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function updateList(input: UpdateListInput) {
  const result = await handleGuardedApi(() => updateListBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
