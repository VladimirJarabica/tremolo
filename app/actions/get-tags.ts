"use server";

import { getTags as getTagsBE } from "@/be/tag/get-tags";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function getTags() {
  return handleGuardedApi(() => getTagsBE());
}
