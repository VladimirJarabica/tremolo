"use client";

import "abcjs/abcjs-audio.css";

import { useEffect, useMemo } from "react";
import abcjs from "abcjs";
import { SheetDetail } from "@/be/sheet/get-sheet";

const meterToAbc: Record<string, string> = {
  m_4_4: "4/4",
  m_3_4: "3/4",
  m_2_4: "2/4",
  m_6_8: "6/8",
  m_3_8: "3/8",
  m_2_2: "2/2",
};

const scaleToAbc: Record<string, string> = {
  C: "C",
  G: "G",
  D: "D",
  A: "A",
  E: "E",
  B: "B",
  Fs: "F#",
  Cs: "C#",
  F: "F",
  Bb: "Bb",
  Eb: "Eb",
  Ab: "Ab",
  Db: "Db",
  Gb: "Gb",
  Cb: "Cb",
  Am: "Am",
  Em: "Em",
  Bm: "Bm",
  Fsm: "F#m",
  Csm: "C#m",
  Gsm: "G#m",
  Dsm: "D#m",
  Asm: "A#m",
  Dm: "Dm",
  Gm: "Gm",
  Cm: "Cm",
  Fm: "Fm",
  Bbm: "Bbm",
  Ebm: "Ebm",
  Abm: "Abm",
};

function getAbcTune(sheet: SheetDetail, index: number, transpose: number) {
  return `X:${index}
T:${sheet.title}
M:${meterToAbc[sheet.meter]}
Q:1/4=${sheet.tempo}
K:${scaleToAbc[sheet.scale]}
L:1/8
%%score (1)
%%transpose ${transpose}
${sheet.content}`;
}

export function MultiAbcViewer({
  items,
}: {
  items: Array<{ sheet: SheetDetail; transpose: number }>;
}): React.JSX.Element {
  const containerIds = useMemo(
    () => items.map((_, index) => `abc-tune-${index}`),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    items.forEach((item, index) => {
      const element = document.getElementById(containerIds[index]);
      if (element === null) {
        return;
      }

      const tuneString = getAbcTune(item.sheet, 1, item.transpose);
      abcjs.renderAbc(containerIds[index], tuneString, {
        responsive: "resize",
        visualTranspose: item.transpose,
      });
    });
  }, [containerIds, items]);

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        No sheets to display
      </div>
    );
  }

  return (
    <div className="abc-container min-h-0 flex-1 overflow-auto rounded-lg bg-white p-4">
      {containerIds.map((id) => (
        <div key={id} id={id} className="mb-6 last:mb-0" />
      ))}
    </div>
  );
}
