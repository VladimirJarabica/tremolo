"use server";

import { revalidatePath } from "next/cache";
import { updateListItemTranspose as updateListItemTransposeBE } from "@/be/list/update-list-item-transpose";
import type { UpdateListItemTransposeInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function updateListItemTranspose(
  input: UpdateListItemTransposeInput,
) {
  const result = await handleGuardedApi(() =>
    updateListItemTransposeBE(input),
  );
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
