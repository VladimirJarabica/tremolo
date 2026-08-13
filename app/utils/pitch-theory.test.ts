import { describe, it, expect } from "vitest";
import {
  buildNoteAbc,
  buildRestAbc,
  CHROMATIC_NOTES,
  formatPitch,
  NATURAL_NOTES,
  noteToAbc,
  noteToFrequency,
  noteToMidi,
  OCTAVES,
  pickRandomNote,
  SHARP_NOTES,
} from "./pitch-theory";

/* -------------------------------------------------------------------------- */
/* noteToMidi                                                                 */
/* -------------------------------------------------------------------------- */

describe("noteToMidi", () => {
  it("maps middle C (C4) to MIDI 60", () => {
    expect(noteToMidi("C", 4)).toBe(60);
  });

  it("maps A4 to MIDI 69 (the 440 Hz reference)", () => {
    expect(noteToMidi("A", 4)).toBe(69);
  });

  it("maps each chromatic note in octave 4 to consecutive MIDI numbers 60–71", () => {
    CHROMATIC_NOTES.forEach((note, index) => {
      expect(noteToMidi(note, 4)).toBe(60 + index);
    });
  });

  it("maps the enharmonic (sharp/flat) note names correctly", () => {
    expect(noteToMidi("C#/Db", 4)).toBe(61);
    expect(noteToMidi("D#/Eb", 4)).toBe(63);
    expect(noteToMidi("F#/Gb", 4)).toBe(66);
    expect(noteToMidi("G#/Ab", 4)).toBe(68);
    expect(noteToMidi("A#/Bb", 4)).toBe(70);
  });

  it("adds 12 semitones per octave", () => {
    expect(noteToMidi("C", 5)).toBe(72);
    expect(noteToMidi("C", 3)).toBe(48);
    expect(noteToMidi("C", 2)).toBe(36);
    expect(noteToMidi("C", 6)).toBe(84);
    expect(noteToMidi("A", 5) - noteToMidi("A", 4)).toBe(12);
  });

  it("keeps accidentals across octaves", () => {
    expect(noteToMidi("A#/Bb", 3)).toBe(58);
    expect(noteToMidi("F#/Gb", 5)).toBe(78);
  });
});

/* -------------------------------------------------------------------------- */
/* noteToFrequency                                                            */
/* -------------------------------------------------------------------------- */

describe("noteToFrequency", () => {
  it("makes A4 exactly 440 Hz", () => {
    expect(noteToFrequency("A", 4)).toBeCloseTo(440, 5);
  });

  it("makes C4 ~261.63 Hz (equal temperament)", () => {
    expect(noteToFrequency("C", 4)).toBeCloseTo(261.6256, 2);
  });

  it("doubles per octave up and halves per octave down", () => {
    expect(noteToFrequency("A", 5)).toBeCloseTo(880, 5);
    expect(noteToFrequency("A", 3)).toBeCloseTo(220, 5);
  });

  it("matches noteToMidi (freq derived from the same MIDI number)", () => {
    const expected = 440 * Math.pow(2, (noteToMidi("F#/Gb", 4) - 69) / 12);
    expect(noteToFrequency("F#/Gb", 4)).toBeCloseTo(expected, 5);
  });
});

/* -------------------------------------------------------------------------- */
/* noteToAbc                                                                  */
/* -------------------------------------------------------------------------- */

describe("noteToAbc", () => {
  it("emits a plain uppercase letter for natural notes in octave 4 (middle C)", () => {
    expect(noteToAbc("C", 4)).toBe("C");
    expect(noteToAbc("B", 4)).toBe("B");
    expect(noteToAbc("E", 4)).toBe("E");
  });

  it("adds a sharp accidental (^) for black-key notes", () => {
    // Regression: accidentals are stored as "X#/Yb", so detection must use
    // `includes("#")`, not `endsWith("#")` (which would miss them and emit a
    // natural, i.e. the wrong pitch).
    expect(noteToAbc("C#/Db", 4)).toBe("^C");
    expect(noteToAbc("D#/Eb", 4)).toBe("^D");
    expect(noteToAbc("F#/Gb", 4)).toBe("^F");
    expect(noteToAbc("G#/Ab", 4)).toBe("^G");
    expect(noteToAbc("A#/Bb", 4)).toBe("^A");
  });

  it("encodes the octave with case + comma/apostrophe modifiers", () => {
    // Reference: ABC `C` (uppercase) = middle C = C4.
    expect(noteToAbc("C", 2)).toBe("C,,");
    expect(noteToAbc("C", 3)).toBe("C,");
    expect(noteToAbc("C", 4)).toBe("C");
    expect(noteToAbc("C", 5)).toBe("c");
    expect(noteToAbc("C", 6)).toBe("c'");
  });

  it("combines accidentals with octave modifiers", () => {
    expect(noteToAbc("C#/Db", 2)).toBe("^C,,");
    expect(noteToAbc("C#/Db", 3)).toBe("^C,");
    expect(noteToAbc("C#/Db", 5)).toBe("^c");
    expect(noteToAbc("C#/Db", 6)).toBe("^c'");
    expect(noteToAbc("A#/Bb", 6)).toBe("^a'");
  });

  it("lowercases natural notes one octave up", () => {
    expect(noteToAbc("D", 5)).toBe("d");
    expect(noteToAbc("B", 6)).toBe("b'");
  });
});

/* -------------------------------------------------------------------------- */
/* buildNoteAbc / buildRestAbc                                                */
/* -------------------------------------------------------------------------- */

describe("buildNoteAbc", () => {
  it("emits the ABC header fields", () => {
    const abc = buildNoteAbc("C", 4);
    expect(abc).toContain("X:1");
    expect(abc).toContain("M:4/4");
    expect(abc).toContain("L:1/4");
    expect(abc).toContain("K:C");
  });

  it("uses the default tempo (100) and a half-note duration", () => {
    const abc = buildNoteAbc("C", 4);
    expect(abc).toContain("Q:1/4=100");
    // Default duration 2 (L:1/4) → a half note appended to the note body.
    expect(abc.split("\n")).toContain("C2");
  });

  it("appends the note body (with accidental) plus duration on the last line", () => {
    expect(buildNoteAbc("C#/Db", 4).split("\n").at(-1)).toBe("^C2");
    expect(buildNoteAbc("A#/Bb", 5).split("\n").at(-1)).toBe("^a2");
  });

  it("respects the tempo and duration options", () => {
    const abc = buildNoteAbc("E", 4, { tempo: 60, duration: 4 });
    expect(abc).toContain("Q:1/4=60");
    expect(abc.split("\n").at(-1)).toBe("E4");
  });

  it("is deterministic for the same inputs", () => {
    expect(buildNoteAbc("F#/Gb", 3)).toBe(buildNoteAbc("F#/Gb", 3));
  });
});

describe("buildRestAbc", () => {
  it("emits a half rest on an otherwise normal header", () => {
    const abc = buildRestAbc();
    expect(abc).toContain("K:C");
    expect(abc.split("\n").at(-1)).toBe("z2");
  });

  it("respects the tempo option", () => {
    expect(buildRestAbc({ tempo: 80 })).toContain("Q:1/4=80");
  });
});

/* -------------------------------------------------------------------------- */
/* formatPitch                                                                */
/* -------------------------------------------------------------------------- */

describe("formatPitch", () => {
  it("joins the note name and octave", () => {
    expect(formatPitch("C", 4)).toBe("C4");
    expect(formatPitch("B", 6)).toBe("B6");
  });

  it("keeps the full enharmonic name", () => {
    expect(formatPitch("C#/Db", 5)).toBe("C#/Db5");
    expect(formatPitch("A#/Bb", 3)).toBe("A#/Bb3");
  });
});

/* -------------------------------------------------------------------------- */
/* pickRandomNote                                                             */
/* -------------------------------------------------------------------------- */

describe("pickRandomNote", () => {
  it("returns null when the note pool is empty", () => {
    expect(pickRandomNote([], [4])).toBeNull();
  });

  it("returns null when the octave pool is empty", () => {
    expect(pickRandomNote(["C"], [])).toBeNull();
  });

  it("returns null when both pools are empty", () => {
    expect(pickRandomNote([], [])).toBeNull();
  });

  it("always stays within the supplied pools", () => {
    const notes = ["C", "E", "G#/Ab"] as const;
    const octaves = [3, 5];
    for (let i = 0; i < 200; i++) {
      const picked = pickRandomNote(notes, octaves);
      expect(picked).not.toBeNull();
      expect(notes).toContain(picked!.note);
      expect(octaves).toContain(picked!.octave);
    }
  });

  it("returns the only option for single-element pools", () => {
    const picked = pickRandomNote(["D#/Eb"], [4]);
    expect(picked).toEqual({ note: "D#/Eb", octave: 4 });
  });

  it("eventually produces every combination given enough draws", () => {
    // Guards against a regression where the picker always returns the first
    // element. Uses Set lookups, so iteration order is irrelevant.
    const notes = ["C", "D", "E"] as const;
    const octaves = [4, 5];
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const picked = pickRandomNote(notes, octaves);
      seen.add(`${picked!.note}${picked!.octave}`);
    }
    expect(seen.size).toBe(notes.length * octaves.length);
  });
});

/* -------------------------------------------------------------------------- */
/* Note / octave collections                                                  */
/* -------------------------------------------------------------------------- */

describe("note collections", () => {
  it("has 12 chromatic notes", () => {
    expect(CHROMATIC_NOTES).toHaveLength(12);
  });

  it("has no duplicate pitch classes (all map to distinct MIDI in octave 4)", () => {
    const midis = CHROMATIC_NOTES.map((n) => noteToMidi(n, 4));
    expect(new Set(midis).size).toBe(12);
    expect(Math.min(...midis)).toBe(60);
    expect(Math.max(...midis)).toBe(71);
  });

  it("has 7 natural notes and 5 accidental notes, all part of the chromatic set", () => {
    expect(NATURAL_NOTES).toHaveLength(7);
    expect(SHARP_NOTES).toHaveLength(5);
    for (const n of NATURAL_NOTES) expect(CHROMATIC_NOTES).toContain(n);
    for (const n of SHARP_NOTES) expect(CHROMATIC_NOTES).toContain(n);
  });

  it("partitions the chromatic set into naturals + accidentals (no overlap)", () => {
    const combined = [...NATURAL_NOTES, ...SHARP_NOTES];
    expect(combined).toHaveLength(12);
    expect(new Set(combined).size).toBe(12);
  });

  it("offers 5 octaves spanning C2–C6", () => {
    expect(OCTAVES).toHaveLength(5);
    expect(OCTAVES.map((o) => o.value)).toEqual([2, 3, 4, 5, 6]);
  });

  it("keeps the natural notes free of accidentals markers", () => {
    for (const n of NATURAL_NOTES) {
      expect(n.includes("#")).toBe(false);
    }
  });
});
