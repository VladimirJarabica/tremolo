"use client";

import { useEffect, useRef, useState } from "react";
import abcjs from "abcjs";
import { Check } from "lucide-react";
import { useDebouncer } from "@tanstack/react-pacer";
import { SheetDetail } from "@/be/sheet/get-sheet";
import { getAbcNotationFromSheet } from "../utils/abc-notation";
import { updateListItemTranspose } from "@/app/actions/update-list-item-transpose";
import { wrapBars, calculateBarsPerLine } from "@/app/utils/abc-wrap";
import { BarsPerLineSlider } from "@/app/components/bars-per-line-slider";

export function AbcViewer({
  sheet,
  listId,
  initialTranspose = 0,
}: {
  sheet: SheetDetail;
  listId?: string | null;
  initialTranspose?: number;
}): React.JSX.Element {
  const notationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const [transpose, setTranspose] = useState(initialTranspose);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isAutomatic, setIsAutomatic] = useState(true);
  const [manualBarsPerLine, setManualBarsPerLine] = useState(4);

  const abcContent = getAbcNotationFromSheet(sheet, { hideSource: true });

  const isSourceLink =
    sheet.source !== null &&
    (sheet.source.startsWith("http://") || sheet.source.startsWith("https://"));

  const barsPerLine = isAutomatic
    ? calculateBarsPerLine(containerWidth)
    : manualBarsPerLine;

  // Clear error when content changes
  useEffect(() => {
    setError(null);
  }, [abcContent]);

  // Track container width for responsive bars per line
  useEffect(() => {
    if (!notationRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined && width > 0) {
        setContainerWidth(Math.floor(width));
      }
    });

    observer.observe(notationRef.current);

    return () => observer.disconnect();
  }, []);

  const debouncedSave = useDebouncer(
    async (value: number) => {
      if (listId) {
        const result = await updateListItemTranspose({
          listId,
          sheetId: sheet.id,
          transpose: value,
        });

        if (result.success) {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 1500);
        }
      }
    },
    { wait: 1000 },
  );

  useEffect(() => {
    setTranspose(initialTranspose);
  }, [initialTranspose]);

  function handleTransposeChange(delta: number): void {
    const newTranspose = transpose + delta;
    setTranspose(newTranspose);
    debouncedSave.maybeExecute(newTranspose);
  }

  function handleBarsPerLineChange(
    automatic: boolean,
    manualValue: number,
  ): void {
    setIsAutomatic(automatic);
    setManualBarsPerLine(manualValue);
  }

  useEffect(() => {
    if (
      !notationRef.current ||
      !audioRef.current ||
      !sheet.content.trim() ||
      containerWidth === 0
    ) {
      return;
    }

    let synthControl: InstanceType<typeof abcjs.synth.SynthController> | null =
      null;

    async function init(): Promise<void> {
      try {
        setError(null);
        // Clear previous content
        notationRef.current!.innerHTML = "";
        audioRef.current!.innerHTML = "";

        // Wrap content with newlines based on bars per line
        const wrappedContent = wrapBars(abcContent, barsPerLine);

        // Render ABC notation with transpose
        const visualObj = abcjs.renderAbc(
          notationRef.current!,
          wrappedContent,
          {
            responsive: "resize",
            visualTranspose: transpose,
          },
        );

        // Setup audio controls
        synthControl = new abcjs.synth.SynthController();
        synthControl.load(audioRef.current!, null, {
          displayLoop: false,
          displayRestart: false,
          displayPlay: true,
          displayProgress: true,
          displayWarp: false,
        });

        // Create synth with the transposed visual object
        const createSynth = new abcjs.synth.CreateSynth();
        await createSynth.init({
          visualObj: visualObj[0],
        });

        const containsBassCleff = abcContent.includes("clef=bass");

        // The visualObj already contains transposed notes from renderAbc
        synthControl.setTune(visualObj[0], false, {
          midiTranspose: transpose,
          chordsOff: containsBassCleff,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to render sheet");
      }
    }

    init();

    // Cleanup
    return () => {
      synthControl?.pause();
    };
  }, [abcContent, transpose, sheet.content, containerWidth, barsPerLine]);

  if (!sheet.content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-[oklch(0.5_0.03_160)]">
        No content to preview
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[oklch(0.577_0.245_27.325)]">
            Failed to render sheet
          </p>
          <p className="mt-2 text-sm text-[oklch(0.5_0.04_160)]">
            Verify your input
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sheet music notation */}
      <div
        ref={notationRef}
        className="abc-container min-h-0 rounded-2xl border border-[oklch(0.92_0.02_160)] bg-white/90 backdrop-blur-sm p-4 shadow-sm"
      />

      {/* Source */}
      {sheet.source !== null && (
        <div className="mt-2 text-sm text-[oklch(0.5_0.04_160)] flex gap-1">
          Source:
          {isSourceLink ? (
            <a
              href={sheet.source}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-[oklch(0.55_0.18_160)] hover:underline"
            >
              {sheet.source}
            </a>
          ) : (
            <div className="truncate">{sheet.source}</div>
          )}
        </div>
      )}

      {/* Controls bar */}
      <div className="mt-4 space-y-3 rounded-2xl border border-[oklch(0.92_0.02_160)] backdrop-blur-sm bg-white/80 px-4 py-3 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Transpose controls */}
          <div className="flex items-center gap-2 justify-between flex-row">
            <span className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.5_0.04_160)]">
              Transpose
            </span>
            <div className="flex items-center rounded-xl bg-white shadow-sm ring-1 ring-[oklch(0.92_0.02_160)]">
              <button
                onClick={() => handleTransposeChange(-1)}
                className="rounded-l-xl px-3 py-1.5 text-[oklch(0.45_0.05_160)] hover:bg-[oklch(0.96_0.02_160)] transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <span className="min-w-10 border-x border-[oklch(0.92_0.02_160)] px-2 py-1.5 text-center font-mono text-sm font-medium text-[oklch(0.35_0.04_160)]">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                onClick={() => handleTransposeChange(1)}
                className="rounded-r-xl px-3 py-1.5 text-[oklch(0.45_0.05_160)] hover:bg-[oklch(0.96_0.02_160)] transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            {/* Saved indicator */}
            {showSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-[oklch(0.6_0.2_145)] animate-in fade-in slide-in-from-left-2 duration-200">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            {listId && !showSaved && (
              <span className="text-xs text-[oklch(0.5_0.04_160)]">
                Auto-saves to list
              </span>
            )}

            {/* Audio player - full width on mobile */}
          </div>
          <div ref={audioRef} className="abcjs-audio max-w-2xl flex-1" />
        </div>

        {/* Bars per line slider */}
        <div className="flex items-center justify-between print:hidden">
          <BarsPerLineSlider
            value={barsPerLine}
            onChange={handleBarsPerLineChange}
          />
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-[oklch(0.85_0.04_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.4_0.05_160)] hover:bg-gradient-to-r hover:from-[oklch(0.96_0.02_160)] hover:to-[oklch(0.96_0.02_150)] hover:border-[oklch(0.7_0.08_160)] transition-all"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
