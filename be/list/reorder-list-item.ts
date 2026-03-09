import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponseData,
} from "@/be/response";
import {
  reorderListItemSchema,
  type ReorderListItemInput,
} from "./validation-schema";

export async function reorderListItem(input: ReorderListItemInput) {
  const { user } = await getUserContext();

  const parsed = reorderListItemSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    // Get list and verify ownership
    const list = await db
      .selectFrom("List")
      .select(["id", "sheetIdsOrder"])
      .where("id", "=", parsed.data.listId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    const sheetIdsOrder = list.sheetIdsOrder;
    const currentIndex = sheetIdsOrder.indexOf(parsed.data.sheetId);

    if (currentIndex === -1) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    const newIndex =
      parsed.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Boundary check
    if (newIndex < 0 || newIndex >= sheetIdsOrder.length) {
      return apiSuccess({ listId: list.id, sheetIdsOrder });
    }

    // Swap positions
    const newOrder = [...sheetIdsOrder];
    [newOrder[currentIndex], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[currentIndex],
    ];

    // Update list
    const updated = await db
      .updateTable("List")
      .set({ sheetIdsOrder: newOrder })
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

export type ReorderListItemData = ApiResponseData<typeof reorderListItem>;
