import { describe, it, expect } from "vitest";
import { getDiatonicChords, getQuickChordRoots } from "./diatonic-chords";
import { Scale } from "@/be/db/enums";

const names = (scale: Parameters<typeof getDiatonicChords>[0]) =>
  getDiatonicChords(scale).map((c) => c.name);

describe("getDiatonicChords", () => {
  it("returns the diatonic triads for C major", () => {
    expect(names(Scale.C)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "B°"]);
  });

  it("returns the diatonic triads for A minor (natural)", () => {
    expect(names(Scale.Am)).toEqual(["Am", "B°", "C", "Dm", "Em", "F", "G"]);
  });

  it("returns the diatonic triads for G major", () => {
    expect(names(Scale.G)).toEqual(["G", "Am", "Bm", "C", "D", "Em", "F#°"]);
  });

  it("returns the diatonic triads for D major", () => {
    expect(names(Scale.D)).toEqual(["D", "Em", "F#m", "G", "A", "Bm", "C#°"]);
  });

  it("returns the diatonic triads for E minor (natural)", () => {
    expect(names(Scale.Em)).toEqual(["Em", "F#°", "G", "Am", "Bm", "C", "D"]);
  });

  it("returns the diatonic triads for a flat key (Bb major)", () => {
    expect(names(Scale.Bb)).toEqual([
      "Bb",
      "Cm",
      "Dm",
      "Eb",
      "F",
      "Gm",
      "A°",
    ]);
  });

  it("returns the diatonic triads for a flat minor key (F minor)", () => {
    expect(names(Scale.Fm)).toEqual([
      "Fm",
      "G°",
      "Ab",
      "Bbm",
      "Cm",
      "Db",
      "Eb",
    ]);
  });

  it("always returns 7 chords", () => {
    for (const scale of Object.values(Scale)) {
      expect(getDiatonicChords(scale)).toHaveLength(7);
    }
  });

  it("starts on the tonic chord for every key", () => {
    // Major keys start on a major tonic, minor keys on a minor tonic.
    expect(getDiatonicChords(Scale.Eb)[0]).toMatchObject({
      name: "Eb",
      quality: "major",
    });
    expect(getDiatonicChords(Scale.Cm)[0]).toMatchObject({
      name: "Cm",
      quality: "minor",
    });
  });

  it("uses correct Roman-numeral casing and diminished marks", () => {
    const romans = getDiatonicChords(Scale.C).map((c) => c.roman);
    expect(romans).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  });
});

describe("getQuickChordRoots", () => {
  it("returns tonic-first circle-of-fifths order for C major", () => {
    expect(getQuickChordRoots(Scale.C)).toEqual(["C", "F", "G", "D", "A", "E"]);
  });

  it("puts the minor tonic (A) first for A minor", () => {
    expect(getQuickChordRoots(Scale.Am)[0]).toBe("A");
  });

  it("transposes the set for G major (tonic first, then CoF order)", () => {
    // G major diatonic roots minus F#° (diminished): G A B C D E
    expect(getQuickChordRoots(Scale.G)).toEqual(["G", "C", "D", "A", "E", "B"]);
  });

  it("always returns 6 roots (the diminished one excluded)", () => {
    for (const scale of Object.values(Scale)) {
      expect(getQuickChordRoots(scale)).toHaveLength(6);
    }
  });

  it("starts on the tonic for every key", () => {
    expect(getQuickChordRoots(Scale.Eb)[0]).toBe("Eb");
    expect(getQuickChordRoots(Scale.Cm)[0]).toBe("C");
  });
});
