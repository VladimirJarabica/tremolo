"use client";

import type { GetPublicSheetsInput } from "@/be/sheet/validation-schema";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function HomeFilters({
  currentFilters,
  total,
  tags,
}: {
  currentFilters: GetPublicSheetsInput;
  total: number;
  tags: { id: string; name: string }[];
}): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for search input
  const [searchValue, setSearchValue] = useState(currentFilters.search ?? "");

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

  const toggleTag = useCallback(
    (tagId: string) => {
      const params = new URLSearchParams(searchParams);
      const currentTags = params.getAll("tagIds");
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter((t) => t !== tagId)
        : [...currentTags, tagId];

      params.delete("tagIds");
      for (const tag of newTags) {
        params.append("tagIds", tag);
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("?", { scroll: false });
  }, [router]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      updateFilter("search", value || null);
    },
    { wait: 500 },
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const hasFilters =
    currentFilters.search ||
    currentFilters.meter ||
    currentFilters.tempoRange ||
    currentFilters.scale ||
    (currentFilters.tagIds && currentFilters.tagIds.length > 0);

  const selectedTagIds = currentFilters.tagIds ?? [];

  return (
    <div className="border-b border-[oklch(0.92_0.02_160)] backdrop-blur-sm bg-white/60 p-4 sticky top-14 z-10">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.5_0.06_160)]" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 py-2 pl-10 pr-4 text-sm text-[oklch(0.25_0.02_160)] placeholder:text-[oklch(0.55_0.03_160)] shadow-sm focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all"
          />
        </div>

        {/* Order */}
        <div className="flex rounded-xl border border-[oklch(0.92_0.02_160)] overflow-hidden shadow-sm bg-white/80">
          <button
            type="button"
            onClick={() => {
              updateFilter("orderBy", "title");
            }}
            className={`px-3 py-2 text-sm font-medium transition-all ${
              currentFilters.orderBy === "title"
                ? "bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-white shadow-sm"
                : "bg-transparent text-[oklch(0.45_0.04_160)] hover:bg-[oklch(0.96_0.02_160)]"
            }`}
          >
            Name
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("orderBy", "createdAt");
            }}
            className={`px-3 py-2 text-sm font-medium transition-all ${
              currentFilters.orderBy === "title"
                ? "bg-transparent text-[oklch(0.45_0.04_160)] hover:bg-[oklch(0.96_0.02_160)]"
                : "bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-white shadow-sm"
            }`}
          >
            Date
          </button>
        </div>

        {/* Meter filter */}
        <select
          value={currentFilters.meter ?? ""}
          onChange={(e) => updateFilter("meter", e.target.value || null)}
          className="rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.35_0.04_160)] shadow-sm focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all cursor-pointer"
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
          className="rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.35_0.04_160)] shadow-sm focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all cursor-pointer"
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
          className="rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.35_0.04_160)] shadow-sm focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all cursor-pointer"
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

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="flex flex-wrap max-w-62 items-center gap-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-white shadow-md shadow-[oklch(0.55_0.18_160/0.25)]"
                    : "bg-white/80 text-[oklch(0.4_0.05_160)] border border-[oklch(0.92_0.02_160)] shadow-sm hover:border-[oklch(0.7_0.08_160)] hover:shadow-md"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-[oklch(0.45_0.05_160)] hover:bg-[oklch(0.96_0.02_160)] transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-sm font-medium text-[oklch(0.45_0.05_160)]">{total} sheets</span>
      </div>
    </div>
  );
}
