"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import type { GetPublicSheetsInput } from "@/be/sheet/validation-schema";

export function HomeFilters({
  currentFilters,
  total,
}: {
  currentFilters: GetPublicSheetsInput;
  total: number;
}): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);

      // Don't save default values to URL
      const defaults: Record<string, string> = {
        orderBy: "createdAt",
        order: "desc",
        page: "1",
      };

      if (value === null || value === "" || value === defaults[key]) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Reset to page 1 when filter changes
      if (key !== "page") {
        params.delete("page");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("?", { scroll: false });
  }, [router]);

  const hasFilters =
    currentFilters.search ||
    currentFilters.meter ||
    currentFilters.tempoRange ||
    currentFilters.scale;

  return (
    <div className="border-b border-zinc-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={currentFilters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value || null)}
            className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 text-sm focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {/* Order */}
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
          <button
            type="button"
            onClick={() => updateFilter("orderBy", "title")}
            className={`px-3 py-2 text-sm transition-colors ${
              currentFilters.orderBy === "title"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Name
          </button>
          <button
            type="button"
            onClick={() => updateFilter("orderBy", "createdAt")}
            className={`px-3 py-2 text-sm transition-colors ${
              currentFilters.orderBy === "title"
                ? "bg-white text-zinc-600 hover:bg-zinc-50"
                : "bg-zinc-900 text-white"
            }`}
          >
            Date
          </button>
        </div>

        {/* Meter filter */}
        <select
          value={currentFilters.meter ?? ""}
          onChange={(e) => updateFilter("meter", e.target.value || null)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
        >
          <option value="">All meters</option>
          <option value="m_4_4">4/4</option>
          <option value="m_3_4">3/4</option>
          <option value="m_2_4">2/4</option>
          <option value="m_6_8">6/8</option>
          <option value="m_3_8">3/8</option>
          <option value="m_2_2">2/2</option>
        </select>

        {/* Tempo range filter */}
        <select
          value={currentFilters.tempoRange ?? ""}
          onChange={(e) => updateFilter("tempoRange", e.target.value || null)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
        >
          <option value="">All tempos</option>
          <option value="slow">Slow (up to 80)</option>
          <option value="medium">Medium (80-140)</option>
          <option value="fast">Fast (140+)</option>
        </select>

        {/* Scale filter */}
        <select
          value={currentFilters.scale ?? ""}
          onChange={(e) => updateFilter("scale", e.target.value || null)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
        >
          <option value="">All scales</option>
          <optgroup label="Major - Sharps">
            <option value="C">C Major</option>
            <option value="G">G Major</option>
            <option value="D">D Major</option>
            <option value="A">A Major</option>
            <option value="E">E Major</option>
            <option value="B">B Major</option>
            <option value="Fs">F# Major</option>
            <option value="Cs">C# Major</option>
          </optgroup>
          <optgroup label="Major - Flats">
            <option value="F">F Major</option>
            <option value="Bb">Bb Major</option>
            <option value="Eb">Eb Major</option>
            <option value="Ab">Ab Major</option>
            <option value="Db">Db Major</option>
            <option value="Gb">Gb Major</option>
            <option value="Cb">Cb Major</option>
          </optgroup>
          <optgroup label="Minor - Sharps">
            <option value="Am">A minor</option>
            <option value="Em">E minor</option>
            <option value="Bm">B minor</option>
            <option value="Fsm">F# minor</option>
            <option value="Csm">C# minor</option>
            <option value="Gsm">G# minor</option>
            <option value="Dsm">D# minor</option>
            <option value="Asm">A# minor</option>
          </optgroup>
          <optgroup label="Minor - Flats">
            <option value="Dm">D minor</option>
            <option value="Gm">G minor</option>
            <option value="Cm">C minor</option>
            <option value="Fm">F minor</option>
            <option value="Bbm">Bb minor</option>
            <option value="Ebm">Eb minor</option>
            <option value="Abm">Ab minor</option>
          </optgroup>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-sm text-zinc-500">{total} sheets</span>
      </div>
    </div>
  );
}
