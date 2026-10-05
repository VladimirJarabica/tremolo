"use client";

import { useEffect, useRef, useState } from "react";

import type {
  GeneratorSettings,
  GeneratorState,
  Key,
  Naming,
  Rng,
  StripItem,
} from "@/app/utils/sight-reading";
import {
  displayedAccidental,
  FLAT_ORDER,
  initialState,
  keyAlter,
  keyName,
  keysEqual,
  nextItem,
  pitchName,
  seededRng,
  SHARP_ORDER,
} from "@/app/utils/sight-reading";
import { cn } from "@/lib/utils";

import { GLYPH_STEP, GLYPHS } from "./glyphs";

// Staff geometry (px). Steps are diatonic: E4 = 30 (bottom line), F5 = 38 (top).
const HALF = 6;
const TOP_LINE_Y = 70;
const BOTTOM_STEP = 30;
const TOP_STEP = 38;
const BEAT = 84;
const SCALE = HALF / GLYPH_STEP;
const HEAD_W = GLYPHS.notehead.w * SCALE;
const SIG_GAP = 13;

const yOf = (step: number): number => TOP_LINE_Y + (TOP_STEP - step) * HALF;

interface Placed {
  id: number;
  /** Center x in strip coordinates (before scrolling). */
  x: number;
  w: number;
  item: StripItem;
}

interface Generator {
  state: GeneratorState;
  rng: Rng;
  nextId: number;
}

/**
 * The endless strip. Notes get a fixed x in strip space; scrolling moves one
 * `<g>` via its transform from a requestAnimationFrame loop, so React only
 * re-renders when notes are added/dropped (≈ once per beat), not every frame.
 * Remount (change `key`) to restart from an empty strip.
 */
export function NoteStrip({
  settings,
  tempo,
  running,
  showNames,
  naming,
}: {
  settings: GeneratorSettings;
  tempo: number;
  running: boolean;
  showNames: boolean;
  naming: Naming;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const [width, setWidth] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [current, setCurrent] = useState<{ id: number | null; key: Key | null }>(
    { id: null, key: null },
  );

  const sim = useRef({
    offset: 0,
    placed: [] as Placed[],
    gen: null as Generator | null,
    settings,
    tempo,
    settingsChanged: false,
  });

  const settingsKey = JSON.stringify(settings);
  useEffect(() => {
    sim.current.settings = JSON.parse(settingsKey) as GeneratorSettings;
    sim.current.settingsChanged = true;
  }, [settingsKey]);

  useEffect(() => {
    sim.current.tempo = tempo;
  }, [tempo]);

  useEffect(() => {
    const el = containerRef.current;
    if (el === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || width === 0) return;
    const s = sim.current;
    const frame = { id: 0, last: null as number | null };
    const lineX = width / 2;

    function tick(ts: number): void {
      const dt = frame.last === null ? 0 : Math.min(ts - frame.last, 100);
      frame.last = ts;
      s.offset += (dt / 1000) * (s.tempo / 60) * BEAT;

      const gen = s.gen ?? {
        state: initialState(s.settings),
        rng: seededRng(Date.now()),
        nextId: 0,
      };
      const truncated = s.settingsChanged
        ? truncateHidden({ placed: s.placed, gen, settings: s.settings, offset: s.offset, width })
        : { placed: s.placed, gen };
      s.settingsChanged = false;
      const visible = truncated.placed.filter(
        (p) => p.x + p.w / 2 >= s.offset - BEAT,
      );
      const filled = fill({
        placed: visible,
        gen: truncated.gen,
        settings: s.settings,
        until: s.offset + width + BEAT,
        startX: width,
      });
      const changed =
        filled.placed.length !== s.placed.length ||
        filled.placed[0]?.id !== s.placed[0]?.id ||
        filled.placed.at(-1)?.id !== s.placed.at(-1)?.id;
      s.placed = filled.placed;
      s.gen = filled.gen;

      groupRef.current?.setAttribute("transform", `translate(${-s.offset} 0)`);
      if (changed) setPlaced(s.placed);

      const atLine = s.placed.find(
        (p) => Math.abs(s.offset + lineX - p.x) <= p.w / 2,
      );
      const id = atLine?.item.kind === "notes" ? atLine.id : null;
      const key = (() => {
        if (atLine !== undefined) return atLine.item.key;
        const first = s.placed[0];
        if (first === undefined || first.x > s.offset + lineX) {
          return first?.item.kind === "key" ? first.item.from : (first?.item.key ?? null);
        }
        return null;
      })();
      setCurrent((prev) => {
        const nextKey = key ?? prev.key;
        if (
          prev.id === id &&
          prev.key !== null &&
          nextKey !== null &&
          keysEqual(prev.key, nextKey)
        ) {
          return prev;
        }
        return { id, key: nextKey };
      });

      frame.id = requestAnimationFrame(tick);
    }

    frame.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.id);
  }, [running, width]);

  // Before the first note reaches the line, show the key the strip starts in.
  const shownKey = current.key ?? settings.key;
  const fixedW = 42 + signatureGlyphs(shownKey.fifths).length * SIG_GAP + 8;
  const height = showNames ? 236 : 172;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <span>
          Key:{" "}
          <span className="font-semibold text-foreground">
            {keyName(shownKey, naming)}
          </span>
        </span>
      </div>
      <div ref={containerRef} className="w-full overflow-hidden">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block text-foreground"
            role="img"
            aria-label="Scrolling note strip"
          >
            <defs>
              <linearGradient id="strip-fade" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--card)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--card)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={0}
                x2={width}
                y1={TOP_LINE_Y + i * HALF * 2}
                y2={TOP_LINE_Y + i * HALF * 2}
                stroke="currentColor"
                strokeOpacity={0.55}
              />
            ))}

            <g ref={groupRef}>
              {placed.map((p) =>
                p.item.kind === "notes" ? (
                  <NotesGlyphs
                    key={p.id}
                    x={p.x}
                    item={p.item}
                    active={p.id === current.id}
                    showNames={showNames}
                    naming={naming}
                  />
                ) : (
                  <KeyChangeGlyphs
                    key={p.id}
                    x={p.x}
                    w={p.w}
                    item={p.item}
                    naming={naming}
                  />
                ),
              )}
            </g>

            {/* Fixed clef + key signature; scrolled notes slide under it. */}
            <rect x={0} y={0} width={fixedW} height={height} fill="var(--card)" />
            <rect x={fixedW} y={0} width={28} height={height} fill="url(#strip-fade)" />
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={0}
                x2={fixedW}
                y1={TOP_LINE_Y + i * HALF * 2}
                y2={TOP_LINE_Y + i * HALF * 2}
                stroke="currentColor"
                strokeOpacity={0.55}
              />
            ))}
            <Glyph name="clef" x={8} y={yOf(32)} />
            {signatureGlyphs(shownKey.fifths).map((g, i) => (
              <Glyph key={i} name={g.glyph} x={42 + i * SIG_GAP} y={yOf(g.step)} />
            ))}

            <line
              x1={width / 2}
              x2={width / 2}
              y1={8}
              y2={height - 8}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="6 5"
              strokeOpacity={0.7}
            />
          </svg>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Strip bookkeeping                                                          */
/* -------------------------------------------------------------------------- */

function itemWidth(item: StripItem): number {
  if (item.kind === "notes") return BEAT;
  const glyphs =
    cancelGlyphs(item.from, item.key).length + signatureGlyphs(item.key.fifths).length;
  return Math.max(BEAT, 36 + glyphs * SIG_GAP);
}

/** Generate items until the strip extends past `until`. */
function fill({
  placed,
  gen,
  settings,
  until,
  startX,
}: {
  placed: Placed[];
  gen: Generator;
  settings: GeneratorSettings;
  until: number;
  startX: number;
}): { placed: Placed[]; gen: Generator } {
  const last = placed.at(-1);
  const edge = last === undefined ? startX : last.x + last.w / 2;
  if (edge > until) return { placed, gen };
  const { item, state } = nextItem({ state: gen.state, settings, rng: gen.rng });
  const w = itemWidth(item);
  return fill({
    placed: [...placed, { id: gen.nextId, x: edge + w / 2, w, item }],
    gen: { ...gen, state, nextId: gen.nextId + 1 },
    settings,
    until,
    startX,
  });
}

/**
 * After a settings change, drop notes not yet on screen so new ones follow the
 * new settings; what the user can already see stays put. A changed fixed key
 * gets a key-change marker so the signature on the strip stays truthful.
 */
function truncateHidden({
  placed,
  gen,
  settings,
  offset,
  width,
}: {
  placed: Placed[];
  gen: Generator;
  settings: GeneratorSettings;
  offset: number;
  width: number;
}): { placed: Placed[]; gen: Generator } {
  const kept = placed.filter((p) => p.x - p.w / 2 <= offset + width);
  const lastNotes = kept.findLast((p) => p.item.kind === "notes")?.item;
  const lastStep =
    lastNotes?.kind === "notes" ? (lastNotes.pitches[0]?.step ?? null) : null;
  const lastKey = kept.at(-1)?.item.key ?? null;
  const key =
    settings.keyMode === "fixed" || lastKey === null ? settings.key : lastKey;

  if (lastKey === null || keysEqual(lastKey, key)) {
    return {
      placed: kept,
      gen: { ...gen, state: { ...gen.state, key, lastStep } },
    };
  }
  const marker: StripItem = { kind: "key", key, from: lastKey };
  const edge = kept.at(-1)!.x + kept.at(-1)!.w / 2;
  const w = itemWidth(marker);
  return {
    placed: [...kept, { id: gen.nextId, x: edge + w / 2, w, item: marker }],
    gen: {
      ...gen,
      state: { key, lastStep, sinceKeyChange: 0 },
      nextId: gen.nextId + 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Key signatures                                                             */
/* -------------------------------------------------------------------------- */

type GlyphName = keyof typeof GLYPHS;

// Treble-clef staff positions of the signature accidentals, in entry order.
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34]; // F C G D A E B
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31]; // B E A D G C F

function signatureGlyphs(fifths: number): { glyph: GlyphName; step: number }[] {
  if (fifths > 0) {
    return SHARP_STEPS.slice(0, fifths).map((step) => ({ glyph: "sharp", step }));
  }
  return FLAT_STEPS.slice(0, -fifths).map((step) => ({ glyph: "flat", step }));
}

/** Naturals cancelling accidentals of `from` that `to` no longer has. */
function cancelGlyphs(from: Key, to: Key): { glyph: GlyphName; step: number }[] {
  const [order, steps] =
    from.fifths > 0 ? [SHARP_ORDER, SHARP_STEPS] : [FLAT_ORDER, FLAT_STEPS];
  return order
    .slice(0, Math.abs(from.fifths))
    .flatMap((letter, i) =>
      keyAlter(to.fifths, letter) === 0
        ? [{ glyph: "natural" as const, step: steps[i]! }]
        : [],
    );
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                    */
/* -------------------------------------------------------------------------- */

function Glyph({
  name,
  x,
  y,
  className,
}: {
  name: GlyphName;
  x: number;
  y: number;
  className?: string;
}): React.JSX.Element {
  return (
    <path
      d={GLYPHS[name].d}
      transform={`translate(${x} ${y}) scale(${SCALE})`}
      fill="currentColor"
      className={className}
    />
  );
}

const ACCIDENTAL_GLYPH = {
  "-1": "flat",
  "0": "natural",
  "1": "sharp",
} satisfies Record<string, GlyphName>;

function ledgerSteps(lowest: number, highest: number): number[] {
  const below = Math.max(0, Math.floor((BOTTOM_STEP - lowest) / 2));
  const above = Math.max(0, Math.floor((highest - TOP_STEP) / 2));
  return [
    ...Array.from({ length: below }, (_, i) => BOTTOM_STEP - 2 * (i + 1)),
    ...Array.from({ length: above }, (_, i) => TOP_STEP + 2 * (i + 1)),
  ];
}

function NotesGlyphs({
  x,
  item,
  active,
  showNames,
  naming,
}: {
  x: number;
  item: Extract<StripItem, { kind: "notes" }>;
  active: boolean;
  showNames: boolean;
  naming: Naming;
}): React.JSX.Element {
  const steps = item.pitches.map((p) => p.step);
  const namesY = yOf(24) + 30;
  return (
    <g className={cn(active && "text-primary")}>
      {ledgerSteps(Math.min(...steps), Math.max(...steps)).map((step) => (
        <line
          key={step}
          x1={x - HEAD_W / 2 - 5}
          x2={x + HEAD_W / 2 + 5}
          y1={yOf(step)}
          y2={yOf(step)}
          stroke="currentColor"
          strokeOpacity={0.7}
        />
      ))}
      {item.pitches.map((pitch) => {
        const accidental = displayedAccidental(pitch, item.key);
        const y = yOf(pitch.step);
        return (
          <g key={pitch.step}>
            {accidental !== null && (
              <Glyph
                name={ACCIDENTAL_GLYPH[accidental]}
                x={x - HEAD_W / 2 - 4 - GLYPHS[ACCIDENTAL_GLYPH[accidental]].w * SCALE}
                y={y}
              />
            )}
            <Glyph name="notehead" x={x - HEAD_W / 2} y={y} />
          </g>
        );
      })}
      {showNames &&
        item.pitches.toReversed().map((pitch, i) => (
          <text
            key={pitch.step}
            x={x}
            y={namesY + i * 15}
            textAnchor="middle"
            fontSize={13}
            fontWeight={active ? 700 : 500}
            fill="currentColor"
            fillOpacity={active ? 1 : 0.7}
          >
            {pitchName(pitch, naming)}
          </text>
        ))}
    </g>
  );
}

function KeyChangeGlyphs({
  x,
  w,
  item,
  naming,
}: {
  x: number;
  w: number;
  item: Extract<StripItem, { kind: "key" }>;
  naming: Naming;
}): React.JSX.Element {
  const left = x - w / 2 + 10;
  const glyphs = [
    ...cancelGlyphs(item.from, item.key),
    ...signatureGlyphs(item.key.fifths),
  ];
  return (
    <g>
      {[0, 4].map((dx) => (
        <line
          key={dx}
          x1={left + dx}
          x2={left + dx}
          y1={yOf(TOP_STEP)}
          y2={yOf(BOTTOM_STEP)}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
      {glyphs.map((g, i) => (
        <Glyph key={i} name={g.glyph} x={left + 14 + i * SIG_GAP} y={yOf(g.step)} />
      ))}
      <text
        x={x}
        y={14}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill="var(--primary)"
      >
        {keyName(item.key, naming)}
      </text>
    </g>
  );
}
