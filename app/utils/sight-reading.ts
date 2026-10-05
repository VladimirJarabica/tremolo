/**
 * Pure music logic for the sight-reading strip: spelled pitches, keys, note
 * naming and the endless note generator.
 *
 * Pitches are diatonic: `step = octave * 7 + letter` (C=0 … B=6), so C4 = 28.
 * Working in scale steps (not semitones) makes steps/leaps and diatonic
 * intervals natural, and keeps spelling correct per key (F♯ in G, G♭ in D♭).
 */

export type Alter = -1 | 0 | 1;

export interface Pitch {
  step: number;
  alter: Alter;
}

export type Mode = "major" | "minor";

/** `fifths` = number of sharps (positive) or flats (negative) in the signature. */
export interface Key {
  fifths: number;
  mode: Mode;
}

export type Naming = "english" | "german";

export type NoteType = "single" | "third" | "sixth" | "octave" | "triad";

export type KeyMode = "fixed" | "changing";

export interface GeneratorSettings {
  low: number;
  high: number;
  key: Key;
  keyMode: KeyMode;
  /** Notes between key changes (keyMode = "changing"). */
  changeEvery: number;
  /** Random keys are picked with at most this many ♯/♭. */
  maxKeyFifths: number;
  /** 0–1 probability that a single note gets an accidental outside the key. */
  accidentalChance: number;
  /** 0–1 probability that the melody leaps instead of stepping. */
  leapChance: number;
  /** Largest leap as an interval number (2 = second … 8 = octave). */
  maxLeap: number;
  noteTypes: NoteType[];
}

export type StripItem =
  | { kind: "notes"; pitches: Pitch[]; key: Key }
  | { kind: "key"; key: Key; from: Key };

export interface GeneratorState {
  key: Key;
  /** Bottom step of the previous note, `null` before the first one. */
  lastStep: number | null;
  sinceKeyChange: number;
}

export type Rng = () => number;

/* -------------------------------------------------------------------------- */
/* Pitch helpers                                                              */
/* -------------------------------------------------------------------------- */

export const letterOf = (step: number): number => ((step % 7) + 7) % 7;

export const octaveOf = (step: number): number => Math.floor(step / 7);

export const stepOf = (letter: number, octave: number): number =>
  octave * 7 + letter;

/** Accordion right-hand keyboard (41 keys). */
export const ACCORDION_LOW = stepOf(3, 3); // F3
export const ACCORDION_HIGH = stepOf(5, 6); // A6

// Order in which sharps/flats enter a key signature (as letter indices).
export const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
export const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F

export function keyAlter(fifths: number, letter: number): Alter {
  if (fifths > 0 && SHARP_ORDER.slice(0, fifths).includes(letter)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, -fifths).includes(letter)) return -1;
  return 0;
}

/** Accidental to print next to a pitch in `key`, `null` when the key covers it. */
export function displayedAccidental(pitch: Pitch, key: Key): Alter | null {
  return pitch.alter === keyAlter(key.fifths, letterOf(pitch.step))
    ? null
    : pitch.alter;
}

/* -------------------------------------------------------------------------- */
/* Naming                                                                     */
/* -------------------------------------------------------------------------- */

export function noteName(
  letter: number,
  alter: Alter,
  naming: Naming,
): string {
  if (naming === "english") {
    const base = "CDEFGAB"[letter]!;
    if (alter === 1) return `${base}♯`;
    if (alter === -1) return `${base}♭`;
    return base;
  }
  const base = "CDEFGAH"[letter]!;
  if (alter === 1) return `${base}is`;
  if (alter === 0) return base;
  if (base === "H") return "B";
  if (base === "E" || base === "A") return `${base}s`;
  return `${base}es`;
}

export function pitchName(pitch: Pitch, naming: Naming): string {
  return noteName(letterOf(pitch.step), pitch.alter, naming);
}

/** Natural note with octave, used for the range pickers (e.g. "H3", "C4"). */
export function stepLabel(step: number, naming: Naming): string {
  return `${noteName(letterOf(step), 0, naming)}${octaveOf(step)}`;
}

export function keyTonic(key: Key): { letter: number; alter: Alter } {
  // Each fifth moves the major tonic up 4 letters; relative minor is 5 above.
  const letter = letterOf(key.fifths * 4 + (key.mode === "minor" ? 5 : 0));
  return { letter, alter: keyAlter(key.fifths, letter) };
}

/** "G major" / "E minor" in English, "G dur" / "e mol" in German naming. */
export function keyName(key: Key, naming: Naming): string {
  const tonic = keyTonic(key);
  const name = noteName(tonic.letter, tonic.alter, naming);
  if (naming === "english") {
    return `${name} ${key.mode}`;
  }
  return key.mode === "major" ? `${name} dur` : `${name.toLowerCase()} mol`;
}

/** Keys offered in the UI: 6♭ … 6♯ per mode (F♯ and G♭ both present). */
export const KEY_FIFTHS = [0, 1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6];

export const keysEqual = (a: Key, b: Key): boolean =>
  a.fifths === b.fifths && a.mode === b.mode;

/* -------------------------------------------------------------------------- */
/* Generator                                                                  */
/* -------------------------------------------------------------------------- */

const NOTE_TYPE_OFFSETS = {
  single: [0],
  third: [0, 2],
  sixth: [0, 5],
  octave: [0, 7],
  triad: [0, 2, 4],
} satisfies Record<NoteType, number[]>;

/** Deterministic PRNG (mulberry32) so generator tests are reproducible. */
export function seededRng(seed: number): Rng {
  const state = { a: seed >>> 0 };
  return () => {
    state.a = (state.a + 0x6d2b79f5) >>> 0;
    const t1 = Math.imul(state.a ^ (state.a >>> 15), 1 | state.a);
    const t2 = (t1 + Math.imul(t1 ^ (t1 >>> 7), 61 | t1)) ^ t1;
    return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

const pick = <T>(rng: Rng, list: readonly T[]): T =>
  list[Math.floor(rng() * list.length)]!;

export function initialState(settings: GeneratorSettings): GeneratorState {
  return { key: settings.key, lastStep: null, sinceKeyChange: 0 };
}

export function nextItem({
  state,
  settings,
  rng,
}: {
  state: GeneratorState;
  settings: GeneratorSettings;
  rng: Rng;
}): { item: StripItem; state: GeneratorState } {
  if (
    settings.keyMode === "changing" &&
    state.sinceKeyChange >= settings.changeEvery
  ) {
    const key = pickNextKey({ current: state.key, settings, rng });
    return {
      item: { kind: "key", key, from: state.key },
      state: { ...state, key, sinceKeyChange: 0 },
    };
  }

  const low = Math.min(settings.low, settings.high);
  const high = Math.max(settings.low, settings.high);
  const fitting = settings.noteTypes.filter(
    (type) => Math.max(...NOTE_TYPE_OFFSETS[type]) <= high - low,
  );
  const type = pick<NoteType>(rng, fitting.length > 0 ? fitting : ["single"]);
  const offsets = NOTE_TYPE_OFFSETS[type];
  const bottomHigh = high - Math.max(...offsets);
  const bottom =
    state.lastStep === null
      ? randInt(rng, low, bottomHigh)
      : moveMelody({ from: state.lastStep, low, high: bottomHigh, settings, rng });

  const diatonic = offsets.map(
    (offset): Pitch => ({
      step: bottom + offset,
      alter: keyAlter(state.key.fifths, letterOf(bottom + offset)),
    }),
  );
  const pitches =
    type === "single" && rng() < settings.accidentalChance
      ? diatonic.map((p) => chromaticAlter(p, rng))
      : diatonic;

  return {
    item: { kind: "notes", pitches, key: state.key },
    state: {
      key: state.key,
      lastStep: bottom,
      sinceKeyChange: state.sinceKeyChange + 1,
    },
  };
}

function moveMelody({
  from,
  low,
  high,
  settings,
  rng,
}: {
  from: number;
  low: number;
  high: number;
  settings: GeneratorSettings;
  rng: Rng;
}): number {
  if (high <= low) return low;
  const maxLeapSteps = settings.maxLeap - 1;
  const interval =
    maxLeapSteps >= 2 && rng() < settings.leapChance
      ? randInt(rng, 2, maxLeapSteps)
      : 1;
  const direction = rng() < 0.5 ? 1 : -1;
  const inRange = (step: number): boolean => step >= low && step <= high;
  const preferred = from + direction * interval;
  if (inRange(preferred)) return preferred;
  const reflected = from - direction * interval;
  if (inRange(reflected)) return reflected;
  return Math.min(high, Math.max(low, preferred));
}

/**
 * Raise or lower a note a semitone away from its key spelling. Never produces
 * double sharps/flats, nor E♯/B♯/C♭/F♭ (they read as different keys).
 */
function chromaticAlter(pitch: Pitch, rng: Rng): Pitch {
  if (pitch.alter !== 0) return { ...pitch, alter: 0 };
  const letter = letterOf(pitch.step);
  const options: Alter[] = [
    ...(letter === 2 || letter === 6 ? [] : [1 as const]),
    ...(letter === 0 || letter === 3 ? [] : [-1 as const]),
  ];
  return { ...pitch, alter: pick(rng, options) };
}

function pickNextKey({
  current,
  settings,
  rng,
}: {
  current: Key;
  settings: GeneratorSettings;
  rng: Rng;
}): Key {
  const candidates = KEY_FIFTHS.filter(
    (fifths) =>
      Math.abs(fifths) <= settings.maxKeyFifths && fifths !== current.fifths,
  );
  if (candidates.length === 0) return current;
  return { fifths: pick(rng, candidates), mode: current.mode };
}
