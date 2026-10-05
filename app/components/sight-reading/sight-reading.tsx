"use client";

import { Eye, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import type { Naming, NoteType } from "@/app/utils/sight-reading";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ACCORDION_HIGH,
  ACCORDION_LOW,
  KEY_FIFTHS,
  keyName,
  stepLabel,
  stepOf,
} from "@/app/utils/sight-reading";
import { cn } from "@/lib/utils";

import { NoteStrip } from "./note-strip";
import { useSightReadingSettings } from "./use-sight-reading-settings";

export function SightReading(): React.JSX.Element {
  const [settings, update] = useSightReadingSettings();
  const [running, setRunning] = useState(false);
  // Bumping the run id remounts the strip, restarting it empty.
  const [runId, setRunId] = useState(0);

  function handleRestart(): void {
    setRunId((id) => id + 1);
    setRunning(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.code !== "Space") return;
      // Buttons/inputs handle Space themselves; toggling here too would double-fire.
      const target = e.target as HTMLElement | null;
      if (
        target !== null &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
          target.isContentEditable ||
          target.getAttribute("role") === "slider" ||
          target.getAttribute("role") === "switch")
      ) {
        return;
      }
      e.preventDefault();
      setRunning((r) => !r);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const rangeSteps = Array.from(
    { length: ACCORDION_HIGH - ACCORDION_LOW + 1 },
    (_, i) => ACCORDION_LOW + i,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-14 z-10 border-b border-border bg-card/60 px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-gradient p-2 shadow-md shadow-primary/30">
            <Eye className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">Sight Reading</h2>
            <p className="text-xs text-muted-foreground">
              Play each note as it crosses the line.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
            <NoteStrip
              key={runId}
              settings={settings}
              tempo={settings.tempo}
              running={running}
              showNames={settings.showNames}
              naming={settings.naming}
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                >
                  {running ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Restart"
                  aria-label="Restart"
                  className="rounded-xl border border-border p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Tempo
                </span>
                <Slider
                  value={[settings.tempo]}
                  min={20}
                  max={200}
                  step={5}
                  onValueChange={(v) => update({ tempo: v[0] ?? settings.tempo })}
                  aria-label="Tempo"
                  className="w-40"
                />
                <span className="min-w-[4.5rem] font-mono text-xs tabular-nums text-muted-foreground">
                  {settings.tempo} BPM
                </span>
              </div>
            </div>
            <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
              Press <Kbd>Space</Kbd> to start / pause.
            </p>
          </section>

          <section className="grid gap-5 rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:grid-cols-2">
            <Field label="Range">
              <div className="flex items-center gap-2">
                <StepSelect
                  label="From"
                  value={settings.low}
                  steps={rangeSteps}
                  naming={settings.naming}
                  onChange={(low) =>
                    update({ low, high: Math.max(low, settings.high) })
                  }
                />
                <span className="text-muted-foreground">–</span>
                <StepSelect
                  label="To"
                  value={settings.high}
                  steps={rangeSteps}
                  naming={settings.naming}
                  onChange={(high) =>
                    update({ high, low: Math.min(high, settings.low) })
                  }
                />
              </div>
            </Field>

            <Field label="Key">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Key"
                  value={`${settings.key.fifths}:${settings.key.mode}`}
                  onChange={(e) => {
                    const [fifths, mode] = e.target.value.split(":");
                    update({
                      key: {
                        fifths: Number(fifths),
                        mode: mode === "minor" ? "minor" : "major",
                      },
                    });
                  }}
                  className={SELECT_CLASS}
                >
                  {(["major", "minor"] as const).map((mode) => (
                    <optgroup key={mode} label={mode === "major" ? "Major" : "Minor"}>
                      {KEY_FIFTHS.map((fifths) => (
                        <option key={fifths} value={`${fifths}:${mode}`}>
                          {keyName({ fifths, mode }, settings.naming)}
                          {fifths === 0 ? "" : ` (${Math.abs(fifths)}${fifths > 0 ? "♯" : "♭"})`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <OptionToggle
                  active={settings.keyMode === "fixed"}
                  onClick={() => update({ keyMode: "fixed" })}
                >
                  Fixed
                </OptionToggle>
                <OptionToggle
                  active={settings.keyMode === "changing"}
                  onClick={() => update({ keyMode: "changing" })}
                >
                  Changing
                </OptionToggle>
              </div>
              {settings.keyMode === "changing" && (
                <div className="mt-3 space-y-3">
                  <SliderRow
                    label="Change every"
                    value={settings.changeEvery}
                    min={4}
                    max={64}
                    step={4}
                    display={`${settings.changeEvery} notes`}
                    onChange={(changeEvery) => update({ changeEvery })}
                  />
                  <SliderRow
                    label="Up to"
                    value={settings.maxKeyFifths}
                    min={1}
                    max={6}
                    step={1}
                    display={`${settings.maxKeyFifths} ♯/♭`}
                    onChange={(maxKeyFifths) => update({ maxKeyFifths })}
                  />
                </div>
              )}
            </Field>

            <Field label="Notes">
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TYPES.map(({ type, label }) => (
                  <OptionToggle
                    key={type}
                    active={settings.noteTypes.includes(type)}
                    onClick={() => {
                      const active = settings.noteTypes.includes(type);
                      if (active && settings.noteTypes.length === 1) return;
                      update({
                        noteTypes: active
                          ? settings.noteTypes.filter((t) => t !== type)
                          : [...settings.noteTypes, type],
                      });
                    }}
                  >
                    {label}
                  </OptionToggle>
                ))}
              </div>
              <div className="mt-3">
                <SliderRow
                  label="Accidentals"
                  value={Math.round(settings.accidentalChance * 100)}
                  min={0}
                  max={50}
                  step={5}
                  display={
                    settings.accidentalChance === 0
                      ? "Off"
                      : `${Math.round(settings.accidentalChance * 100)} %`
                  }
                  onChange={(v) => update({ accidentalChance: v / 100 })}
                />
              </div>
            </Field>

            <Field label="Melody">
              <SliderRow
                label="Leaps"
                value={Math.round(settings.leapChance * 100)}
                min={0}
                max={100}
                step={10}
                display={
                  settings.leapChance === 0
                    ? "Steps only"
                    : `${Math.round(settings.leapChance * 100)} %`
                }
                onChange={(v) => update({ leapChance: v / 100 })}
              />
              <div
                className={cn(
                  "mt-3 flex flex-wrap items-center gap-1.5",
                  settings.leapChance === 0 && "pointer-events-none opacity-40",
                )}
              >
                <span className="mr-1 text-sm text-muted-foreground">
                  Max leap
                </span>
                {LEAPS.map(({ value, label }) => (
                  <OptionToggle
                    key={value}
                    active={settings.maxLeap === value}
                    onClick={() => update({ maxLeap: value })}
                  >
                    {label}
                  </OptionToggle>
                ))}
              </div>
            </Field>

            <Field label="Display">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={settings.showNames}
                  onCheckedChange={(showNames) => update({ showNames })}
                />
                Show note names
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-sm text-muted-foreground">
                  Naming
                </span>
                <OptionToggle
                  active={settings.naming === "german"}
                  onClick={() => update({ naming: "german" })}
                >
                  C D … A H
                </OptionToggle>
                <OptionToggle
                  active={settings.naming === "english"}
                  onClick={() => update({ naming: "english" })}
                >
                  C D … A B
                </OptionToggle>
              </div>
            </Field>
          </section>
        </div>
      </div>
    </div>
  );
}

const SELECT_CLASS =
  "cursor-pointer rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground shadow-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

const NOTE_TYPES = [
  { type: "single", label: "Single" },
  { type: "third", label: "3rds" },
  { type: "sixth", label: "6ths" },
  { type: "octave", label: "Octaves" },
  { type: "triad", label: "Triads" },
] satisfies { type: NoteType; label: string }[];

const LEAPS = [
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: 5, label: "5th" },
  { value: 6, label: "6th" },
  { value: 8, label: "Octave" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}

function StepSelect({
  label,
  value,
  steps,
  naming,
  onChange,
}: {
  label: string;
  value: number;
  steps: number[];
  naming: Naming;
  onChange: (step: number) => void;
}): React.JSX.Element {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={SELECT_CLASS}
    >
      {steps.map((step) => (
        <option key={step} value={step}>
          {stepLabel(step, naming)}
          {step === stepOf(0, 4) ? " (middle C)" : ""}
        </option>
      ))}
    </select>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
        aria-label={label}
        className="flex-1"
      />
      <span className="min-w-[5rem] text-right font-mono text-xs tabular-nums text-muted-foreground">
        {display}
      </span>
    </div>
  );
}

function OptionToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all active:scale-95",
        active
          ? "border-transparent bg-brand-gradient text-primary-foreground shadow-sm shadow-primary/30"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <kbd className="rounded border border-border bg-muted px-1 py-px font-mono text-[0.65rem] text-foreground">
      {children}
    </kbd>
  );
}
