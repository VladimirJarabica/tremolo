import { db } from "@/be/db";
import { getTagsSchema, type GetTagsInput } from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function getTags(
  input?: GetTagsInput,
): Promise<ApiResponse<{ id: string; name: string; createdAt: Date; updatedAt: Date }[]>> {
  const parsed = getTagsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const tags = await db
      .selectFrom("Tag")
      .selectAll()
      .orderBy("name", "asc")
      .execute();

    return apiSuccess(tags);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetTagsData = ApiResponseData<typeof getTags>;
