# Sight Reading Trainer — Design

Date: 2026-10-05

## Overview

A standalone page (`/sight-reading`) that shows an endless strip of notes
scrolling smoothly to the left. A dashed vertical line in the middle of the
strip marks the "current" note. The user plays along on their own instrument
(primary target: **piano accordion, right hand**). The app only displays — it
does not listen, score, or play audio.

### Non-goals (v1)

- Input of any kind (MIDI, microphone, on-screen keyboard), scoring, statistics.
- Audio playback of notes.
- Accordion left hand (Stradella bass / chord buttons), bass clef, grand staff.
- Note durations other than quarter notes; rests.
- Bar lines / time signatures.
- Generating the strip from an existing sheet (possible later — see below).

## Page & Controls

- New route `app/(app)/sight-reading/page.tsx`, sibling to `/trainer`.
- **Start / Pause** button (space bar toggles), plus a **Restart** button that
  clears the strip. Pause freezes the strip in
  place; Start resumes from the same position.
- On a fresh start the strip begins **empty for a short lead-in** — the first
  note enters from the right and needs some time to reach the line, so no
  countdown is necessary.
- Changing settings while running regenerates notes that are not yet visible;
  notes already on screen stay as they are.

## Settings

| Setting | Values | Default |
|---|---|---|
| Tempo | BPM = quarter notes crossing the line per minute | 60 |
| Range | from–to (pitch), constrained to accordion right-hand F3–A6 | C4–C6 |
| Key mode | fixed (user picks one key) / changing (random key every N notes) | fixed |
| Key | major/minor key (used when mode = fixed, and as the starting key otherwise) | C major |
| Change every | N notes (only when mode = changing) | 16 |
| Up to | max ♯/♭ of randomly picked keys (only when mode = changing) | 3 |
| Accidentals | off / occasional (probability slider) | off |
| Melodic motion | step ↔ leap ratio | mostly steps |
| Max leap | 2nd, 3rd, 4th, 5th, 6th, octave | 5th |
| Note types | multi-select: single, 3rds, 6ths, octaves, triads | single |
| Note names | show names under the strip (on/off) | off |
| Naming | English (C D E F G A B) / German (… A H, B = B♭, cis, es…) | German |

Note types:
- Dyads and triads are **diatonic in the current key** (3rd above D in C major
  = D–F, not D–F♯). The generated melody drives the *bottom* note; the whole
  chord must fit in the range.
- When several types are selected, each note picks a type at random.

Key changes:
- On a key change, show the new key signature on the strip at the point
  where it applies (it scrolls in like a note), plus the current key in the
  UI header.

Persistence: settings are kept in `localStorage` (per-viewer convenience;
falls back to defaults when unavailable).

## Note Generation

A pure, testable generator (`app/utils/sight-reading/generate.ts`):

```
next(prevNote, settings, rng) → StripNote
```

- Works on **diatonic scale degrees** within the range, not semitones, so
  steps/leaps and diatonic intervals are natural.
- Interval choice: weighted by the step↔leap ratio, capped by max leap,
  never leaves the range (reflect direction at the edges).
- Accidentals: with the configured probability, raise/lower the chosen degree
  by a semitone, spelled correctly (♯ on raised, ♭ on lowered).
- Spelling must follow the key (F♯ in G major, G♭ in D♭ major). The existing
  `app/utils/pitch-theory.ts` is sharp-only, so the generator needs its own
  spelled-pitch type: `{ letter, accidental, octave }`.
- Seeded RNG so tests are deterministic.

## Rendering — Custom SVG

abcjs renders a whole tune at once, which makes an endless, smoothly scrolling
strip awkward. v1 uses a small custom SVG renderer limited to what we need:

- Treble staff (5 lines), clef and key signature fixed at the left edge
  (they don't scroll).
- Plain filled note heads (no stems — quarter notes only, the goal is
  reading pitch), ledger lines, accidentals, stacked heads for dyads/triads (with the 2nd-offset rule).
- Each note has a fixed x in "strip space" (`index × spacing`). The strip
  group is moved via `transform: translateX(…)` driven by
  `requestAnimationFrame`, with position computed from elapsed time and tempo
  (time-based, not frame-based, so speed is independent of frame rate).
- Only notes within the viewport (+ a buffer) are rendered; notes are
  generated ahead and dropped once they leave on the left.
- The dashed vertical line is a fixed overlay at the horizontal center.
- Note names, when enabled, render in a row under the staff, aligned with notes.

## Later

- Stems (needed once longer note values are added).
- **From sheet**: feed the strip from an existing sheet's ABC (parse with abcjs
  to a note list, then render with the same SVG renderer).
- Longer note values, rests.
- Accordion left hand (Stradella bass + chord symbols, bass clef), grand staff.

## Open Questions

None at the moment.
