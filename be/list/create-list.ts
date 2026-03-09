import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { createListSchema, type CreateListInput } from "./validation-schema";

export async function createList(
  input: CreateListInput,
): Promise<ApiResponse<{ id: string; name: string }>> {
  const { user } = await getUserContext();

  const parsed = createListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const list = await db
      .insertInto("List")
      .values({
        name: parsed.data.name,
        userId: user.id,
        sheetIdsOrder: [],
      })
      .returning(["id", "name"])
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.FAILED_TO_CREATE);
    }

    return apiSuccess(list);
  } catch (err) {
    console.log("Error creating list", err);
    return apiError(ApiErrorCode.FAILED_TO_CREATE);
  }
}

export type CreateListData = ApiResponseData<typeof createList>;
