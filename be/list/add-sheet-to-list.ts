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
  addSheetToListSchema,
  type AddSheetToListInput,
} from "./validation-schema";

export async function addSheetToList(
  input: AddSheetToListInput,
): Promise<ApiResponse<{ listId: string; sheetId: string; transpose: number }>> {
  const { user } = await getUserContext();

  const parsed = addSheetToListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // Verify list ownership
    const list = await db
      .selectFrom("List")
      .select(["id"])
      .where("id", "=", parsed.data.listId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    // Verify sheet exists and user owns it
    const sheet = await db
      .selectFrom("Sheet")
      .select(["id"])
      .where("id", "=", parsed.data.sheetId)
      .where("userId", "=", user.id)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (!sheet) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    // Insert or update on conflict
    const listItem = await db
      .insertInto("ListItem")
      .values({
        listId: parsed.data.listId,
        sheetId: parsed.data.sheetId,
        transpose: parsed.data.transpose,
      })
      .onConflict((oc) =>
        oc.columns(["listId", "sheetId"]).doUpdateSet({
          transpose: parsed.data.transpose,
        }),
      )
      .returning(["listId", "sheetId", "transpose"])
      .executeTakeFirst();

    if (!listItem) {
      return apiError(ApiErrorCode.FAILED_TO_CREATE);
    }

    return apiSuccess(listItem);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_CREATE);
  }
}

export type AddSheetToListData = ApiResponseData<typeof addSheetToList>;
