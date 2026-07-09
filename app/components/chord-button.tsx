"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Fixed set of qualities offered for every chord root, in display order. The
 * `suffix` is appended to the root to form the ABC chord symbol.
 */
const CHORD_QUALITIES = [
  { key: "major", label: "Major", suffix: "" },
  { key: "minor", label: "Minor", suffix: "m" },
  { key: "seventh", label: "Seventh", suffix: "7" },
  { key: "diminished", label: "Diminished", suffix: "°" },
  { key: "augmented", label: "Augmented", suffix: "+" },
] as const;

/**
 * A chord-root trigger that opens a dropdown of qualities. Selecting one calls
 * `onSelect` with the resulting chord symbol (e.g. "C", "Dm", "G7", "A°",
 * "E+").
 */
export function ChordButton({
  root,
  onSelect,
}: {
  root: string;
  onSelect: (symbol: string) => void;
}): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Insert ${root} chord`}
          title={`${root} chords`}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-all hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {root}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[9.5rem]">
        {CHORD_QUALITIES.map((q) => {
          const symbol = `${root}${q.suffix}`;
          return (
            <DropdownMenuItem
              key={q.key}
              // `onClick` (not Radix `onSelect`) so the symbol is captured before
              // the menu closes; the menu still dismisses on selection.
              onClick={() => onSelect(symbol)}
            >
              <span className="font-mono">{symbol}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {q.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
