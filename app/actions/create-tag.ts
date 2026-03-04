"use server";

import { createTag as createTagBE } from "@/be/tag/create-tag";
import type { CreateTagInput } from "@/be/tag/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function createTag(input: CreateTagInput) {
  return handleGuardedApi(() => createTagBE(input));
}
