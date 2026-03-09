import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponseData,
} from "@/be/response";

export async function getLists() {
  const { user } = await getUserContext();

  try {
    const lists = await db
      .selectFrom("List")
      .select(["id", "name", "sheetIdsOrder"])
      .where("userId", "=", user.id)
      .orderBy("createdAt", "desc")
      .execute();

    if (lists.length === 0) {
      return apiSuccess([]);
    }

    const listIds = lists.map((l) => l.id);

    const listItems = await db
      .selectFrom("ListItem")
      .innerJoin("Sheet", "ListItem.sheetId", "Sheet.id")
      .select([
        "ListItem.listId",
        "ListItem.sheetId",
        "ListItem.transpose",
        "Sheet.slug as sheetSlug",
        "Sheet.title as sheetTitle",
        "Sheet.meter",
        "Sheet.tempo",
        "Sheet.scale",
      ])
      .where("ListItem.listId", "in", listIds)
      .where("Sheet.deletedAt", "is", null)
      .execute();

    const listsWithItems = lists.map((list) => {
      const listItemsFiltered = listItems.filter(
        (item) => item.listId === list.id,
      );

      // If sheetIdsOrder exists and has items, use it for ordering
      // Otherwise fall back to all items (migrated lists without order)
      const sheetIdsOrder = list.sheetIdsOrder ?? [];
      const orderedItems =
        sheetIdsOrder.length > 0
          ? sheetIdsOrder
              .map((sheetId) =>
                listItemsFiltered.find((item) => item.sheetId === sheetId),
              )
              .filter((item) => item !== undefined)
          : listItemsFiltered;

      return {
        id: list.id,
        name: list.name,
        items: orderedItems,
      };
    });

    return apiSuccess(listsWithItems);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetListsData = ApiResponseData<typeof getLists>;
export type ListWithItems = GetListsData[number];
