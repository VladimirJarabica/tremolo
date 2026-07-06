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
    // Delete items only if the list belongs to the caller (the ListItem delete
    // is scoped by a user-owned List subquery), then delete the list itself.
    // Both run in a transaction so a failure leaves no partial state.
    const list = await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("ListItem")
        .where("listId", "in", (eb) =>
          eb
            .selectFrom("List")
            .select("List.id")
            .where("List.id", "=", parsed.data.listId)
            .where("List.userId", "=", user.id),
        )
        .execute();

      return trx
        .deleteFrom("List")
        .where("id", "=", parsed.data.listId)
        .where("userId", "=", user.id)
        .returning(["id"])
        .executeTakeFirst();
    });

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    return apiSuccess(list);
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_DELETE);
  }
}

export type DeleteListData = ApiResponseData<typeof deleteList>;
