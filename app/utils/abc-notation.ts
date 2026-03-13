import type { Meter, Scale } from "@/be/db/enums";
import { SheetDetail } from "@/be/sheet/get-sheet";

const meterToAbc: Record<Meter, string> = {
  m_4_4: "4/4",
  m_3_4: "3/4",
  m_2_4: "2/4",
  m_6_8: "6/8",
  m_3_8: "3/8",
  m_2_2: "2/2",
};

const scaleToAbc: Record<Scale, string> = {
  // Major - sharps
  C: "C",
  G: "G",
  D: "D",
  A: "A",
  E: "E",
  B: "B",
  Fs: "F#",
  Cs: "C#",
  // Major - flats
  F: "F",
  Bb: "Bb",
  Eb: "Eb",
  Ab: "Ab",
  Db: "Db",
  Gb: "Gb",
  Cb: "Cb",
  // Minor - sharps
  Am: "Am",
  Em: "Em",
  Bm: "Bm",
  Fsm: "F#m",
  Csm: "C#m",
  Gsm: "G#m",
  Dsm: "D#m",
  Asm: "A#m",
  // Minor - flats
  Dm: "Dm",
  Gm: "Gm",
  Cm: "Cm",
  Fm: "Fm",
  Bbm: "Bbm",
  Ebm: "Ebm",
  Abm: "Abm",
};

export const getAbcNotationFromSheet = (
  sheet: SheetDetail,
  options?: { index?: number; hideSource?: boolean },
) => {
  const lines = [
    `X:${options?.index ?? 1}`,
    `T:${sheet.title}`,
    ...(sheet.author ? [`C:${sheet.author}`] : []),
    ...(sheet.source && !options?.hideSource ? [`S:${sheet.source}`] : []),
    `M:${meterToAbc[sheet.meter as Meter]}`,
    `Q:1/4=${sheet.tempo}`,
    `K:${scaleToAbc[sheet.scale as Scale]}`,
    "L:1/8",
    sheet.content.includes("clef=bass") ? "V:1 clef=treble" : null,
    sheet.content,
  ].filter(Boolean) as string[];
  return lines.join("\n");
};
