import type { Scale } from "@/be/db/enums";

export interface DiatonicChord {
  /** Scale-degree root note, e.g. "C", "F#", "Bb". */
  root: string;
  /** Roman-numeral degree, e.g. "I", "ii", "vii°" (case follows quality). */
  roman: string;
  /** Lead-sheet name, e.g. "C", "Dm", "B°". */
  name: string;
  /** Triad quality. */
  quality: "major" | "minor" | "diminished" | "augmented";
}

const LETTER_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** The 15 major scales, spelled with the correct sharps/flats per key. */
const MAJOR_SCALES: Record<string, string[]> = {
  // Sharp keys
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  A: ["A", "B", "C#", "D", "E", "F#", "G#"],
  E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
  B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  Fs: ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
  Cs: ["C#", "D#", "E#", "F#", "G#", "A#", "B#"],
  // Flat keys
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
  Cb: ["Cb", "Db", "Eb", "Fb", "Gb", "Ab", "Bb"],
};

/** Maps a minor key to its relative major (same 7 notes, rotated). */
const MINOR_TO_RELATIVE_MAJOR: Record<string, string> = {
  Am: "C",
  Em: "G",
  Bm: "D",
  Fsm: "A",
  Csm: "E",
  Gsm: "B",
  Dsm: "Fs",
  Asm: "Cs",
  Dm: "F",
  Gm: "Bb",
  Cm: "Eb",
  Fm: "Ab",
  Bbm: "Db",
  Ebm: "Gb",
  Abm: "Cb",
};

function pitchClass(note: string): number {
  const letter = note[0];
  const accidental = note.slice(1);
  let pc = LETTER_PC[letter] ?? 0;
  if (accidental === "#") pc += 1;
  else if (accidental === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

/** Resolve the 7 scale notes (correct spelling) for a major or minor key. */
function getScaleNotes(scale: Scale): {
  notes: string[];
  isMajor: boolean;
} {
  const isMajor = !scale.endsWith("m");
  if (isMajor) {
    return { notes: MAJOR_SCALES[scale], isMajor: true };
  }
  const majorNotes = MAJOR_SCALES[MINOR_TO_RELATIVE_MAJOR[scale]];
  const tonic = scale.slice(0, -1); // "Fsm" -> "Fs", "Bbm" -> "Bb", "Am" -> "A"
  const offset = majorNotes.indexOf(tonic);
  return {
    notes: [...majorNotes.slice(offset), ...majorNotes.slice(0, offset)],
    isMajor: false,
  };
}

function triadQuality(
  root: string,
  third: string,
  fifth: string,
): DiatonicChord["quality"] {
  const r = pitchClass(root);
  const thirdInterval = (pitchClass(third) - r + 12) % 12;
  const fifthInterval = (pitchClass(fifth) - r + 12) % 12;
  if (thirdInterval === 4 && fifthInterval === 7) return "major";
  if (thirdInterval === 3 && fifthInterval === 7) return "minor";
  if (thirdInterval === 3 && fifthInterval === 6) return "diminished";
  if (thirdInterval === 4 && fifthInterval === 8) return "augmented";
  return "major";
}

function chordName(root: string, quality: DiatonicChord["quality"]): string {
  switch (quality) {
    case "major":
      return root;
    case "minor":
      return `${root}m`;
    case "diminished":
      return `${root}°`;
    case "augmented":
      return `${root}+`;
  }
}

function romanNumeral(
  degree: number,
  quality: DiatonicChord["quality"],
): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
  let numeral = numerals[degree];
  // Lowercase for minor/diminished; uppercase for major/augmented.
  if (quality === "minor" || quality === "diminished") {
    numeral = numeral.toLowerCase();
  }
  if (quality === "diminished") numeral += "°";
  if (quality === "augmented") numeral += "+";
  return numeral;
}

/**
 * Returns the 7 diatonic triads for the given key, in scale-degree order.
 * For C major: C, Dm, Em, F, G, Am, B°. Minor keys use the natural-minor
 * scale (e.g. A minor: Am, B°, C, Dm, Em, F, G).
 */
export function getDiatonicChords(scale: Scale): DiatonicChord[] {
  const { notes } = getScaleNotes(scale);
  return notes.map((root, i) => {
    const third = notes[(i + 2) % 7];
    const fifth = notes[(i + 4) % 7];
    const quality = triadQuality(root, third, fifth);
    return {
      root,
      roman: romanNumeral(i, quality),
      name: chordName(root, quality),
      quality,
    };
  });
}

/**
 * Signed circle-of-fifths offset of a note from C: sharps positive, flats
 * negative. E.g. G -> 1, F -> -1, A -> 3, Bb -> -2.
 */
function signedCircleOfFifths(note: string): number {
  const position = (pitchClass(note) * 7) % 12;
  return position > 6 ? position - 12 : position;
}

/**
 * Returns the 6 "quick" chord roots for a key: the diatonic roots minus the
 * diminished one, with the tonic first and the rest ordered by circle-of-fifths
 * proximity to the tonic (flats before sharps at equal distance).
 *
 * For C major this yields C, F, G, D, A, E; for A minor the tonic moves to the
 * front (A, ...). Use these as dropdown triggers letting the user pick any
 * quality (major/minor/seventh/diminished/augmented) of each root.
 */
export function getQuickChordRoots(scale: Scale): string[] {
  const chords = getDiatonicChords(scale);
  const tonicCoF = signedCircleOfFifths(chords[0].root);
  const scored = chords
    .filter((c) => c.quality !== "diminished")
    .map((c) => ({
      root: c.root,
      distance: signedCircleOfFifths(c.root) - tonicCoF,
    }));
  scored.sort((a, b) => {
    const aAbs = Math.abs(a.distance);
    const bAbs = Math.abs(b.distance);
    if (aAbs !== bAbs) return aAbs - bAbs;
    return a.distance - b.distance; // flats (negative) before sharps
  });
  return scored.map((c) => c.root);
}
