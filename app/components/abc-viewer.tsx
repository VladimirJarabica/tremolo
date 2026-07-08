"use client";

import { useEffect, useRef, useState } from "react";
import abcjs from "abcjs";
import { Check, RotateCcw } from "lucide-react";
import { useDebouncer } from "@tanstack/react-pacer";
import { SheetDetail } from "@/be/sheet/get-sheet";
import { getAbcNotationFromSheet } from "../utils/abc-notation";
import { updateListItemTranspose } from "@/app/actions/update-list-item-transpose";
import { wrapBars, calculateBarsPerLine } from "@/app/utils/abc-wrap";
import { BarsPerLineSlider } from "@/app/components/bars-per-line-slider";

/**
 * Per-sheet transpose persisted in the browser for the bare (non-list) view.
 * When a sheet is viewed inside a list, the DB ListItem.transpose is the source
 * of truth and these helpers are not used. Keyed by sheet id (stable across
 * renames; slug is not). All access is try/catch-guarded so private mode,
 * quota errors, or disabled storage never throw into the UI.
 */
const TRANSPOSE_STORAGE_PREFIX = "tremolo:transpose:";

function transposeStorageKey(sheetId: string): string {
  return `${TRANSPOSE_STORAGE_PREFIX}${sheetId}`;
}

function readStoredTranspose(sheetId: string): number | null {
  try {
    const raw = window.localStorage.getItem(transposeStorageKey(sheetId));
    if (raw === null) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

function writeStoredTranspose(sheetId: string, value: number): void {
  try {
    window.localStorage.setItem(transposeStorageKey(sheetId), String(value));
  } catch {
    // Ignore storage errors (private mode, quota, disabled storage).
  }
}

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

  // Target transpose for the current context: in a list, the DB
  // ListItem.transpose (initialTranspose); in the bare view, a value
  // previously persisted to localStorage (falling back to initialTranspose).
  // Computed during render but consumed only as the effect dependency, so the
  // localStorage read never touches SSR output — hydration stays consistent
  // via the useState(initialTranspose) seed above, and the effect updates the
  // state after mount.
  const targetTranspose = listId
    ? initialTranspose
    : (readStoredTranspose(sheet.id) ?? initialTranspose);

  useEffect(() => {
    setTranspose(targetTranspose);
  }, [targetTranspose]);

  function applyTranspose(value: number): void {
    setTranspose(value);
    if (listId) {
      // List context: persist to DB (debounced).
      debouncedSave.maybeExecute(value);
    } else {
      // Bare view: persist to this browser.
      writeStoredTranspose(sheet.id, value);
    }
  }

  function handleTransposeChange(delta: number): void {
    applyTranspose(transpose + delta);
  }

  function handleTransposeReset(): void {
    applyTranspose(0);
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
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No content to preview
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive">
            Failed to render sheet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
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
        className="abc-container min-h-0 rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-4 shadow-sm print:border-none print:shadow-none print:bg-transparent"
      />

      {/* Source */}
      {sheet.source !== null && (
        <div className="mt-2 text-sm text-muted-foreground flex gap-1">
          Source:
          {isSourceLink ? (
            <a
              href={sheet.source}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-primary hover:underline"
            >
              {sheet.source}
            </a>
          ) : (
            <div className="truncate">{sheet.source}</div>
          )}
        </div>
      )}

      {/* Controls bar */}
      <div className="mt-4 space-y-3 rounded-2xl border border-border backdrop-blur-sm bg-card/80 px-4 py-3 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Transpose controls */}
          <div className="flex items-center gap-2 justify-between flex-row">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Transpose
            </span>
            <div className="flex items-center rounded-xl bg-card shadow-sm ring-1 ring-border">
              <button
                onClick={() => handleTransposeChange(-1)}
                className="rounded-l-xl px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
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
              <span className="min-w-10 border-x border-border px-2 py-1.5 text-center font-mono text-sm font-medium text-secondary-foreground">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                onClick={() => handleTransposeChange(1)}
                className="rounded-r-xl px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
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
            {/* Reset — only shown when transposed */}
            {transpose !== 0 && (
              <button
                onClick={handleTransposeReset}
                title="Reset to 0"
                aria-label="Reset transpose to 0"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Saved indicator */}
            {showSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-success animate-in fade-in slide-in-from-left-2 duration-200">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            {listId && !showSaved && (
              <span className="text-xs text-muted-foreground">
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
            className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:border-primary/40 transition-all"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
