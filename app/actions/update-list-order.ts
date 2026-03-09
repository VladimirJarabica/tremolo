"use server";

import { revalidatePath } from "next/cache";
import { updateListOrder as updateListOrderBE } from "@/be/list/update-list-order";
import type { UpdateListOrderInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function updateListOrder(input: UpdateListOrderInput) {
  const result = await handleGuardedApi(() => updateListOrderBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
