import { getUserContext } from "@/be/auth/guards";
import { db } from "@/be/db";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponseData,
} from "@/be/response";
import { getListSchema, type GetListInput } from "./validation-schema";
import { SheetDetail } from "@/be/sheet/get-sheet";

export async function getListWithSheets(input: GetListInput) {
  const parsed = getListSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  const { user } = await getUserContext();

  try {
    const list = await db
      .selectFrom("List")
      .select(["id", "name", "sheetIdsOrder"])
      .where("id", "=", parsed.data.listId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    const listItems = await db
      .selectFrom("ListItem")
      .innerJoin("Sheet", "ListItem.sheetId", "Sheet.id")
      .select([
        "ListItem.sheetId",
        "ListItem.transpose",
        "Sheet.slug as sheetSlug",
        "Sheet.title as sheetTitle",
        "Sheet.meter",
        "Sheet.tempo",
        "Sheet.scale",
        "Sheet.content",
      ])
      .where("ListItem.listId", "=", list.id)
      .where("Sheet.deletedAt", "is", null)
      .execute();

    const sheetIdsOrder = list.sheetIdsOrder ?? [];
    const orderedItems =
      sheetIdsOrder.length > 0
        ? sheetIdsOrder
            .map((sheetId) =>
              listItems.find((item) => item.sheetId === sheetId),
            )
            .filter((item) => item !== undefined)
        : listItems;

    return apiSuccess({
      id: list.id,
      name: list.name,
      items: orderedItems.map((item) => ({
        transpose: item.transpose,
        sheet: {
          id: item.sheetId,
          title: item.sheetTitle,
          content: item.content,
          meter: item.meter,
          tempo: item.tempo,
          scale: item.scale,
        } satisfies SheetDetail,
      })),
    });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetListWithSheetsData = ApiResponseData<typeof getListWithSheets>;
