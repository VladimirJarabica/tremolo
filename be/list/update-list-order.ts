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
  updateListOrderSchema,
  type UpdateListOrderInput,
} from "./validation-schema";

export async function updateListOrder(input: UpdateListOrderInput) {
  const { user } = await getUserContext();

  const parsed = updateListOrderSchema.safeParse(input);
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

    // Update order
    const updated = await db
      .updateTable("List")
      .set({ sheetIdsOrder: parsed.data.sheetIdsOrder })
      .where("id", "=", parsed.data.listId)
      .returning(["id", "sheetIdsOrder"])
      .executeTakeFirst();

    if (!updated) {
      return apiError(ApiErrorCode.INTERNAL_ERROR);
    }

    return apiSuccess({
      listId: updated.id,
      sheetIdsOrder: updated.sheetIdsOrder,
    });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type UpdateListOrderData = ApiResponseData<typeof updateListOrder>;
