import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { deleteListSchema, type DeleteListInput } from "./validation-schema";

export async function deleteList(
  input: DeleteListInput,
): Promise<ApiResponse<{ id: string }>> {
  const { user } = await getUserContext();

  const parsed = deleteListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // Delete list items first
    await db
      .deleteFrom("ListItem")
      .where("listId", "=", parsed.data.listId)
      .execute();

    // Delete list
    const list = await db
      .deleteFrom("List")
      .where("id", "=", parsed.data.listId)
      .where("userId", "=", user.id)
      .returning(["id"])
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess(list);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type DeleteListData = ApiResponseData<typeof deleteList>;
