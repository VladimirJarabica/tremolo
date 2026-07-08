"use client";

import { useEffect, useRef, useState } from "react";
import abcjs from "abcjs";
import { Check, RotateCcw, Volume1, Volume2, VolumeX } from "lucide-react";
import { useDebouncer } from "@tanstack/react-pacer";
import { SheetDetail } from "@/be/sheet/get-sheet";
import { Slider } from "@/components/ui/slider";
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

/**
 * Player volume is a global playback preference (not per-sheet), persisted in
 * the browser. Stored as 0–100 and mapped to abcjs' `soundFontVolumeMultiplier`
 * (100 == abcjs default loudness). try/catch-guarded like the transpose helpers.
 */
const VOLUME_STORAGE_KEY = "tremolo:volume";
const VOLUME_DEFAULT = 100;

function readStoredVolume(): number | null {
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return null;
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value)) return null;
    return Math.min(100, Math.max(0, value));
  } catch {
    return null;
  }
}

function writeStoredVolume(value: number): void {
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
  } catch {
    // Ignore storage errors (private mode, quota, disabled storage).
  }
}

/**
 * abcjs' SynthController keeps playback state (current position, playing flag,
 * loaded flag) and an internal midi buffer that are not in its public TS
 * interface but exist at runtime. We mirror the built-in `setWarp` flow:
 * capture position + play state, re-prime with new audio options, then resume.
 * Changing volume re-renders the offline audio buffer, so volume changes are
 * debounced and only re-prime once audio has already been loaded.
 */
interface AbcjsSynthRuntime {
  options: abcjs.SynthOptions;
  isLoaded: boolean;
  isStarted: boolean;
  percent: number;
  midiBuffer: { duration: number };
  go(): Promise<unknown>;
  play(): Promise<unknown>;
  pause(): void;
  seek(percent: number): void;
  setProgress(percent: number, totalTime: number): void;
  destroy(): void;
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

  const [volume, setVolume] = useState(VOLUME_DEFAULT);
  const volumeRef = useRef(volume);
  const previousVolumeRef = useRef(VOLUME_DEFAULT);
  const synthControlRef = useRef<AbcjsSynthRuntime | null>(null);

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

  // Restore previously saved volume after mount (kept out of useState's
  // initializer so SSR output stays consistent — mirrors the transpose pattern).
  useEffect(() => {
    const stored = readStoredVolume();
    if (stored !== null) {
      volumeRef.current = stored;
      setVolume(stored);
    }
  }, []);

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

  // Re-prime the synth with a new volume. Mirrors abcjs' built-in `setWarp`:
  // capture play state + position, re-prime, then resume. If audio hasn't been
  // loaded yet we just update the options so the value is applied when playback
  // first starts — avoiding an unnecessary re-prime.
  const applyVolumeToSynth = (value: number): void => {
    const synth = synthControlRef.current;
    if (synth === null) {
      return;
    }
    synth.options = synth.options ?? {};
    synth.options.soundFontVolumeMultiplier = value / 100;

    if (!synth.isLoaded) {
      return;
    }

    const wasPlaying = synth.isStarted;
    const startPercent = synth.percent ?? 0;

    synth.destroy();
    synth.isStarted = false;
    void synth.go().then(() => {
      synth.setProgress(startPercent, synth.midiBuffer.duration * 1000);
      if (wasPlaying) {
        void synth.play().then(() => {
          synth.seek(startPercent);
        });
      } else {
        synth.seek(startPercent);
      }
    });
  };

  // Volume changes rebuild the offline audio buffer, so debounce to avoid
  // thrashing while dragging the slider.
  const debouncedApplyVolume = useDebouncer(
    (value: number) => applyVolumeToSynth(value),
    { wait: 200 },
  );

  function handleVolumeChange(value: number): void {
    volumeRef.current = value;
    setVolume(value);
    writeStoredVolume(value);
    debouncedApplyVolume.maybeExecute(value);
  }

  function toggleMute(): void {
    if (volume === 0) {
      handleVolumeChange(previousVolumeRef.current || VOLUME_DEFAULT);
    } else {
      previousVolumeRef.current = volume;
      handleVolumeChange(0);
    }
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
        synthControlRef.current = synthControl as unknown as AbcjsSynthRuntime;
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

        // The visualObj already contains transposed notes from renderAbc.
        // `soundFontVolumeMultiplier` is baked into the offline audio buffer
        // during prime, so it is read from the ref to pick up the latest value
        // without re-rendering the notation on every volume change.
        synthControl.setTune(visualObj[0], false, {
          midiTranspose: transpose,
          chordsOff: containsBassCleff,
          soundFontVolumeMultiplier: volumeRef.current / 100,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to render sheet");
      }
    }

    init();

    // Cleanup
    return () => {
      synthControl?.pause();
      synthControlRef.current = null;
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
          <p className="text-lg text-destructive">Failed to render sheet</p>
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
          </div>

          {/* Audio player + volume — grouped as a single flex item */}
          <div className="flex flex-1 justify-end items-center gap-3">
            <div ref={audioRef} className="abcjs-audio max-w-2xl flex-1" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                title={volume === 0 ? "Unmute" : "Mute"}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : volume < 50 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={5}
                onValueChange={(values) => handleVolumeChange(values[0] ?? 0)}
                aria-label="Volume"
                className="w-24"
              />
              <span className="min-w-8 text-center font-mono text-xs tabular-nums text-muted-foreground">
                {volume}
              </span>
            </div>
          </div>
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
