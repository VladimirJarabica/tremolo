"use client";

import "abcjs/abcjs-audio.css";

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

  const abcContent = getAbcNotationFromSheet(sheet);

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
          displayLoop: true,
          displayRestart: true,
          displayPlay: true,
          displayProgress: true,
          displayWarp: true,
        });

        // Create synth with the transposed visual object
        const createSynth = new abcjs.synth.CreateSynth();
        await createSynth.init({
          visualObj: visualObj[0],
        });

        // The visualObj already contains transposed notes from renderAbc
        synthControl.setTune(visualObj[0], false, {
          midiTranspose: transpose,
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
      <div className="flex h-full items-center justify-center text-zinc-400">
        No content to preview
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Failed to render sheet</p>
          <p className="mt-2 text-sm text-zinc-500">Verify your input</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Sheet music notation */}
      <div
        ref={notationRef}
        className="abc-container min-h-0 flex-1 rounded-lg bg-white p-4"
      />

      {/* Controls bar */}
      <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Transpose controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Transpose
            </span>
            <div className="ml-2 flex items-center rounded-md bg-white shadow-sm ring-1 ring-zinc-200">
              <button
                onClick={() => handleTransposeChange(-1)}
                className="rounded-l-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
              <span className="min-w-10 border-x border-zinc-200 px-2 py-1.5 text-center font-mono text-sm">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                onClick={() => handleTransposeChange(1)}
                className="rounded-r-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
              <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in slide-in-from-left-2 duration-200">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            {listId && !showSaved && (
              <span className="text-xs text-zinc-400">Auto-saves to list</span>
            )}
          </div>

          {/* Audio player */}
          <div
            ref={audioRef}
            className="abcjs-audio max-w-2xl min-w-xl flex-1"
          />
        </div>

        {/* Bars per line slider */}
        <div className="flex items-center justify-between print:hidden">
          <BarsPerLineSlider
            value={barsPerLine}
            onChange={handleBarsPerLineChange}
          />
          <button
            onClick={() => window.print()}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
