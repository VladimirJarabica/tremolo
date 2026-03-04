import { db } from "@/be/db";
import { createTagSchema, type CreateTagInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function createTag(
  input: CreateTagInput,
): Promise<ApiResponse<{ id: string; name: string }>> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const tag = await db
      .insertInto("Tag")
      .values({ name: parsed.data.name })
      .returning(["id", "name"])
      .executeTakeFirst();

    if (!tag) {
      return apiError(ApiErrorCode.FAILED_TO_CREATE);
    }

    return apiSuccess(tag);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_CREATE);
  }
}

export type CreateTagData = ApiResponseData<typeof createTag>;
