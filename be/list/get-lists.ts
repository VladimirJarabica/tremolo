import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export type ListWithItems = {
  id: string;
  name: string;
  items: {
    sheetId: string;
    sheetSlug: string;
    sheetTitle: string;
    transpose: number;
  }[];
};

export async function getLists(): Promise<ApiResponse<ListWithItems[]>> {
  const { user } = await getUserContext();

  try {
    const lists = await db
      .selectFrom("List")
      .select(["id", "name"])
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
      ])
      .where("ListItem.listId", "in", listIds)
      .where("Sheet.deletedAt", "is", null)
      .orderBy("ListItem.createdAt", "asc")
      .execute();

    const listsWithItems: ListWithItems[] = lists.map((list) => ({
      id: list.id,
      name: list.name,
      items: listItems
        .filter((item) => item.listId === list.id)
        .map((item) => ({
          sheetId: item.sheetId,
          sheetSlug: item.sheetSlug,
          sheetTitle: item.sheetTitle,
          transpose: item.transpose,
        })),
    }));

    return apiSuccess(listsWithItems);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetListsData = ApiResponseData<typeof getLists>;
