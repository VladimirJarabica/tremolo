import { describe, it, expect } from "vitest";
import { splitBars, wrapBars, calculateBarsPerLine } from "./abc-wrap";

describe("splitBars", () => {
  it("splits content by single bar lines", () => {
    const result = splitBars("CDE|FGA|Bcd");
    expect(result).toEqual(["CDE|", "FGA|", "Bcd"]);
  });

  it("preserves double bar lines", () => {
    const result = splitBars("CDE||FGA");
    expect(result).toEqual(["CDE||", "FGA"]);
  });

  it("preserves repeat start (|:)", () => {
    const result = splitBars("CDE|:FGA");
    expect(result).toEqual(["CDE|:", "FGA"]);
  });

  it("preserves repeat end (:|)", () => {
    const result = splitBars("CDE:|FGA");
    expect(result).toEqual(["CDE:|", "FGA"]);
  });

  it("preserves volta markings (|1, |2)", () => {
    const result = splitBars("CDE|1FGA|2Bcd");
    expect(result).toEqual(["CDE|1", "FGA|2", "Bcd"]);
  });

  it("handles mixed bar line types", () => {
    const result = splitBars("CDE|FGA||Bcd|:efg|1abc:|def");
    expect(result).toEqual(["CDE|", "FGA||", "Bcd|:", "efg|1", "abc:|", "def"]);
  });

  it("splits :||: (repeat end + repeat start) into separate bars", () => {
    const result = splitBars("ABC:||:DEF");
    expect(result).toEqual(["ABC:|", "|:DEF"]);
  });

  it("handles :||: with content around it", () => {
    const result = splitBars("CDE|FGA|z6:||:\"F\"AF2 AF2|");
    expect(result).toEqual(["CDE|", "FGA|", "z6:|", "|:\"F\"AF2 AF2|"]);
  });

  it("handles chords with pipes inside brackets", () => {
    const result = splitBars("[CEG]|[DFA]");
    expect(result).toEqual(["[CEG]|", "[DFA]"]);
  });

  it("returns single element for content without bars", () => {
    const result = splitBars("CDEFGA");
    expect(result).toEqual(["CDEFGA"]);
  });

  it("handles empty content", () => {
    const result = splitBars("");
    expect(result).toEqual([]);
  });

  it("handles complex real-world ABC with chord symbols and mixed bar lines", () => {
    const abc = `"Dm"DF AG FE|"F"F3GA2|"C"Gc cc cd|"F"A4F2|"Bb"GB dc
  BA|"Dm"AB AF Dz|"A"EF AG EF|"Bb"D4"C"E2|"F"F4"C"G2|"Dm"AA AG"A"EF|1"Dm"D
  [FA]2 [FA] "A"z [EA]|"Dm"D
  [FA]2[FA]"A"[EA]2:||2"Bb"D4"C"E2|"F"F4"C"G2|"Dm"AA AG "A"EF|"Dm"D2z4||`;

    const result = splitBars(abc);

    expect(result).toHaveLength(17);
    expect(result[0]).toBe(`"Dm"DF AG FE|`);
    expect(result[9]).toBe(`"Dm"AA AG"A"EF|1`);
    expect(result[11]).toContain(`:|`);
    expect(result[12]).toBe(`|2`);
    expect(result[16]).toBe(`"Dm"D2z4||`);
  });
});

describe("wrapBars", () => {
  it("wraps content with 1 bar per line", () => {
    const result = wrapBars("CDE|FGA|Bcd", 1);
    expect(result).toBe("CDE|\nFGA|\nBcd");
  });

  it("wraps content with 2 bars per line", () => {
    const result = wrapBars("CDE|FGA|Bcd|efg", 2);
    expect(result).toBe("CDE|FGA|\nBcd|efg");
  });

  it("wraps content with 4 bars per line", () => {
    const result = wrapBars("CDE|FGA|Bcd|efg|abc|def", 4);
    expect(result).toBe("CDE|FGA|Bcd|efg|\nabc|def");
  });

  it("handles content with fewer bars than bars per line", () => {
    const result = wrapBars("CDE|FGA", 4);
    expect(result).toBe("CDE|FGA");
  });

  it("preserves bar line types when wrapping", () => {
    const result = wrapBars("CDE||FGA|:Bcd", 2);
    expect(result).toBe("CDE||FGA|:\nBcd");
  });

  it("wraps each voice independently so multi-voice staves stay aligned", () => {
    const abc = [
      "%%score { 1 2 }",
      "V:1 clef=treble",
      "G2B2G2|D4D2|G2B2G2|D4,D2|G2F2G2|",
      "V:2 clef=bass",
      '"G"G,,2[G,B,D]2[G,B,D]2|D,2[G,B,D]2[G,B,D]2|G,,2[G,B,D]2[G,B,D]2|D,2[G,B,D]2[G,B,D]2|G,,2[G,B,D]2[G,B,D]2|',
    ].join("\n");

    const result = wrapBars(abc, 2);

    // Directive / header lines are preserved verbatim.
    expect(result).toContain("%%score { 1 2 }");
    expect(result).toContain("V:1 clef=treble");
    expect(result).toContain("V:2 clef=bass");

    // Both voices break at the same bar index (2 bars/line → 3 lines for 5 bars),
    // and pipes inside chords like [G,B,D] are never mistaken for bar lines.
    expect(result.split("\n")).toEqual([
      "%%score { 1 2 }",
      "V:1 clef=treble",
      "G2B2G2|D4D2|",
      "G2B2G2|D4,D2|",
      "G2F2G2|",
      "V:2 clef=bass",
      '"G"G,,2[G,B,D]2[G,B,D]2|D,2[G,B,D]2[G,B,D]2|',
      "G,,2[G,B,D]2[G,B,D]2|D,2[G,B,D]2[G,B,D]2|",
      "G,,2[G,B,D]2[G,B,D]2|",
    ]);
  });
});

describe("calculateBarsPerLine", () => {
  it("returns 4 for width < 700", () => {
    expect(calculateBarsPerLine(399)).toBe(4);
    expect(calculateBarsPerLine(699)).toBe(4);
  });

  it("returns 5 for width 700-849", () => {
    expect(calculateBarsPerLine(700)).toBe(5);
    expect(calculateBarsPerLine(849)).toBe(5);
  });

  it("returns 6 for width 850-999", () => {
    expect(calculateBarsPerLine(850)).toBe(6);
    expect(calculateBarsPerLine(999)).toBe(6);
  });

  it("returns 7 for width 1000-1499", () => {
    expect(calculateBarsPerLine(1000)).toBe(7);
    expect(calculateBarsPerLine(1499)).toBe(7);
  });

  it("returns 8 for width >= 1500", () => {
    expect(calculateBarsPerLine(1500)).toBe(8);
    expect(calculateBarsPerLine(2000)).toBe(8);
  });
});
