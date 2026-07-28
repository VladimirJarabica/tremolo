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
      const contentBefore =
        prependToNext + content.slice(lastIndex, match.index);
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
 * Wrap a single stream of music (no `V:` directives) into lines of
 * `barsPerLine` bars. Any header/field lines lump in with the first bar —
 * abcjs parses fields anywhere, so this also covers the single-voice
 * full-notation case.
 */
function wrapMusic(music: string, barsPerLine: number): string {
  const bars = splitBars(music);
  if (bars.length === 0) return music;
  const lines: string[] = [];
  for (let i = 0; i < bars.length; i += barsPerLine) {
    lines.push(bars.slice(i, i + barsPerLine).join(""));
  }
  return lines.join("\n");
}

/**
 * True when the tune declares more than one voice (`V:` directives, usually
 * grouped with `%%score` / `%%staves`). Such tunes cannot be wrapped by
 * counting bar lines across the whole string — each staff must break at the
 * same bar or abcjs desyncs the voices.
 */
function hasVoiceDirectives(content: string): boolean {
  return /(^|\n)\s*V:/.test(content);
}

/**
 * Wrap a multi-voice tune. Header / field / directive lines (`X:`, `K:`,
 * `%%score`, …) and each `V:` line are emitted verbatim; the MUSIC of every
 * voice is collected and re-wrapped independently. Because every voice in a
 * system shares the same bar count, breaking at the same bar index in each
 * voice keeps the staves aligned at the system break.
 */
function wrapMultiVoice(content: string, barsPerLine: number): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let music: string[] = [];

  const flush = (): void => {
    if (music.length === 0) return;
    // A voice's music may already span several input lines; ABC treats
    // newlines and spaces in the music body as equivalent separators, so
    // re-joining into a single stream before re-splitting by bar is lossless.
    out.push(wrapMusic(music.join(" "), barsPerLine));
    music = [];
  };

  for (const line of lines) {
    if (/^\s*V:/.test(line)) {
      flush();
      out.push(line);
    } else if (/^\s*(%%|%|[A-Za-z]:)/.test(line)) {
      // Header / field / directive / comment line — keep as-is.
      flush();
      out.push(line);
    } else {
      music.push(line);
    }
  }
  flush();
  return out.join("\n");
}

/**
 * Wrap bars into lines based on bars per line. Multi-voice tunes (with `V:`
 * directives) are wrapped per-voice so the staves stay aligned; single-voice
 * tunes are wrapped as one stream.
 */
export function wrapBars(content: string, barsPerLine: number): string {
  if (barsPerLine <= 0) return content;
  if (hasVoiceDirectives(content)) {
    return wrapMultiVoice(content, barsPerLine);
  }
  return wrapMusic(content, barsPerLine);
}

/**
 * Calculate bars per line based on container width
 */
export function calculateBarsPerLine(width: number): number {
  if (width < 700) return 4;
  if (width < 850) return 5;
  if (width < 1000) return 6;
  if (width < 1500) return 7;
  return 8;
}
