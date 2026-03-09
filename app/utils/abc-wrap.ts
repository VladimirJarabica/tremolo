/**
 * Split ABC content into bars, preserving bar line types
 * Handles: ||, |:, :|, |1, |2, etc.
 * Special case: :||: (repeat end + repeat start) splits into two bars
 */
export function splitBars(content: string): string[] {
  // Match bar lines in order of specificity:
  // :||: (repeat end + start - most specific, must be first)
  // || (double bar), |: (repeat start), :| (repeat end), |1-9 (volta), | (single bar)
  // But NOT | that's part of chords like [CEG]
  const barPattern = /(:\|\|:|\|\||\|:|:\||\|[1-9]|\|)/g;

  const bars: string[] = [];
  let lastIndex = 0;
  let prependToNext = "";
  let match;

  while ((match = barPattern.exec(content)) !== null) {
    // Check if this | is inside brackets (chord)
    const beforeMatch = content.slice(0, match.index);
    const openBrackets = (beforeMatch.match(/\[/g) || []).length;
    const closeBrackets = (beforeMatch.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
      // Inside a chord, skip this match
      continue;
    }

    const barLine = match[0];

    // Special handling for :||: - split into two separate bars
    if (barLine === ":||:") {
      // Add content before + :|
      bars.push(content.slice(lastIndex, match.index) + ":|");
      // Skip past the entire :||: and prepend |: to next content
      lastIndex = match.index + barLine.length;
      prependToNext = "|:";
    } else {
      // Normal handling - add content before + bar line
      const contentBefore = prependToNext + content.slice(lastIndex, match.index);
      bars.push(contentBefore + barLine);
      prependToNext = "";
      lastIndex = match.index + barLine.length;
    }
  }

  // Add any remaining content
  if (lastIndex < content.length) {
    bars.push(prependToNext + content.slice(lastIndex));
  }

  return bars;
}

/**
 * Wrap bars into lines based on bars per line
 */
export function wrapBars(content: string, barsPerLine: number): string {
  const bars = splitBars(content);
  const lines: string[] = [];

  for (let i = 0; i < bars.length; i += barsPerLine) {
    const lineBars = bars.slice(i, i + barsPerLine);
    lines.push(lineBars.join(""));
  }

  return lines.join("\n");
}

/**
 * Calculate bars per line based on container width
 */
export function calculateBarsPerLine(width: number): number {
  if (width < 400) return 1;
  if (width < 550) return 2;
  if (width < 700) return 3;
  if (width < 850) return 4;
  return 5;
}
