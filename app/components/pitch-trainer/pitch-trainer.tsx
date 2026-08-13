"use client";

import abcjs from "abcjs";
import {
  Check,
  Ear,
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useNotePlayer } from "./use-note-player";
import { PianoKeyboard } from "./piano-keyboard";
import {
  buildNoteAbc,
  buildRestAbc,
  CHROMATIC_NOTES,
  formatPitch,
  NATURAL_NOTES,
  NoteName,
  OCTAVES,
  pickRandomNote,
  PickedNote,
} from "@/app/utils/pitch-theory";

/**
 * localStorage key for the trainer's note/octave selection so a user's practice
 * setup persists between sessions.
 */
const SETTINGS_STORAGE_KEY = "tremolo:trainer:settings";

interface TrainerSettings {
  notes: NoteName[];
  octaves: number[];
}

const DEFAULT_SETTINGS: TrainerSettings = {
  notes: [...NATURAL_NOTES],
  octaves: [4, 5],
};

function readStoredSettings(): TrainerSettings | null {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<TrainerSettings>;
    const notes = (parsed.notes ?? []).filter((n): n is NoteName =>
      (CHROMATIC_NOTES as readonly string[]).includes(n),
    );
    const octaves = (parsed.octaves ?? []).filter((o) =>
      OCTAVES.some((oct) => oct.value === o),
    );
    if (notes.length === 0 || octaves.length === 0) return null;
    return { notes, octaves };
  } catch {
    return null;
  }
}

function writeStoredSettings(settings: TrainerSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors (private mode, quota, disabled storage).
  }
}

/**
 * The note/octave selection is persisted client state backed by a tiny
 * external store consumed via {@link useSyncExternalStore}. This is the
 * React-idiomatic way to hydrate from localStorage: it avoids both a
 * hydration mismatch (the server snapshot is always the defaults) and the
 * `set-state-in-effect` anti-pattern (load/persist happen in the store, not in
 * component effects). Round/score state stays ephemeral component state.
 */
const storeListeners = new Set<() => void>();
let storeValue: TrainerSettings = DEFAULT_SETTINGS;
let storeInitialized = false;

function initStoreOnce(): void {
  if (storeInitialized || typeof window === "undefined") return;
  storeInitialized = true;
  const stored = readStoredSettings();
  if (stored !== null) {
    storeValue = stored;
  }
}

function subscribeSettings(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

function getSettingsSnapshot(): TrainerSettings {
  initStoreOnce();
  return storeValue;
}

function getSettingsServerSnapshot(): TrainerSettings {
  return DEFAULT_SETTINGS;
}

function setSettings(
  updater: (prev: TrainerSettings) => TrainerSettings,
): void {
  storeValue = updater(storeValue);
  writeStoredSettings(storeValue);
  storeListeners.forEach((listener) => listener());
}

/**
 * Subscribes the component to the persisted settings store and exposes
 * membership sets (memoized) plus mutators. The component wraps the mutators
 * to also reset the active round on change.
 */
function useTrainerSettings(): {
  notes: NoteName[];
  octaves: number[];
  noteSet: Set<NoteName>;
  octaveSet: Set<number>;
  toggleNote: (note: NoteName) => void;
  toggleOctave: (octave: number) => void;
  setNotesTo: (list: NoteName[]) => void;
} {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );
  const noteSet = useMemo(() => new Set(settings.notes), [settings.notes]);
  const octaveSet = useMemo(
    () => new Set(settings.octaves),
    [settings.octaves],
  );

  const toggleNote = useCallback((note: NoteName): void => {
    setSettings((prev) => {
      const next = new Set(prev.notes);
      if (next.has(note)) {
        next.delete(note);
      } else {
        next.add(note);
      }
      return { ...prev, notes: [...next] };
    });
  }, []);

  const toggleOctave = useCallback((octave: number): void => {
    setSettings((prev) => {
      const next = new Set(prev.octaves);
      if (next.has(octave)) {
        next.delete(octave);
      } else {
        next.add(octave);
      }
      return { ...prev, octaves: [...next] };
    });
  }, []);

  const setNotesTo = useCallback((list: NoteName[]): void => {
    setSettings((prev) => ({ ...prev, notes: list }));
  }, []);

  return {
    notes: settings.notes,
    octaves: settings.octaves,
    noteSet,
    octaveSet,
    toggleNote,
    toggleOctave,
    setNotesTo,
  };
}

type Phase = "ready" | "answered";

interface Stats {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

const AUTO_ADVANCE_MS = 1600;

export function PitchTrainer(): React.JSX.Element {
  const {
    notes,
    octaves,
    noteSet,
    octaveSet,
    toggleNote: toggleNoteSelection,
    toggleOctave: toggleOctaveSelection,
    setNotesTo: setNotesSelection,
  } = useTrainerSettings();
  const [current, setCurrent] = useState<PickedNote | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [selectedAnswer, setSelectedAnswer] = useState<NoteName | null>(null);
  const [stats, setStats] = useState<Stats>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
  });

  const { play, isPlaying, volume, setVolume } = useNotePlayer();
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousVolumeRef = useRef(100);

  const handleVolumeChange = useCallback(
    (value: number): void => {
      setVolume(value);
    },
    [setVolume],
  );

  const toggleMute = useCallback((): void => {
    if (volume === 0) {
      setVolume(previousVolumeRef.current || 100);
    } else {
      previousVolumeRef.current = volume;
      setVolume(0);
    }
  }, [volume, setVolume]);

  const isValid = notes.length > 1 && octaves.length > 0;
  const answeredNote = current !== null && phase === "answered";

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current !== null) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  /** Reset the active round (no audio). Used whenever the pool changes. */
  const resetRound = useCallback(() => {
    clearAutoAdvance();
    setCurrent(null);
    setSelectedAnswer(null);
    setPhase("ready");
  }, [clearAutoAdvance]);

  // --- Round control -------------------------------------------------------
  const startRound = useCallback(() => {
    if (notes.length === 0 || octaves.length === 0) return;
    clearAutoAdvance();
    const picked = pickRandomNote(notes, octaves);
    if (picked === null) return;
    setCurrent(picked);
    setSelectedAnswer(null);
    setPhase("ready");
    void play(buildNoteAbc(picked.note, picked.octave));
  }, [notes, octaves, play, clearAutoAdvance]);

  const replay = useCallback(() => {
    if (current === null) return;
    void play(buildNoteAbc(current.note, current.octave));
  }, [current, play]);

  /**
   * Primary action label/behaviour adapts to state:
   *  - no round yet        → start (pick + play)
   *  - round, awaiting ans → play again (replay current)
   *  - answered            → next (pick + play)
   */
  const handlePrimary = useCallback((): void => {
    if (phase === "answered") {
      startRound();
    } else if (current === null) {
      startRound();
    } else {
      replay();
    }
  }, [phase, current, startRound, replay]);

  const handleAnswer = useCallback(
    (note: NoteName): void => {
      if (phase !== "ready" || current === null) return;
      const correct = note === current.note;
      setSelectedAnswer(note);
      setPhase("answered");
      setStats((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
        streak: correct ? s.streak + 1 : 0,
        bestStreak: correct
          ? Math.max(s.bestStreak, s.streak + 1)
          : s.bestStreak,
      }));
      autoAdvanceRef.current = setTimeout(() => {
        autoAdvanceRef.current = null;
        startRound();
      }, AUTO_ADVANCE_MS);
    },
    [phase, current, startRound],
  );

  // Clean up the auto-advance timer on unmount.
  useEffect(() => clearAutoAdvance, [clearAutoAdvance]);

  // --- Selection helpers (wrap store mutators to also reset the round) -----
  const toggleNote = useCallback(
    (note: NoteName): void => {
      toggleNoteSelection(note);
      resetRound();
    },
    [toggleNoteSelection, resetRound],
  );

  const toggleOctave = useCallback(
    (octave: number): void => {
      toggleOctaveSelection(octave);
      resetRound();
    },
    [toggleOctaveSelection, resetRound],
  );

  const setNotesTo = useCallback(
    (list: NoteName[]): void => {
      setNotesSelection(list);
      resetRound();
    },
    [setNotesSelection, resetRound],
  );

  // --- Derived display -----------------------------------------------------
  const accuracy =
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);

  const primaryLabel =
    phase === "answered"
      ? "Next note"
      : current === null
        ? "Start"
        : "Play again";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border backdrop-blur-sm bg-card/60 px-4 py-4 sticky top-14 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-gradient shadow-md shadow-primary/30">
              <Ear className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Pitch Trainer</h2>
              <p className="text-xs text-muted-foreground">
                Listen, then pick the note you heard.
              </p>
            </div>
          </div>
          <StatRow stats={stats} accuracy={accuracy} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Settings */}
          <section className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </h3>
              <div className="flex gap-1.5">
                <QuickSelect onClick={() => setNotesTo(NATURAL_NOTES)}>
                  Naturals
                </QuickSelect>
                <QuickSelect onClick={() => setNotesTo([...CHROMATIC_NOTES])}>
                  All
                </QuickSelect>
                <QuickSelect onClick={() => setNotesTo([])}>Clear</QuickSelect>
              </div>
            </div>
            <PianoKeyboard
              variant="select"
              activeNotes={noteSet}
              onPick={toggleNote}
              className="mt-3 h-24 sm:h-28"
            />

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Octaves
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {OCTAVES.map((octave) => (
                <OptionToggle
                  key={octave.value}
                  active={octaveSet.has(octave.value)}
                  onClick={() => toggleOctave(octave.value)}
                >
                  {octave.label}
                </OptionToggle>
              ))}
            </div>
          </section>

          {/* Game board */}
          <section className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-sm">
            {/* Reveal area */}
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-center gap-2 h-7">
                {current === null ? (
                  <span className="text-sm text-muted-foreground">
                    Press play to begin
                  </span>
                ) : phase === "ready" ? (
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      isPlaying ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Volume2
                      className={cn("h-4 w-4", isPlaying && "animate-pulse")}
                    />
                    {isPlaying ? "Listening…" : "Which note is it?"}
                  </span>
                ) : selectedAnswer === current.note ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" />
                    Correct! {formatPitch(current.note, current.octave)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <X className="h-4 w-4" />
                    It was {formatPitch(current.note, current.octave)}
                  </span>
                )}
              </div>
              <NotationStaff
                abc={
                  answeredNote
                    ? buildNoteAbc(current.note, current.octave)
                    : buildRestAbc()
                }
                reveal={answeredNote}
              />
            </div>

            {/* Primary control + volume — side by side, centered */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={handlePrimary}
                disabled={!isValid}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {phase === "answered" ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {primaryLabel}
                  </>
                ) : current === null ? (
                  <>
                    <Play className="h-4 w-4" />
                    {primaryLabel}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    {primaryLabel}
                  </>
                )}
              </button>
              {/* Volume — shared with the sheet player via the `tremolo:volume` key. */}
              <VolumeControl
                volume={volume}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
              />
            </div>

            {!isValid && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Select at least two notes and one octave.
              </p>
            )}

            {/* Answer keyboard */}
            <div className="mt-5">
              <PianoKeyboard
                variant="answer"
                activeNotes={noteSet}
                answered={answeredNote}
                correctNote={answeredNote ? (current?.note ?? null) : null}
                pickedNote={answeredNote ? selectedAnswer : null}
                onPick={handleAnswer}
                className="h-40 sm:h-44"
              />
              {notes.length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  No notes selected — pick some above.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

/** Renders the staff for a single-note ABC string; used for the reveal. */
function NotationStaff({
  abc,
  reveal,
}: {
  abc: string;
  reveal: boolean;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current === null) return;
    ref.current.innerHTML = "";
    abcjs.renderAbc(ref.current, abc, {
      responsive: "resize",
      add_classes: true,
    });
  }, [abc]);

  return (
    <div
      ref={ref}
      className={cn(
        "abc-container mt-2 min-h-[90px] rounded-xl bg-transparent transition-all",
        !reveal && "opacity-50 blur-[2px]",
      )}
    />
  );
}

function StatRow({
  stats,
  accuracy,
}: {
  stats: Stats;
  accuracy: number;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 text-xs font-medium">
      <Stat icon={<Target className="h-3.5 w-3.5" />} label="Score">
        <span className="tabular-nums">
          {stats.correct}
          <span className="text-muted-foreground">/{stats.total}</span>
        </span>
      </Stat>
      <Stat
        icon={<Flame className="h-3.5 w-3.5" />}
        label="Streak"
        highlight={stats.streak > 0}
      >
        <span className="tabular-nums">{stats.streak}</span>
      </Stat>
      <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Best">
        <span className="tabular-nums">{stats.bestStreak}</span>
      </Stat>
      <Stat icon={<Check className="h-3.5 w-3.5" />} label="Acc">
        <span className="tabular-nums">{accuracy}%</span>
      </Stat>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-border bg-card/80 px-3 py-1.5 shadow-sm",
        highlight && "border-primary/50 bg-primary/10",
      )}
    >
      <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold text-foreground">{children}</span>
    </div>
  );
}

/** Pill toggle used for note/octave selection. */
function OptionToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-w-[2.75rem] rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all active:scale-95",
        active
          ? "border-transparent bg-brand-gradient text-primary-foreground shadow-sm shadow-primary/30"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Small text "chip" for quick-select actions (Naturals / All / Clear). */
function QuickSelect({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
    >
      {children}
    </button>
  );
}

/** Compact mute + volume slider, mirroring the sheet player's control. */
function VolumeControl({
  volume,
  onVolumeChange,
  onToggleMute,
}: {
  volume: number;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleMute}
        title={volume === 0 ? "Unmute" : "Mute"}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
        onValueChange={(values) => onVolumeChange(values[0] ?? 0)}
        aria-label="Volume"
        className="w-28 sm:w-32"
      />
      <span className="min-w-[2ch] text-center font-mono text-xs tabular-nums text-muted-foreground">
        {volume}
      </span>
    </div>
  );
}
