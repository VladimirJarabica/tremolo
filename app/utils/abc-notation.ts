import type { Meter } from "@/be/db/enums";
import { SheetDetail } from "@/be/sheet/get-sheet";

const meterToAbc: Record<Meter, string> = {
  m_4_4: "4/4",
  m_3_4: "3/4",
  m_2_4: "2/4",
  m_6_8: "6/8",
  m_3_8: "3/8",
  m_2_2: "2/2",
};

export const getAbcNotationFromSheet = (sheet: SheetDetail) =>
  `X:1
T:${sheet.title}
M:${meterToAbc[sheet.meter as Meter]}
Q:1/4=${sheet.tempo}
${sheet.content}`;
