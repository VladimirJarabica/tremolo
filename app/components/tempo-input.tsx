"use client";

import { useEffect, useState } from "react";

/**
 * Tempo field, edited as a local string so it can be emptied while typing
 * (important on mobile). It notifies the parent via `onUpdate` only when the
 * value is non-empty; an empty field self-heals to 120 on blur. The input is
 * `type="number" min={1}`, so the value is assumed to always be either empty or
 * a positive integer.
 *
 * The component is rendered only on the editing screen, so entering edit mode
 * mounts it fresh (the value seeds from `originalTempo` via `useState`). A
 * sheet switch while mounted is handled by the `[id]` effect re-seeding it.
 */
export function TempoInput({
  originalTempo,
  id,
  onUpdate,
}: {
  originalTempo: number;
  id: string;
  onUpdate: (tempo: number) => void;
}): React.JSX.Element {
  const [value, setValue] = useState(String(originalTempo));

  // Re-seed when switching sheets. Deliberately depends on `id` only, not
  // `originalTempo`: that prop also changes on every keystroke (via onUpdate ->
  // parent state), so tracking it here would blow away the user's in-progress
  // edit.
  useEffect(() => {
    setValue(String(originalTempo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleChange(next: string): void {
    setValue(next);
    if (next !== "") {
      onUpdate(Number.parseInt(next, 10));
    }
  }

  function commit(): void {
    // Hard fallback to 120 when the field is left empty.
    if (value === "") {
      setValue("120");
      onUpdate(120);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tempo" className="text-sm font-medium text-muted-foreground">
        Tempo
      </label>
      <input
        id="tempo"
        type="number"
        min={1}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-20 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm"
      />
      <span className="text-sm text-muted-foreground">BPM</span>
    </div>
  );
}
