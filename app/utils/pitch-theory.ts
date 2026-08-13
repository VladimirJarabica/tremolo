/**
 * Pitch theory helpers for the ear-training (pitch trainer) game.
 *
 * Pitch model: scientific pitch notation, where **C4 = middle C = MIDI 60**.
 * abcjs follows the ABC standard: an uppercase `C` (no modifier) is middle C,
 * confirmed by `abcjs/src/synth/abc_midi_flattener.js`:
 *   `actualPitch = extractOctave(pitch) * 12 + scale[extractNote(pitch)] + 60`
 * so the internal pitch `0` (the note `C`) → MIDI 60 → C4.
 */

export const CHROMATIC_NOTES = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
] as const;

export type NoteName = (typeof CHROMATIC_NOTES)[number];

/** The 7 natural (white-key) notes — the beginner-friendly default pool. */
export const NATURAL_NOTES: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

/** The 5 accidental (black-key) notes, shown with both enharmonic names. */
export const SHARP_NOTES: NoteName[] = [
  "C#/Db",
  "D#/Eb",
  "F#/Gb",
  "G#/Ab",
  "A#/Bb",
];

export interface OctaveDefinition {
  /** Scientific pitch octave. C4 = middle C. */
  value: number;
  /** Short label shown on the octave toggle. */
  label: string;
}

/**
 * Octaves offered in the trainer. Spans two octaves below to two above middle C
 * — enough range to make "which octave" choices meaningful without going to
 * piano extremes that are hard to distinguish by ear.
 */
export const OCTAVES: OctaveDefinition[] = [
  { value: 2, label: "C2" },
  { value: 3, label: "C3" },
  { value: 4, label: "C4 (middle)" },
  { value: 5, label: "C5" },
  { value: 6, label: "C6" },
];

/** A human label for an octave value, e.g. "C4 (middle)". */
export function octaveLabel(value: number): string {
  return OCTAVES.find((o) => o.value === value)?.label ?? `C${value}`;
}

const SEMITONES: Record<NoteName, number> = {
  C: 0,
  "C#/Db": 1,
  D: 2,
  "D#/Eb": 3,
  E: 4,
  F: 5,
  "F#/Gb": 6,
  G: 7,
  "G#/Ab": 8,
  A: 9,
  "A#/Bb": 10,
  B: 11,
};

/** MIDI note number. C4 = 60 (middle C), A4 = 69 (440 Hz). */
export function noteToMidi(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + SEMITONES[note];
}

/** Frequency in Hz, using equal temperament with A4 = 440 Hz. */
export function noteToFrequency(note: NoteName, octave: number): number {
  return 440 * Math.pow(2, (noteToMidi(note, octave) - 69) / 12);
}

/**
 * ABC notation for a single note in the given octave, with a leading sharp
 * accidental where needed. Reference: `C` (uppercase) = middle C = C4.
 *  - octave 2 → `C,,`  (two commas below)
 *  - octave 3 → `C,`   (one comma below)
 *  - octave 4 → `C`    (middle, uppercase)
 *  - octave 5 → `c`    (lowercase)
 *  - octave 6 → `c'`   (one apostrophe above)
 */
export function noteToAbc(note: NoteName, octave: number): string {
  const letter = note[0]; // C D E F G A B
  // Accidentals are stored as "X#/Yb" (both enharmonic names), so detect the
  // sharp via `includes` — `endsWith` would miss them (they end in "b").
  const accidental = note.includes("#") ? "^" : "";
  let body: string;
  switch (octave) {
    case 2:
      body = `${letter},,`;
      break;
    case 3:
      body = `${letter},`;
      break;
    case 5:
      body = letter.toLowerCase();
      break;
    case 6:
      body = `${letter.toLowerCase()}'`;
      break;
    case 4:
    default:
      body = letter;
      break;
  }
  return `${accidental}${body}`;
}

export interface PickedNote {
  note: NoteName;
  octave: number;
}

interface AbcOptions {
  /** Quarter-note BPM. Defaults to 100. */
  tempo?: number;
  /**
   * Note duration in L:1/4 units. `2` = half note (a sustained, pleasant tone).
   * Defaults to 2.
   */
  duration?: number;
}

/**
 * A complete (single-tune) ABC string for one note, ready to feed abcjs. Uses
 * key C (no key signature) so accidentals are explicit and pitches are exact.
 */
export function buildNoteAbc(
  note: NoteName,
  octave: number,
  options?: AbcOptions,
): string {
  const tempo = options?.tempo ?? 100;
  const duration = options?.duration ?? 2;
  return [
    "X:1",
    "T:",
    "M:4/4",
    "L:1/4",
    `Q:1/4=${tempo}`,
    "K:C",
    `${noteToAbc(note, octave)}${duration}`,
  ].join("\n");
}

/**
 * An ABC string that draws an empty staff (a half rest) — used as the
 * pre-answer placeholder so the reveal area is stable in size.
 */
export function buildRestAbc(options?: AbcOptions): string {
  const tempo = options?.tempo ?? 100;
  return ["X:1", "T:", "M:4/4", "L:1/4", `Q:1/4=${tempo}`, "K:C", "z2"].join(
    "\n",
  );
}

/** Pretty, locale-independent label for a note, e.g. `C#4`. */
export function formatPitch(note: NoteName, octave: number): string {
  return `${note}${octave}`;
}

/**
 * Picks a uniformly-random note (name) and octave from the supplied pools.
 * Returns `null` if either pool is empty (the caller disables play in that case).
 */
export function pickRandomNote(
  notes: Iterable<NoteName>,
  octaves: Iterable<number>,
): PickedNote | null {
  const noteList = [...notes];
  const octaveList = [...octaves];
  if (noteList.length === 0 || octaveList.length === 0) {
    return null;
  }
  const note = noteList[Math.floor(Math.random() * noteList.length)]!;
  const octave = octaveList[Math.floor(Math.random() * octaveList.length)]!;
  return { note, octave };
}
