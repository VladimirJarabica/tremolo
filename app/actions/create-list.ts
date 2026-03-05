"use server";

import { revalidatePath } from "next/cache";
import { createList as createListBE } from "@/be/list/create-list";
import type { CreateListInput } from "@/be/list/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function createList(input: CreateListInput) {
  const result = await handleGuardedApi(() => createListBE(input));
  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
