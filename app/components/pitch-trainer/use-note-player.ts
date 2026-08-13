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

function readStoredVolume(): number {
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return VOLUME_DEFAULT;
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value)) return VOLUME_DEFAULT;
    return Math.min(100, Math.max(0, value));
  } catch {
    return VOLUME_DEFAULT;
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
} {
  const renderElRef = useRef<HTMLDivElement | null>(null);
  const bufferRef = useRef<abcjs.MidiBuffer | null>(null);
  const lastAbcRef = useRef<string>("");
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
            options: { soundFontVolumeMultiplier: readStoredVolume() / 100 },
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

  return { play, stop, isPlaying };
}
