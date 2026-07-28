import type { Meter, Scale } from "@/be/db/enums";
import { SheetDetail } from "@/be/sheet/get-sheet";

/**
 * abcjs renders header fields (T:/C:/S:) as DOM textContent, but the ABC body
 * supports directives (%%text, annotations) that it writes into the DOM — and
 * abcjs is not a sanitization boundary. User content is sanitized before it is
 * interpolated into the ABC string:
 *  - `<`/`>` (HTML tag delimiters) have no legitimate use in ABC notation, so
 *    stripping them neutralizes any <script>/<img onerror> payload.
 *  - Control chars (except the \n/\r/\t ABC needs) and DEL are removed.
 * Header fields additionally drop `"`/`'` (quotes never appear in a title or
 * author and could enable attribute breakout). Lengths are capped so a
 * malicious sheet can't flood the DOM.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const sanitizeHeader = (value: string, maxLen: number): string =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>"']/g, "")
    .replace(CONTROL_CHARS, "")
    .slice(0, maxLen);

const sanitizeAbcBody = (value: string, maxLen: number): string =>
  value.replace(/[<>]/g, "").replace(CONTROL_CHARS, "").slice(0, maxLen);

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
  const content = sanitizeAbcBody(sheet.content, 100_000);
  const lines = [
    `X:${options?.index ?? 1}`,
    `T:${sanitizeHeader(sheet.title, 200)}`,
    ...(sheet.author ? [`C:${sanitizeHeader(sheet.author, 200)}`] : []),
    ...(sheet.source && !options?.hideSource
      ? [`S:${sanitizeHeader(sheet.source, 500)}`]
      : []),
    `M:${meterToAbc[sheet.meter as Meter]}`,
    `Q:1/4=${sheet.tempo}`,
    `K:${scaleToAbc[sheet.scale as Scale]}`,
    "L:1/8",
    content,
  ].filter(Boolean) as string[];

  return lines.join("\n");
};
