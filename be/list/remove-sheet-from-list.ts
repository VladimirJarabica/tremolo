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
    // Verify list ownership and delete item
    const listItem = await db
      .deleteFrom("ListItem")
      .using("List")
      .where("ListItem.listId", "=", parsed.data.listId)
      .where("ListItem.sheetId", "=", parsed.data.sheetId)
      .where("List.userId", "=", user.id)
      .returning(["ListItem.listId", "ListItem.sheetId"])
      .executeTakeFirst();

    if (!listItem) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess(listItem);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type RemoveSheetFromListData = ApiResponseData<
  typeof removeSheetFromList
>;
