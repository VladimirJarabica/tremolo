import { db } from "@/be/db";
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
  try {
    const sheets = await db
      .selectFrom("Sheet")
      .selectAll()
      .where("deletedAt", "is not", null)
      .orderBy("deletedAt", "desc")
      .execute();

    return apiSuccess(sheets);
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetDeletedSheetsData = ApiResponseData<typeof getDeletedSheets>;
