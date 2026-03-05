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
  updateListItemTransposeSchema,
  type UpdateListItemTransposeInput,
} from "./validation-schema";

export async function updateListItemTranspose(
  input: UpdateListItemTransposeInput,
): Promise<
  ApiResponse<{ listId: string; sheetId: string; transpose: number }>
> {
  const { user } = await getUserContext();

  const parsed = updateListItemTransposeSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const listItem = await db
      .updateTable("ListItem")
      .set({
        transpose: parsed.data.transpose,
        updatedAt: new Date(),
      })
      .from("List")
      .whereRef("ListItem.listId", "=", "List.id")
      .where("ListItem.listId", "=", parsed.data.listId)
      .where("ListItem.sheetId", "=", parsed.data.sheetId)
      .where("List.userId", "=", user.id)
      .returning(["ListItem.listId", "ListItem.sheetId", "ListItem.transpose"])
      .executeTakeFirst();

    if (!listItem) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess({
      listId: listItem.listId,
      sheetId: listItem.sheetId,
      transpose: listItem.transpose,
    });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_UPDATE);
  }
}

export type UpdateListItemTransposeData = ApiResponseData<
  typeof updateListItemTranspose
>;
