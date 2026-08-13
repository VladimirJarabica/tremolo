"use client";

import { cn } from "@/lib/utils";
import { NoteName } from "@/app/utils/pitch-theory";

/**
 * One-octave piano keyboard used both to **select** the practice pool and to
 * **answer**. A single octave is sufficient because the trainer quizzes pitch
 * *class* (the note name) — the octave only varies the heard register.
 *
 * The white keys are laid out as 7 equal flex columns; the 5 black keys are
 * absolutely positioned, centred on the boundary between two white keys
 * (boundary = white-key index 1–6, skipping E/F and B/C). Widths use
 * `100%/7` so the board scales with its container.
 *
 * Color model (per the design): a key is either **on** or **off**.
 *  - on  → its natural piano colour (white / black) via Tailwind utilities
 *  - off → a solid grey background applied through inline `style` using the
 *          `--piano-off-white` / `--piano-off-black` custom properties defined
 *          in globals.css (light grey for white-key slots, dark grey for
 *          black-key slots). Inline styles reliably beat Tailwind's preflight
 *          `button { background-color: transparent }` — and the values live in
 *          `:root` (which compiles) rather than authored class rules (which
 *          Tailwind v4 strips), so the keys are always a solid grey, never
 *          see-through.
 *
 * A piano is a conventional white-key/black-key instrument, so the key colours
 * are fixed (`bg-white` / `bg-black`) regardless of app theme — the theme
 * tokens invert in dark mode, which would make the two key types
 * indistinguishable. Result feedback (correct ring / wrong fill) uses semantic
 * tokens. `cn` (tailwind-merge) resolves the resulting class conflicts.
 */

const WHITE_KEYS: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

/** Black key + the white-key index whose right boundary it sits on (C = 0). */
const BLACK_KEYS: { note: NoteName; after: number }[] = [
  { note: "C#/Db", after: 1 },
  { note: "D#/Eb", after: 2 },
  { note: "F#/Gb", after: 4 },
  { note: "G#/Ab", after: 5 },
  { note: "A#/Bb", after: 6 },
];

/** Width of one white key as a percentage of the board. */
const WHITE_WIDTH_PCT = 100 / 7;

type Variant = "select" | "answer";

interface PianoKeyboardProps {
  variant: Variant;
  /**
   * The "active" notes — pool membership. For `select` these are the lit keys;
   * for `answer` these are the enabled (clickable) keys.
   */
  activeNotes: Set<NoteName>;
  /** answer: show result feedback. */
  answered?: boolean;
  /** answer: the note that was played (ringed once answered). */
  correctNote?: NoteName | null;
  /** answer: the note the user picked (filled red if wrong). */
  pickedNote?: NoteName | null;
  onPick: (note: NoteName) => void;
  /** Root height class, e.g. `h-36`. */
  className?: string;
}

interface KeyState {
  active: boolean;
  correct: boolean;
  wrong: boolean;
}

export function PianoKeyboard({
  variant,
  activeNotes,
  answered = false,
  correctNote = null,
  pickedNote = null,
  onPick,
  className,
}: PianoKeyboardProps): React.JSX.Element {
  const isAnswer = variant === "answer";

  function stateFor(note: NoteName): KeyState {
    const active = activeNotes.has(note);
    const correct = isAnswer && answered && note === correctNote;
    const wrong = isAnswer && answered && note === pickedNote && !correct;
    return { active, correct, wrong };
  }

  function classesFor(note: NoteName, isBlack: boolean, st: KeyState): string {
    // Active (in-pool) keys show their natural piano colour. Inactive keys get
    // a solid grey background via inline `style` (see styleFor) — not a Tailwind
    // class, because Tailwind v4 drops authored classes added to globals.css,
    // and inline styles reliably beat its preflight `button { background-color:
    // transparent }`. Text/border still use utilities.
    const base = st.active
      ? isBlack
        ? "bg-black text-white"
        : "border border-black/10 bg-white text-black"
      : isBlack
        ? "text-white/80"
        : "border border-black/10 text-muted-foreground";

    if (variant === "select") {
      // Lit = full colour; off = greyed, brightening on hover to invite a click.
      return cn(base, !st.active && "hover:brightness-110");
    }

    // answer
    return cn(
      base,
      // Keys outside the pool are greyed + disabled; pool keys are clickable.
      !st.active && "cursor-not-allowed",
      !answered && st.active && "cursor-pointer hover:brightness-95",
      // Result feedback (no solid green): correct keeps its colour + a brand
      // ring; the wrong pick flips to red.
      st.correct && "ring-2 ring-inset ring-primary",
      st.wrong && "border-transparent bg-destructive text-white",
    );
  }

  /** Solid grey background for inactive keys; active keys return undefined so
   * their Tailwind bg-* utility applies. */
  function styleFor(
    isBlack: boolean,
    st: KeyState,
  ): React.CSSProperties | undefined {
    if (st.active) return undefined;
    return {
      backgroundColor: isBlack
        ? "var(--piano-off-black)"
        : "var(--piano-off-white)",
    };
  }

  return (
    <div className={cn("relative flex w-full select-none gap-px", className)}>
      {/* White keys */}
      {WHITE_KEYS.map((note) => {
        const st = stateFor(note);
        const disabled = isAnswer && (answered || !st.active);
        return (
          <button
            key={note}
            type="button"
            aria-label={note}
            aria-pressed={variant === "select" ? st.active : undefined}
            disabled={disabled}
            onClick={() => onPick(note)}
            style={styleFor(false, st)}
            className={cn(
              "relative flex h-full flex-1 items-end justify-center rounded-b-lg pb-2 text-sm font-bold shadow-sm transition-all active:translate-y-0.5",
              classesFor(note, false, st),
            )}
          >
            <span className="pointer-events-none text-xs opacity-80">
              {note}
            </span>
          </button>
        );
      })}

      {/* Black keys — absolutely positioned over the white-key boundaries */}
      {BLACK_KEYS.map(({ note, after }) => {
        const st = stateFor(note);
        const disabled = isAnswer && (answered || !st.active);
        return (
          <button
            key={note}
            type="button"
            aria-label={note}
            aria-pressed={variant === "select" ? st.active : undefined}
            disabled={disabled}
            onClick={() => onPick(note)}
            style={{
              left: `${after * WHITE_WIDTH_PCT}%`,
              width: `${WHITE_WIDTH_PCT * 0.64}%`,
              ...styleFor(true, st),
            }}
            className={cn(
              "absolute top-0 z-10 flex h-[62%] -translate-x-1/2 items-end justify-center rounded-b-md pb-1 text-[0.65rem] font-bold shadow-md transition-all active:translate-y-0.5",
              classesFor(note, true, st),
            )}
          >
            <span className="pointer-events-none whitespace-nowrap text-[0.55rem] leading-none opacity-80 sm:text-[0.6rem]">
              {note}
            </span>
          </button>
        );
      })}
    </div>
  );
}
