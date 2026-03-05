"use server";

import { revalidatePath } from "next/cache";
import { deleteList as deleteListBE } from "@/be/list/delete-list";
import type { DeleteListInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function deleteList(input: DeleteListInput) {
  const result = await handleGuardedApi(() => deleteListBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
