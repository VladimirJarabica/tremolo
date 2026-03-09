/**
 * Split ABC content into bars, preserving bar line types
 * Handles: ||, |:, :|, |1, |2, etc.
 */
export function splitBars(content: string): string[] {
  // Match bar lines in order of specificity:
  // || (double bar), |: (repeat start), :| (repeat end), |1-9 (volta), | (single bar)
  // But NOT | that's part of chords like [CEG]
  const barPattern = /(\|\||\|:|:\||\|[1-9]|\|)/g;

  const bars: string[] = [];
  let lastIndex = 0;
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

    // Add the content before the bar line + the bar line itself
    bars.push(content.slice(lastIndex, match.index + match[0].length));
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining content
  if (lastIndex < content.length) {
    bars.push(content.slice(lastIndex));
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
