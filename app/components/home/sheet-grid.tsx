"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";

import { getAllSheets } from "@/app/actions/get-all-sheets";
import { useSearchParamsState } from "@/app/hooks/use-search-params-state";
import type { SheetItem } from "@/be/sheet/get-all-sheets";
import { Pagination } from "./pagination";

const ITEMS_PER_PAGE = 20;

const tempoRanges = {
  slow: { min: 0, max: 80 },
  medium: { min: 80, max: 140 },
  fast: { min: 140, max: 999 },
} as const;

export function SheetGrid(): React.JSX.Element {
  // Filter state synced to URL
  const [searchInput, setSearchInput] = useSearchParamsState("search", "");
  const [search, setSearch] = useState("");
  const [meter, setMeter] = useSearchParamsState("meter", "");
  const [tempoRange, setTempoRange] = useSearchParamsState("tempoRange", "");
  const [scale, setScale] = useSearchParamsState("scale", "");
  const [orderBy, setOrderBy] = useSearchParamsState<"createdAt" | "title">(
    "orderBy",
    "createdAt" as const,
    {
      deserialize: (v) => (v === "title" ? "title" : "createdAt"),
    },
  );
  const [page, setPage] = useSearchParamsState<string>("page", "1", {
    serialize: (v) => (v === "1" ? null : v),
  });

  // Debounced search
  const debouncedSetSearch = useDebouncedCallback(setSearch, { wait: 500 });
  useEffect(() => {
    debouncedSetSearch(searchInput);
  }, [searchInput, debouncedSetSearch]);

  // Fetch data with React Query
  const { data: sheetsResult, isLoading: sheetsLoading } = useQuery({
    queryKey: ["sheets"],
    queryFn: getAllSheets,
  });
  const sheets = useMemo(
    () => (sheetsResult?.success ? sheetsResult.data : []),
    [sheetsResult],
  );

  // Fuse instance for search
  const fuse = useMemo(
    () =>
      new Fuse(sheets, {
        keys: ["title", "author"],
        threshold: 0.3,
      }),
    [sheets],
  );

  // Derived filtered + sorted + paginated results
  const filtered = useMemo(() => {
    let result = sheets;

    // Text search with fuse.js
    if (search) {
      result = fuse.search(search).map((r) => r.item);
    }

    // Filter by meter
    if (meter) {
      result = result.filter((s) => s.meter === meter);
    }

    // Filter by tempo range
    if (tempoRange) {
      const range = tempoRanges[tempoRange as keyof typeof tempoRanges];
      result = result.filter(
        (s) => s.tempo >= range.min && s.tempo <= range.max,
      );
    }

    // Filter by scale
    if (scale) {
      result = result.filter((s) => s.scale === scale);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (orderBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return result;
  }, [sheets, search, meter, tempoRange, scale, orderBy, fuse]);

  // Paginated slice
  const pageNum = parseInt(page, 10) || 1;
  const paginated = useMemo(
    () =>
      filtered.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE),
    [filtered, pageNum],
  );

  // Reset page when filters change
  useEffect(() => {
    if (pageNum !== 1) {
      setPage("1");
    }
  }, [search, meter, tempoRange, scale, orderBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setMeter("");
    setTempoRange("");
    setScale("");
    setOrderBy("createdAt");
    setPage("1");
  }, [
    setSearchInput,
    setMeter,
    setTempoRange,
    setScale,
    setOrderBy,
    setPage,
  ]);

  const hasFilters = search || meter || tempoRange || scale;

  if (sheetsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <div className="border-b border-border backdrop-blur-sm bg-card/60 p-4 sticky top-14 z-10">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all"
            />
          </div>

          {/* Order */}
          <div className="flex rounded-xl border border-border overflow-hidden shadow-sm bg-card/80">
            <button
              type="button"
              onClick={() => setOrderBy("title")}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                orderBy === "title"
                  ? "bg-brand-gradient text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              Name
            </button>
            <button
              type="button"
              onClick={() => setOrderBy("createdAt")}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                orderBy === "title"
                  ? "bg-transparent text-muted-foreground hover:bg-muted"
                  : "bg-brand-gradient text-primary-foreground shadow-sm"
              }`}
            >
              Date
            </button>
          </div>

          {/* Meter filter */}
          <select
            value={meter}
            onChange={(e) => setMeter(e.target.value)}
            className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all cursor-pointer"
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
            value={tempoRange}
            onChange={(e) => setTempoRange(e.target.value)}
            className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">All tempos</option>
            <option value="slow">Slow (up to 80)</option>
            <option value="medium">Medium (80-140)</option>
            <option value="fast">Fast (140+)</option>
          </select>

          {/* Scale filter */}
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all cursor-pointer"
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
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          {/* Count */}
          <span className="ml-auto text-sm font-medium text-muted-foreground">
            {filtered.length} sheets
          </span>
        </div>
      </div>

      {/* Sheet list */}
      <div className="overflow-auto p-4">
        {paginated.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No sheets found
          </div>
        ) : (
          <div className="grid gap-3">
            {paginated.map((sheet) => (
              <SheetListItem key={sheet.id} sheet={sheet} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pageNum}
        total={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={(p) => setPage(String(p))}
      />
    </div>
  );
}

function SheetListItem({ sheet }: { sheet: SheetItem }): React.JSX.Element {
  return (
    <Link
      href={`/sheet/${sheet.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-input hover:bg-card"
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
          {sheet.title || "Untitled"}
        </h3>
        {sheet.author && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {sheet.author}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground font-medium">
        <span className="px-2 py-1 rounded-lg bg-muted">
          {formatMeter(sheet.meter)}
        </span>
        <span className="px-2 py-1 rounded-lg bg-muted">
          {sheet.tempo} BPM
        </span>
        <span className="px-2 py-1 rounded-lg bg-muted">
          {formatScale(sheet.scale)}
        </span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {format(sheet.createdAt, "d. MMM yyyy")}
      </span>
    </Link>
  );
}

function formatMeter(meter: string): string {
  return meter.replace("m_", "").replace("_", "/");
}

function formatScale(scale: string): string {
  const replacements: Record<string, string> = {
    Fs: "F#",
    Cs: "C#",
    Fsm: "F#m",
    Csm: "C#m",
    Gsm: "G#m",
    Dsm: "D#m",
    Asm: "A#m",
    Bb: "Bb",
    Eb: "Eb",
    Ab: "Ab",
    Db: "Db",
    Gb: "Gb",
    Cb: "Cb",
    Bbm: "Bbm",
    Ebm: "Ebm",
    Abm: "Abm",
  };
  return replacements[scale] ?? scale;
}
