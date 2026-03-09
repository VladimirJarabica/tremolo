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
});

describe("calculateBarsPerLine", () => {
  it("returns 1 for width < 400", () => {
    expect(calculateBarsPerLine(399)).toBe(1);
    expect(calculateBarsPerLine(300)).toBe(1);
  });

  it("returns 2 for width 400-549", () => {
    expect(calculateBarsPerLine(400)).toBe(2);
    expect(calculateBarsPerLine(549)).toBe(2);
  });

  it("returns 3 for width 550-699", () => {
    expect(calculateBarsPerLine(550)).toBe(3);
    expect(calculateBarsPerLine(699)).toBe(3);
  });

  it("returns 4 for width 700-849", () => {
    expect(calculateBarsPerLine(700)).toBe(4);
    expect(calculateBarsPerLine(849)).toBe(4);
  });

  it("returns 5 for width >= 850", () => {
    expect(calculateBarsPerLine(850)).toBe(5);
    expect(calculateBarsPerLine(1000)).toBe(5);
  });
});
