import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import {
  removeSheetFromListSchema,
  type RemoveSheetFromListInput,
} from "./validation-schema";

export async function removeSheetFromList(
  input: RemoveSheetFromListInput,
): Promise<ApiResponse<{ listId: string; sheetId: string }>> {
  const { user } = await getUserContext();

  const parsed = removeSheetFromListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // Get list for sheetIdsOrder
    const list = await db
      .selectFrom("List")
      .select(["id", "sheetIdsOrder", "userId"])
      .where("id", "=", parsed.data.listId)
      .executeTakeFirst();

    if (!list || list.userId !== user.id) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    // Delete the list item
    const listItem = await db
      .deleteFrom("ListItem")
      .where("listId", "=", parsed.data.listId)
      .where("sheetId", "=", parsed.data.sheetId)
      .returning(["listId", "sheetId"])
      .executeTakeFirst();

    if (!listItem) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    // Remove from sheetIdsOrder
    const newOrder = list.sheetIdsOrder.filter(
      (id) => id !== parsed.data.sheetId,
    );
    await db
      .updateTable("List")
      .set({ sheetIdsOrder: newOrder })
      .where("id", "=", parsed.data.listId)
      .execute();

    return apiSuccess(listItem);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type RemoveSheetFromListData = ApiResponseData<
  typeof removeSheetFromList
>;
