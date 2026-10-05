"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

import type { GeneratorSettings, Naming } from "@/app/utils/sight-reading";
import {
  ACCORDION_HIGH,
  ACCORDION_LOW,
  stepOf,
} from "@/app/utils/sight-reading";

export interface SightReadingSettings extends GeneratorSettings {
  tempo: number;
  showNames: boolean;
  naming: Naming;
}

const DEFAULTS: SightReadingSettings = {
  tempo: 60,
  low: stepOf(0, 4),
  high: stepOf(0, 6),
  key: { fifths: 0, mode: "major" },
  keyMode: "fixed",
  changeEvery: 16,
  maxKeyFifths: 3,
  accidentalChance: 0,
  leapChance: 0.3,
  maxLeap: 5,
  noteTypes: ["single"],
  showNames: false,
  naming: "german",
};

const step = z.number().int().min(ACCORDION_LOW).max(ACCORDION_HIGH);

// Each field falls back to its default on its own, so one stale/invalid value
// in storage doesn't throw away the rest of the user's setup.
const storedSchema = z.object({
  tempo: z.number().min(20).max(240).catch(DEFAULTS.tempo),
  low: step.catch(DEFAULTS.low),
  high: step.catch(DEFAULTS.high),
  key: z
    .object({
      fifths: z.number().int().min(-6).max(6),
      mode: z.enum(["major", "minor"]),
    })
    .catch(DEFAULTS.key),
  keyMode: z.enum(["fixed", "changing"]).catch(DEFAULTS.keyMode),
  changeEvery: z.number().int().min(1).max(256).catch(DEFAULTS.changeEvery),
  maxKeyFifths: z.number().int().min(0).max(6).catch(DEFAULTS.maxKeyFifths),
  accidentalChance: z
    .number()
    .min(0)
    .max(1)
    .catch(DEFAULTS.accidentalChance),
  leapChance: z.number().min(0).max(1).catch(DEFAULTS.leapChance),
  maxLeap: z.number().int().min(2).max(8).catch(DEFAULTS.maxLeap),
  noteTypes: z
    .array(z.enum(["single", "third", "sixth", "octave", "triad"]))
    .min(1)
    .catch(DEFAULTS.noteTypes),
  showNames: z.boolean().catch(DEFAULTS.showNames),
  naming: z.enum(["english", "german"]).catch(DEFAULTS.naming),
});

const STORAGE_KEY = "tremolo:sight-reading:settings";

/**
 * Settings live in a tiny external store read via `useSyncExternalStore`
 * (same approach as the pitch trainer): the server snapshot is the defaults,
 * so hydration never mismatches, and localStorage I/O stays out of effects.
 */
const store = {
  value: DEFAULTS,
  initialized: false,
  listeners: new Set<() => void>(),
};

function readStored(): SightReadingSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULTS;
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function getSnapshot(): SightReadingSettings {
  if (!store.initialized && typeof window !== "undefined") {
    store.initialized = true;
    store.value = readStored();
  }
  return store.value;
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function update(patch: Partial<SightReadingSettings>): void {
  store.value = { ...store.value, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.value));
  } catch {
    // Storage unavailable (private mode, quota) — settings still apply in-session.
  }
  store.listeners.forEach((listener) => listener());
}

export function useSightReadingSettings(): [
  SightReadingSettings,
  (patch: Partial<SightReadingSettings>) => void,
] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS);
  return [settings, update];
}
