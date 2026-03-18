"use server";

import { getAllSheets as getAllSheetsBE } from "@/be/sheet/get-all-sheets";

export async function getAllSheets() {
  return getAllSheetsBE();
}
