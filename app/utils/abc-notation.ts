import { SheetDetail } from "@/be/sheet/get-sheet";

export const getAbcNotationFromSheet = (sheet: SheetDetail) =>
  `X:1\
T:${sheet.title}
${sheet.content}`;
