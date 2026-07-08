# Visual & UX Review — Implementation Plan

Date: 2026-07-07

## Overview

Implements the findings of the 2026-07-07 visual/UX review. The codebase has
**three competing visual systems** in one app:

- **System A** — shadcn semantic tokens (`bg-primary`, `border-border`,
  `text-muted-foreground`…). Used **only** in `components/ui/*`.
- **System B** — raw `oklch()` "Forest Mist" literals. **312 occurrences** in
  `app/components/**`.
- **System C** — Tailwind `zinc`/`red`/`blue` palette. Used on the List page,
  Trash page, Multi-Viewer, loading skeletons, and the duplicate
  `NewSheetButton`.

Plus: the editor is a bare `<textarea>` with no visual aids, dark mode is
defined-but-never-toggled, radii/spacing are ad-hoc, and 7 native
`alert()`/`confirm()` dialogs break the aesthetic.

This plan consolidates to one token-based system, standardizes layout
primitives, makes editing sheet-oriented, and ships dark mode and a
sheet-first home. Each phase is independently shippable as one PR.

### Evidence (measured 2026-07-07)

| Metric | Value |
|---|---|
| Raw `oklch()` literals in `app/components` | 312 |
| Files using `zinc-*` (off-theme) | 9 |
| Native `alert()`/`confirm()` calls | 7 |
| Distinct `rounded-*` values in use | 6 (`sm`,`md`,`lg`,`xl`,`2xl`,`full`) |
| Distinct spacing values in editor alone | ~14 |
| `dark` class toggled anywhere | **no** |

### Non-goals (explicitly out of scope)

- Backend, schema, or migration changes (none required).
- New entity model (e.g. sharing/public visibility) — see `docs/CODE_REVIEW.md`.
- abcjs render performance — not an issue.
- The "ideas" backlog (templates, practice mode, setlist/performance view,
  target-key transpose, consolidated print stylesheet) is captured in
  **§Future** at the end; not committed here.

---

## Scope

| # | Phase | Files | New deps | Effort | Risk |
|---|-------|-------|----------|--------|------|
| 0 | Design-token foundation | `globals.css`, all `app/components/**` | none | L | M |
| 1 | Unify zinc surfaces onto tokens | `list-detail`, `sortable-list-card`, `multi-abc-viewer`, `trash`, `sheet-editor` dup, skeletons, dialogs | none | S | L |
| 2 | Radius / spacing / shadow / border scale | `globals.css`, component sweep | none | S | L |
| 3 | Replace native `alert`/`confirm` | new `components/ui/confirm-dialog.tsx`, `sonner` (decision) | maybe `sonner` | S | L |
| 4 | Sheet-oriented editor | `sheet-editor`, `sheet-detail`, new toolbar/cheat-sheet | none (Popover via `radix-ui`) | L | M |
| 5 | Wire up dark mode | new `theme-provider`, `user-menu`, `globals.css` `.dark` | `next-themes` | S | L |
| 6 | Sheet-first home | `home/sheet-grid` | none | M | M |

Effort: S/M/L · Risk: L/M/H

---

## Phase 0 — Design-token foundation

### Goal

Make semantic tokens (`bg-primary`, `border-border`, `text-muted-foreground`)
the single source of truth in `app/components/**`. Eliminate raw `oklch()`
literals and the `zinc/red/blue` palette from app code. This unblocks every
later phase and turns re-theming from a 312-site find/replace into editing
`globals.css`.

### Why not just "use existing tokens"

The `@theme inline` map in `globals.css` already exposes Tailwind utilities
(`bg-primary`, `border-border`, …) and `components/ui/button.tsx` already uses
them correctly — so this is **migration**, not infrastructure. Two gaps to fill
first:

1. **Brand gradient.** Buttons use `from-[oklch(0.55_0.18_160)]
   to-[oklch(0.5_0.18_150)]` inline. Encapsulate as a utility class in
   `globals.css`:
   ```css
   .bg-brand-gradient {
     background-image: linear-gradient(
       to right, var(--primary), var(--primary-end));
   }
   ```
   with a new `--primary-end: oklch(0.5 0.18 150);` token.
2. **Success / positive.** The "Saved" check uses `oklch(0.6 0.2 145)`; transpose
   "Saved" state has no token. Add `--success` / `--success-foreground` to the
   `:root` and `.dark` blocks and a `--color-success` line in `@theme inline`.

### Migration

Tokenize a handful of literals → semantic class, then sweep. Reference mapping
(verify against actual values during the pass):

| Literal (representative) | Semantic class |
|---|---|
| `oklch(0.55 0.18 / 0.2 160)` | `bg-primary` / `text-primary` |
| `oklch(0.5 0.18 150)` (gradient end) | `.bg-brand-gradient` (via token) |
| `oklch(0.99 … 160)` | `bg-background` |
| `oklch(0.2–0.25 … 160)` | `text-foreground` |
| `oklch(0.3–0.35 … 160)` | `text-foreground` / `text-secondary-foreground` |
| `oklch(0.4–0.5 … 160)` | `text-muted-foreground` |
| `oklch(0.92 0.02 160)` (borders/inputs) | `border-border` / `border-input` |
| `oklch(0.94–0.96 … 150/160)` | `bg-muted` / `bg-secondary` / `bg-accent` |
| `oklch(0.85 0.04 … 160)` (hover borders) | `hover:border-primary/40` |
| `shadow-[oklch(0.55_0.18_160/0.3)]` | `shadow-primary/30` token or `shadow-md` |
| `oklch(0.6 0.2 145)` (Saved) | `text-success` |

### Guardrail (regression prevention)

Add a CI grep step (or ESLint `no-restricted-syntax` / custom rule) that fails
if `app/components/**` contains:

- raw `oklch(` or `rgb(`/`#` hex colors,
- the `zinc`/`slate`/`neutral`/`blue`/`red`/`green` Tailwind palette
  (`destructive` via tokens is allowed).

### Out of scope

- Visual redesign. Pixel output should be ~identical after Phase 0; this is a
  refactor, not a restyle. (Border/shadow *values* change in Phase 2.)

---

## Phase 1 — Unify zinc surfaces

### Goal

Migrate the 9 System-C files to tokens so every screen shares one language.
Delete the dead duplicate `NewSheetButton`.

### Files & mapping

| File | Change |
|---|---|
| `app/components/sheet-editor.tsx` | **Delete** the second `export function NewSheetButton` (zinc-900; the real one is `new-sheet-button.tsx`). |
| `app/components/sortable-list-card.tsx` | `border-zinc-200`→`border-border`; `text-zinc-900`→`text-foreground`; `text-zinc-500`→`text-muted-foreground`; `bg-zinc-100`→`bg-muted`; **transpose badge** `bg-blue-100 text-blue-700` → `bg-accent text-accent-foreground` (match sidebar badge). |
| `app/components/list-detail.tsx` | `text-zinc-900`→`text-foreground`; `Button variant="outline"` (already token-based) — keep. |
| `app/components/multi-abc-viewer.tsx` | `border-zinc-200`→`border-border`; `text-zinc-400`→`text-muted-foreground`; `border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50` (Print btn) → `<Button variant="outline">`. |
| `app/trash/page.tsx` | Whole page is zinc/red. `border-zinc-200`→`border-border`; `bg-zinc-900 … hover:bg-zinc-800` (Restore) → `bg-primary hover:bg-primary/90` (or `<Button>`); `border-red-300 text-red-600 hover:bg-red-50` (Delete forever) → `border-destructive text-destructive hover:bg-destructive/10`. |
| `app/(app)/list/[listId]/all/page.tsx`, `loading.tsx` ×2 | zinc skeletons → `bg-muted`. |
| `app/components/add-to-list-dialog.tsx` | audit & tokenize. |

### Acceptance

No `zinc-`, `blue-`, `red-` literals remain in `app/**` (CI grep from Phase 0
passes). The List, Trash, and Multi-Viewer screens are visually consistent with
Home/Sheet.

### Out of scope

- Changing transpose-badge *shape* (pill vs square) — see Phase 2.

---

## Phase 2 — Radius / spacing / shadow / border scale

### Goal

Impose a small, documented scale so the UI has rhythm instead of 6 radii and
~14 spacing values per screen.

### Decisions

- **Radius:** cards/containers → `rounded-xl`; inputs/buttons → `rounded-lg`;
  chips/badges → `rounded-full`. Document the rule in `globals.css` header.
  Remove ad-hoc `rounded-md`/`rounded-sm`/`rounded-2xl` (or move them onto the
  `<Button>`/`<Input>` primitives so call sites don't pass radius).
- **Control height:** all `<Input>`, `<select>`, `<Button>` default → `h-9`.
  The metadata row (meter/tempo/key) currently mixes heights because each sets
  its own `py-*`; normalize to the primitive defaults.
- **Page rhythm:** container `p-6` (lg) / `p-4` (mobile); section gap
  `space-y-6`; field rows `gap-4`. Apply uniformly to `sheet-detail`, `home`,
  `list-detail`.
- **Shadow:** one elevation for cards (`shadow-sm`); flat buttons (no shadow)
  except the single primary action per screen which may use `.bg-brand-gradient`
  + `shadow-md`. Drop per-element green-glow shadows.
- **Border strength (design veto point):** current `--border` is
  `oklch(0.92 0.02 160)` — near-invisible on the gradient background. Propose
  `oklch(0.9 0.02 160)` for real separation. Alternative: keep faint borders
  and rely on shadow only.

### Out of scope

- Removing the body gradient background (keep; it's on-brand). Just ensure
  content surfaces are opaque enough for contrast (Phase 2 may bump `bg-white/80`
  cards to `bg-card` at full opacity on content areas).

---

## Phase 3 — Replace native `alert` / `confirm`

### Goal

Kill the 7 native dialogs. They're jarring and inconsistent with the rest.

### Approach

1. **`ConfirmDialog`** (destructive confirms) — new
   `components/ui/confirm-dialog.tsx`, built on the existing `Dialog` primitive
   (no new dependency). Replaces `confirm()` in `sheet-editor.handleDelete`.
2. **Failure feedback** (save/create failures) — **decision:**
   - **(a) Inline error state** (no dep): show an error banner / field error in
     the component that triggered the action. Recommended for the editor.
   - **(b) `sonner` toasts** (one dep, ~7 kB, idiomatic shadcn): non-blocking
     feedback for background actions (list reorder revert, transpose save fail).
   - **Recommendation:** ship (a) now; add `sonner` only if non-blocking
     feedback is needed for optimistic-revert cases. Note: optimistic reverts in
     `sidebar-list-section` / `list-detail` currently fail **silently** on error
     — they should surface feedback regardless; (b) covers that.

### Call sites (7)

- `sheet-editor.tsx`: delete confirm → `ConfirmDialog`; save/create failure
  `alert()` → inline error.
- `new-sheet-button.tsx`: create failure `alert()` → inline error or toast.

### Out of scope

- Retry/undo semantics. Just visible feedback.

---

## Phase 4 — Sheet-oriented editor

The biggest user-facing win. Builds *beyond* the already-shipped
`2026-07-06-editor-ux-improvements.md` (Cmd+S, localStorage transpose,
empty-allowed tempo). Split into sub-phases; ship incrementally.

### 4a — ABC insertion toolbar

**Goal:** let users build notation by clicking instead of memorizing syntax.

- New `app/components/abc-toolbar.tsx` rendered above the `<textarea>`.
- Groups: durations (𝅗𝅥 𝅘𝅥 𝅘𝅥𝅮 𝅘𝅥𝅯), accidentals (♯ ♭ ♮), rests, barlines (`|`
  `|:` `:|` `||`), common tokens (chord `[c e g]`, repeat, slur).
- **Insertion at caret:** hoist the textarea into a ref shared with the toolbar;
  on click, use `HTMLTextAreaElement.setRangeText(token, selStart, selEnd,
  'end')` to insert and advance the caret, then call the existing
  `updateContent`. Must stay controlled (value still driven by
  `sheet.content`).
- Toolbar is a progressive enhancement — the raw textarea stays available for
  power users.

### 4b — ABC cheat-sheet popover

**Goal:** discoverable syntax reference for newcomers.

- A `?` button in the toolbar → Radix `Popover` (available via the installed
  `radix-ui` meta-package — **no new dep**).
- Static reference card: `|` barline, `|: :|` repeats, `K:` key, `M:` meter,
  `L:` unit note length, accidentals, octaves (`,` `'`), grace `{...}`, etc.
- Content lives in a constant; no i18n needed yet.

### 4c — Autosave

**Goal:** eliminate data-loss risk; keep explicit save as force-save.

- While `isEditing`, debounce `updateSheet` after content/metadata changes
  (e.g. 1500 ms idle). Reuse the existing local `updateSheet` state and the
  Cmd+S `handleSave`.
- Status indicator ("Saving…" / "Saved ✓" / "Saved 2m ago") in the editor
  header, reusing the `text-success` token from Phase 0.
- **Decision:** autosave replaces the need for a separate Save button on content
  edits, but **keep** "Done" (exits edit mode) + Cmd+S (force). Cancel becomes
  "discard unsaved" only if a save is in flight.
- Guard: same `isSaving` lock as today; coalesce overlapping saves.

### 4d — Restructure sheet page layout

**Goal:** stop forcing notation and editor to fight for one viewport.

- Today (`sheet-detail.tsx:97`): editor in a sticky `max-h-[50vh]` bottom
  drawer; notation scrolls above. On laptops you see one *or* the other.
- **Decision (recommend tab toggle first):** a top toolbar on the sheet page
  with `View · Edit · Play · Print`, switching the main area:
  - **View** — full notation + transport (current default).
  - **Edit** — notation preview on top, source + metadata + toolbar below, in a
    proper split (CSS grid `grid-rows-[auto_1fr]`), not a cramped drawer.
  - **Play** — large notation, auto-scroll, transport front-and-center.
  - **Print** — `window.print()` (and the §Future print stylesheet).
- Move the detached "Edit"/"Delete" buttons into this toolbar so actions read as
  belonging to the sheet.
- **Optional follow-up:** draggable split divider (notation | source) side by
  side on wide screens. Not in 4d.

### 4e — (Spike, separate) Synced cursor textarea ↔ rendered notation

Clicking a note in the abcjs SVG highlights the corresponding source range.
Non-trivial (abcjs char-range mapping is limited); time-box a spike before
committing. **Not in the committed scope** — listed for visibility.

### 4f — (Spike, separate) ABC syntax highlighting

Would need an editor with grammar support (CodeMirror 6 + custom ABC Lezer
mode, or `react-simple-code-editor` + Prism). Bigger dependency surface;
evaluate vs. payoff. **Not committed.**

### Out of scope for Phase 4

- 4e and 4f (spikes).
- New sheet templates/snippets (§Future).
- Target-key transpose picker (§Future).

---

## Phase 5 — Wire up dark mode

### Goal

The `.dark` palette exists in `globals.css` but **nothing toggles it**. Ship a
real dark/stand mode (white notation on black is standard for live use).

### Decisions

- **`next-themes`** (standard, ~2 kB, `attribute="class"` matches the existing
  `.dark` selector, `suppressHydrationWarning` on `<html>`). Avoids rolling a
  cookie+class system.
- **Toggle** in `user-menu.tsx` (dropdown: Light / Dark / System).
- **Redesign `.dark` to keep the green identity.** Today's `.dark` block is
  **achromatic** (`oklch(0.145 0 0)` greys, `--primary: oklch(0.922 0 0)`
  white) — it discards the emerald brand entirely. Restore it, e.g.
  `--primary: oklch(0.7 0.16 160)` on a dark surface, with corresponding
  `--primary-end`, `--accent`, `--success`, border, ring.
- Audit contrast in dark for the translucent surfaces from Phase 2.

### Out of scope

- Per-sheet theme preference. Global only.

---

## Phase 6 — Sheet-first home

### Goal

The home page (`home/sheet-grid.tsx`) is a flat list of one-line rows. A music
library should be **recognizable** — show the music.

### Approach

- Replace rows with **cards** in a responsive grid
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- Each card renders a **thumbnail of the first system** via `abcjs.renderAbc`
  into a small container (hide title/source lines via the existing
  `getAbcNotationFromSheet({hideSource:true})`; cap to first ~2 bars). Lazy/virtualize if the
  library is large (current page size is 20 — fine without virtualization).
- Keep existing filters/sort/pagination; restyle the filter bar per Phase 2.
- Optional **"feel" badge** derived from meter+tempo (reel / jig / waltz /
  ballad) since musicians think in genres.

### Risk

- abcjs rendering 20 mini-SVGs on the home could be heavier than text rows.
  Mitigate: render thumbnails client-side with `react-query` caching, render
  only when card is near viewport (`IntersectionObserver`), and cap staff size.

### Out of scope

- Server-side rendering of thumbnails.

---

## §Future (ideas backlog — not committed)

Captured from the review for later planning:

- **Templates/snippets** on New ("New reel in D", "New waltz") prefill
  meter/tempo/key + a bar skeleton (today `New` drops in `CDE`).
- **Target-key transpose picker** ("transpose to D") in addition to ±1.
- **Practice mode:** loop a selected bar range, time-stretch without pitch
  change, metronome count-in (abcjs synth supports much of this).
- **Setlist / performance view:** large notation, auto-scroll, hands-free
  next-tune / page-turn — the killer use case for gigging musicians.
- **Consolidated print stylesheet:** one place for page breaks, title block,
  multi-tune `/all` layout (today `print:` utilities are sprinkled across files).
- **Editor spikes:** synced cursor (4e), syntax highlighting (4f).

---

## Implementation order

Strictly sequenced because later phases depend on the token foundation:

1. **Phase 0** (token foundation) — unblocks all others. Ship first, alone.
2. **Phase 1** (zinc surfaces) — depends on 0; small, high consistency payoff.
3. **Phase 2** (scale) — depends on 0; can be bundled with 1 if small.
4. **Phase 3** (dialogs) — independent; can parallelize with 1–2.
5. **Phase 5** (dark mode) — depends on 0 (`.dark` redesign touches tokens) and
   is independent of the editor; can parallelize with 4.
6. **Phase 4** (editor) — largest; do 4a–4d in sequence. 4c (autosave) and 4d
   (layout) can land together. Independent of 6.
7. **Phase 6** (home) — last; benefits from all prior polish. Independent of 4.

Suggested PR boundaries:
- PR1 = Phase 0
- PR2 = Phase 1 + 2 (bundled, both small + visual-only)
- PR3 = Phase 3
- PR4 = Phase 5
- PR5 = Phase 4a + 4b (toolbar + cheat-sheet)
- PR6 = Phase 4c + 4d (autosave + layout)
- PR7 = Phase 6

---

## Testing strategy

- **No unit tests for visuals** (not worth it); rely on `npm run type-check` +
  `npm run lint` per PR, and keep `app/utils/abc-wrap.test.ts` green.
- The **Phase 0 CI grep guardrail** is the only automated visual check — it
  prevents token regressions.
- Per-PR manual checklist: desktop + mobile viewport, light + dark (after
  Phase 5), and the print path (`window.print()` preview) for any PR touching
  `print:` rules.
- Phase 4 changes touch the editor flow — manually verify: create → edit →
  autosave → reload → Cmd+S → transpose (list + bare) → print.

---

## Open decisions (need sign-off before that phase)

1. **Border strength** (Phase 2): bump `--border` or rely on shadow?
2. **Failure feedback** (Phase 3): inline-only, or add `sonner`?
3. **Autosave semantics** (Phase 4c): replace Save button or keep both?
4. **Sheet page layout** (Phase 4d): tab toggle (View/Edit/Play) vs. always-on
   split pane?
5. **Dark `--primary`** (Phase 5): confirm the emerald value to use on dark.
6. **Home thumbnails** (Phase 6): acceptable perf budget for 20 client-side
   abcjs renders, or gate behind IntersectionObserver from day one?
