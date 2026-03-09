"use client";

import "abcjs/abcjs-audio.css";

import { useEffect, useMemo, useRef, useState } from "react";
import abcjs from "abcjs";
import { SheetDetail } from "@/be/sheet/get-sheet";
import { wrapBars, calculateBarsPerLine } from "@/app/utils/abc-wrap";
import { BarsPerLineSlider } from "@/app/components/bars-per-line-slider";

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

function getAbcTune(
  sheet: SheetDetail,
  index: number,
  transpose: number,
  barsPerLine: number,
) {
  const wrappedContent = wrapBars(sheet.content, barsPerLine);
  return `X:${index}
T:${sheet.title}
M:${meterToAbc[sheet.meter]}
Q:1/4=${sheet.tempo}
K:${scaleToAbc[sheet.scale]}
L:1/8
%%score (1)
%%transpose ${transpose}
${wrappedContent}`;
}

export function MultiAbcViewer({
  items,
}: {
  items: Array<{ sheet: SheetDetail; transpose: number }>;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isAutomatic, setIsAutomatic] = useState(true);
  const [manualBarsPerLine, setManualBarsPerLine] = useState(4);

  const containerIds = useMemo(
    () => items.map((_, index) => `abc-tune-${index}`),
    [items],
  );

  const barsPerLine = isAutomatic
    ? calculateBarsPerLine(containerWidth)
    : manualBarsPerLine;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined && width > 0) {
        setContainerWidth(Math.floor(width));
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (items.length === 0 || containerWidth === 0) {
      return;
    }

    items.forEach((item, index) => {
      const element = document.getElementById(containerIds[index]);
      if (element === null) {
        return;
      }

      const tuneString = getAbcTune(item.sheet, 1, item.transpose, barsPerLine);
      abcjs.renderAbc(containerIds[index], tuneString, {
        responsive: "resize",
        visualTranspose: item.transpose,
      });
    });
  }, [containerIds, items, containerWidth, barsPerLine]);

  const handleSliderChange = (automatic: boolean, manualValue: number) => {
    setIsAutomatic(automatic);
    setManualBarsPerLine(manualValue);
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        No sheets to display
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <BarsPerLineSlider value={barsPerLine} onChange={handleSliderChange} />
      </div>

      {/* Sheet music */}
      <div
        ref={containerRef}
        className="abc-container min-h-0 flex-1 overflow-auto rounded-lg bg-white p-4"
      >
        {containerIds.map((id) => (
          <div key={id} id={id} className="mb-6 last:mb-0" />
        ))}
      </div>
    </div>
  );
}
