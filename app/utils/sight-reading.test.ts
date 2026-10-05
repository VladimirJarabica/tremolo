import { describe, it, expect } from "vitest";

import type { GeneratorSettings, StripItem } from "./sight-reading";
import {
  displayedAccidental,
  initialState,
  keyAlter,
  keyName,
  letterOf,
  nextItem,
  noteName,
  seededRng,
  stepLabel,
  stepOf,
} from "./sight-reading";

const BASE: GeneratorSettings = {
  low: stepOf(0, 4),
  high: stepOf(0, 6),
  key: { fifths: 0, mode: "major" },
  keyMode: "fixed",
  changeEvery: 8,
  maxKeyFifths: 3,
  accidentalChance: 0,
  leapChance: 0.3,
  maxLeap: 5,
  noteTypes: ["single"],
};

function generate(settings: GeneratorSettings, count: number): StripItem[] {
  const rng = seededRng(42);
  return Array.from({ length: count }).reduce<{
    items: StripItem[];
    state: ReturnType<typeof initialState>;
  }>(
    (acc) => {
      const { item, state } = nextItem({ state: acc.state, settings, rng });
      return { items: [...acc.items, item], state };
    },
    { items: [], state: initialState(settings) },
  ).items;
}

const notes = (items: StripItem[]) =>
  items.flatMap((item) => (item.kind === "notes" ? [item] : []));

describe("keyAlter", () => {
  it("G major sharpens F only", () => {
    expect(keyAlter(1, 3)).toBe(1);
    expect(keyAlter(1, 0)).toBe(0);
  });

  it("B♭ major flattens B and E", () => {
    expect(keyAlter(-2, 6)).toBe(-1);
    expect(keyAlter(-2, 2)).toBe(-1);
    expect(keyAlter(-2, 5)).toBe(0);
  });
});

describe("naming", () => {
  it("spells English names with ♯/♭", () => {
    expect(noteName(3, 1, "english")).toBe("F♯");
    expect(noteName(6, -1, "english")).toBe("B♭");
    expect(noteName(6, 0, "english")).toBe("B");
  });

  it("spells German names with H, B and -is/-es", () => {
    expect(noteName(6, 0, "german")).toBe("H");
    expect(noteName(6, -1, "german")).toBe("B");
    expect(noteName(3, 1, "german")).toBe("Fis");
    expect(noteName(2, -1, "german")).toBe("Es");
    expect(noteName(5, -1, "german")).toBe("As");
    expect(noteName(1, -1, "german")).toBe("Des");
  });

  it("names keys", () => {
    expect(keyName({ fifths: 1, mode: "major" }, "english")).toBe("G major");
    expect(keyName({ fifths: 1, mode: "minor" }, "german")).toBe("e mol");
    expect(keyName({ fifths: -3, mode: "major" }, "german")).toBe("Es dur");
    expect(keyName({ fifths: 3, mode: "minor" }, "german")).toBe("fis mol");
    expect(keyName({ fifths: -6, mode: "major" }, "english")).toBe("G♭ major");
  });

  it("labels steps with octave", () => {
    expect(stepLabel(stepOf(6, 3), "german")).toBe("H3");
    expect(stepLabel(stepOf(0, 4), "english")).toBe("C4");
  });
});

describe("nextItem", () => {
  it("stays in range and within the max leap", () => {
    const items = notes(generate(BASE, 500));
    const bottoms = items.map((item) => item.pitches[0]!.step);
    expect(bottoms.every((s) => s >= BASE.low && s <= BASE.high)).toBe(true);
    const leaps = bottoms.slice(1).map((s, i) => Math.abs(s - bottoms[i]!));
    expect(Math.max(...leaps)).toBeLessThanOrEqual(BASE.maxLeap - 1);
    expect(leaps.includes(0)).toBe(false);
  });

  it("only steps when leaps are disabled", () => {
    const items = notes(generate({ ...BASE, leapChance: 0 }, 200));
    const bottoms = items.map((item) => item.pitches[0]!.step);
    const leaps = bottoms.slice(1).map((s, i) => Math.abs(s - bottoms[i]!));
    expect(leaps.every((l) => l === 1)).toBe(true);
  });

  it("spells notes in the key without accidentals by default", () => {
    const settings = { ...BASE, key: { fifths: 2, mode: "major" as const } };
    const items = notes(generate(settings, 200));
    const shown = items.flatMap((item) =>
      item.pitches.map((p) => displayedAccidental(p, item.key)),
    );
    expect(shown.every((a) => a === null)).toBe(true);
    const fs = items
      .flatMap((item) => item.pitches)
      .filter((p) => letterOf(p.step) === 3);
    expect(fs.every((p) => p.alter === 1)).toBe(true);
  });

  it("adds accidentals outside the key when enabled", () => {
    const items = notes(generate({ ...BASE, accidentalChance: 1 }, 100));
    const shown = items.map((item) =>
      displayedAccidental(item.pitches[0]!, item.key),
    );
    expect(shown.every((a) => a !== null)).toBe(true);
    // No E♯ / B♯ / C♭ / F♭ in C major.
    const odd = items.filter((item) => {
      const p = item.pitches[0]!;
      const letter = letterOf(p.step);
      return (
        (p.alter === 1 && (letter === 2 || letter === 6)) ||
        (p.alter === -1 && (letter === 0 || letter === 3))
      );
    });
    expect(odd).toHaveLength(0);
  });

  it("builds diatonic chords that fit the range", () => {
    const settings: GeneratorSettings = {
      ...BASE,
      noteTypes: ["third", "sixth", "octave", "triad"],
    };
    const items = notes(generate(settings, 300));
    expect(items.every((item) => item.pitches.length >= 2)).toBe(true);
    expect(
      items.every((item) =>
        item.pitches.every((p) => p.step >= BASE.low && p.step <= BASE.high),
      ),
    ).toBe(true);
    const intervals = new Set(
      items.map((item) => item.pitches.map((p) => p.step - item.pitches[0]!.step).join(",")),
    );
    expect(intervals).toEqual(new Set(["0,2", "0,5", "0,7", "0,2,4"]));
  });

  it("falls back to single notes when no chord fits the range", () => {
    const settings: GeneratorSettings = {
      ...BASE,
      low: stepOf(0, 4),
      high: stepOf(2, 4),
      noteTypes: ["octave"],
    };
    const items = notes(generate(settings, 20));
    expect(items.every((item) => item.pitches.length === 1)).toBe(true);
  });

  it("keeps a fixed key forever", () => {
    const items = generate(BASE, 200);
    expect(items.every((item) => item.kind === "notes")).toBe(true);
  });

  it("changes key every N notes within the allowed signatures", () => {
    const settings: GeneratorSettings = {
      ...BASE,
      keyMode: "changing",
      changeEvery: 4,
      maxKeyFifths: 2,
    };
    const items = generate(settings, 50);
    const keyItems = items.flatMap((item) =>
      item.kind === "key" ? [item] : [],
    );
    expect(items[4]?.kind).toBe("key");
    expect(keyItems).toHaveLength(10);
    expect(keyItems.every((item) => Math.abs(item.key.fifths) <= 2)).toBe(true);
    expect(keyItems.every((item) => item.key.fifths !== item.from.fifths)).toBe(
      true,
    );
  });
});
