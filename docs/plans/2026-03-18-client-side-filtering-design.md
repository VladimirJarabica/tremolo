# Client-Side Filtering Design

## Overview

Move sheet filtering from server-side to client-side. Backend returns all sheets at once; frontend handles filtering, search, and pagination in memory.

## Backend Changes

### `be/sheet/get-public-sheets.ts`

Simplify to return all sheets:

- Remove all filter parameters (meter, tempoRange, scale, search, tagIds)
- Remove pagination (page, offset, limit)
- Return `PublicSheetItem[]` directly (not wrapped in object)
- Keep tag fetching and combining logic

## Frontend Architecture

### New Hook: `useSearchParamsState`

Generic hook that syncs state to URL search params:

```tsx
function useSearchParamsState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void];

function useSearchParamsState<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize: (value: T) => string | null;
    deserialize: (value: string | null) => T;
  }
): [T, (value: T) => void];
```

- Simple strings work without options
- Complex types (arrays) provide serialize/deserialize

### Component: `SheetGrid` (Rewritten)

Client component with:

- Single fetch of all sheets on mount
- `fuse.js` for fuzzy text search on title/author (threshold 0.3)
- Local state via `useSearchParamsState` for all filters
- `useMemo` for derived filtered/sorted/paginated results

**Filtering logic:**
- Text search → fuse.js fuzzy match
- Meter/Scale → exact match
- Tempo range → numeric range check
- Tags → AND logic (sheet must have all selected tags)
- Order → sort by title or createdAt

**Pagination:**
- Slice: `filtered.slice((page - 1) * 10, page * 10)`
- Reset to page 1 when filters change

## File Changes

| File | Action |
|------|--------|
| `be/sheet/get-public-sheets.ts` | Simplify to return all sheets |
| `app/components/home/sheet-grid.tsx` | Rewrite as client component |
| `app/components/home/filters.tsx` | Delete (merged into sheet-grid) |
| `app/components/home/pagination.tsx` | Keep, simplify |
| `app/hooks/use-search-params-state.ts` | Create new hook |
| `package.json` | Add `fuse.js` |

## Expected Scale

< 500 sheets - client-side filtering will be snappy with no need for virtualization.
