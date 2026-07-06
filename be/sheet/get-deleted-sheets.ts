import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";

export async function getDeletedSheets(): Promise<
  ApiResponse<{ id: string; content: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null }[]>
> {
  const { user } = await getUserContext();

  try {
    const sheets = await db
      .selectFrom("Sheet")
      .selectAll()
      .where("deletedAt", "is not", null)
      .where("userId", "=", user.id)
      .orderBy("deletedAt", "desc")
      .execute();

    return apiSuccess(sheets);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetDeletedSheetsData = ApiResponseData<typeof getDeletedSheets>;
