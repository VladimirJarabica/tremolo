import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { updateListSchema, type UpdateListInput } from "./validation-schema";

export async function updateList(
  input: UpdateListInput,
): Promise<ApiResponse<{ id: string; name: string }>> {
  const { user } = await getUserContext();

  const parsed = updateListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const list = await db
      .updateTable("List")
      .set({
        name: parsed.data.name,
        updatedAt: new Date(),
      })
      .where("id", "=", parsed.data.listId)
      .where("userId", "=", user.id)
      .returning(["id", "name"])
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess(list);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_UPDATE);
  }
}

export type UpdateListData = ApiResponseData<typeof updateList>;
