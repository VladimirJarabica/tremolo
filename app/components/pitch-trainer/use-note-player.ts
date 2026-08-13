"use client";

import abcjs from "abcjs";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Volume preference is shared app-wide with {@link AbcViewer} (the sheet
 * player) so a user's volume choice carries over. Stored 0–100; abcjs takes a
 * `soundFontVolumeMultiplier` (0–1+). try/catch-guarded for private mode etc.
 */
const VOLUME_STORAGE_KEY = "tremolo:volume";
const VOLUME_DEFAULT = 100;

function readStoredVolume(): number | null {
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return null;
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value)) return null;
    return Math.min(100, Math.max(0, value));
  } catch {
    return null;
  }
}

function writeStoredVolume(value: number): void {
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
  } catch {
    // Ignore storage errors (private mode, quota, disabled storage).
  }
}

/**
 * Plays an arbitrary ABC string on demand for the pitch trainer.
 *
 * Unlike {@link AbcViewer} (which renders a full SynthController player UI),
 * this is a fire-and-forget "play this note now" primitive: it renders the ABC
 * into an off-screen container to obtain the `visualObj`, then drives a
 * `CreateSynth` (MidiBuffer) directly. This gives the same piano timbre and
 * volume handling as the rest of the app without leaking any UI.
 *
 * The AudioContext must be resumed from a user gesture; the component only ever
 * invokes `play` from a click handler, so the first play unlocks audio and all
 * later (incl. auto-advance) plays succeed.
 */
export function useNotePlayer(): {
  play: (abc: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  /** Master volume 0–100, shared with the sheet player via `tremolo:volume`. */
  volume: number;
  setVolume: (value: number) => void;
} {
  const renderElRef = useRef<HTMLDivElement | null>(null);
  const bufferRef = useRef<abcjs.MidiBuffer | null>(null);
  const lastAbcRef = useRef<string>("");
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState<number>(VOLUME_DEFAULT);
  // Ref mirror of `volume` so `play` reads the latest level without being a
  // dependency (and without re-reading localStorage). Kept in sync in the
  // restore effect and `setVolume`.
  const volumeRef = useRef<number>(VOLUME_DEFAULT);

  // Restore the previously saved volume after mount (kept out of the useState
  // initializer so SSR output stays consistent — mirrors {@link AbcViewer}).
  // The ref write alongside setState is what makes this an external-sync
  // effect rather than a flagged pure state derivation.
  useEffect(() => {
    const stored = readStoredVolume();
    if (stored !== null) {
      volumeRef.current = stored;
      setVolumeState(stored);
    }
  }, []);

  const setVolume = useCallback((value: number): void => {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    volumeRef.current = clamped;
    writeStoredVolume(clamped);
    setVolumeState(clamped);
    // The buffer is initialised with a volume multiplier, so force a re-init on
    // the next play to make the new level take effect (even when replaying the
    // same note).
    lastAbcRef.current = "";
  }, []);

  // Lazily create a single off-screen container for rendering ABC to a
  // visualObj. abcjs sizes via the element, so it needs a real (hidden) node.
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.style.width = "400px";
    el.style.height = "200px";
    el.style.pointerEvents = "none";
    el.style.opacity = "0";
    document.body.appendChild(el);
    renderElRef.current = el;

    return () => {
      document.body.removeChild(el);
      renderElRef.current = null;
    };
  }, []);

  const clearEndTimer = useCallback(() => {
    if (endTimerRef.current !== null) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearEndTimer();
    const buffer = bufferRef.current;
    if (buffer !== null) {
      try {
        buffer.pause();
      } catch {
        // ignore — buffer may already be stopped
      }
    }
    setIsPlaying(false);
  }, [clearEndTimer]);

  const play = useCallback(
    async (abc: string): Promise<void> => {
      const el = renderElRef.current;
      if (el === null || !abcjs.synth.supportsAudio()) {
        return;
      }

      // Browsers require a user gesture to start audio; resume if suspended.
      // After the first resume, subsequent (auto-advance) plays are allowed.
      try {
        const ac = abcjs.synth.activeAudioContext();
        if (ac.state !== "running") {
          await ac.resume();
        }
      } catch {
        // ignore and attempt playback anyway
      }

      clearEndTimer();

      // Reuse a single MidiBuffer instance; re-init only when the ABC changes
      // so "play again" of the same note is cheap.
      const buffer = bufferRef.current ?? new abcjs.synth.CreateSynth();
      bufferRef.current = buffer;

      try {
        if (abc !== lastAbcRef.current) {
          el.innerHTML = "";
          const visualObj = abcjs.renderAbc(el, abc, {
            responsive: "resize",
          })[0];
          if (visualObj === undefined) {
            return;
          }
          await buffer.init({
            visualObj,
            options: { soundFontVolumeMultiplier: volumeRef.current / 100 },
          });
          lastAbcRef.current = abc;
        }

        // prime() rebuilds the offline buffer so the note can replay; it
        // resolves with the scheduled duration in seconds.
        const { duration } = await buffer.prime();
        buffer.start();
        setIsPlaying(true);

        const ms = Math.max(400, Math.round(duration * 1000) + 150);
        endTimerRef.current = setTimeout(() => {
          endTimerRef.current = null;
          setIsPlaying(false);
        }, ms);
      } catch {
        setIsPlaying(false);
      }
    },
    [clearEndTimer],
  );

  // Tear down on unmount: stop playback and clear timers.
  useEffect(() => {
    return () => {
      if (endTimerRef.current !== null) {
        clearTimeout(endTimerRef.current);
      }
      const buffer = bufferRef.current;
      if (buffer !== null) {
        try {
          buffer.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { play, stop, isPlaying, volume, setVolume };
}
