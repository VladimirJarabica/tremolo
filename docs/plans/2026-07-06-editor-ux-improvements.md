# Editor UX Improvements

Three targeted improvements to the sheet editor, focused on making inputting
faster and transpose more honest. Evaluated in `2026-07-06` review; abcjs render
performance and sheet-page read consolidation were explicitly **out of scope**
(not issues / not needed).

## Scope

| # | Feature | File |
|---|---------|------|
| 1 | Cmd/Ctrl+S to save | `app/components/sheet-editor.tsx` |
| 2 | Persist non-list transpose to `localStorage` | `app/components/abc-viewer.tsx` |
| 3 | Empty-allowed tempo field with save-time validation | `app/components/sheet-editor.tsx` |

No backend, schema, or migration changes. No new dependencies.

---

## 1. Cmd/Ctrl+S to save

### Goal

Let the user save the sheet with `Cmd+S` (macOS) / `Ctrl+S` (other) while
editing, instead of having to click the docked "Save" button.

### Behavior

- Listener active **only while `isEditing === true`**. When not editing, do
  nothing (let the browser keep its default, though it's irrelevant).
- Intercept `keydown` on `window`: if `(e.metaKey || e.ctrlKey) && e.key === "s"`
  (case-insensitive), call `e.preventDefault()` (kills the browser "Save Page"
  dialog) and invoke `handleSave()`.
- Respects the existing `isSaving` guard — `handleSave` returns early if a save
  is already in flight, so rapid Cmd+S presses don't fire duplicate requests.
  (This guard also protects the disabled Save button path.)

### Implementation notes

- Use the "latest handler" ref pattern so the listener can be attached once per
  `isEditing` toggle without going stale: `saveRef.current` is reassigned every
  render to the current `handleSave`; the `keydown` effect depends only on
  `[isEditing]`.
- Attaching to `window` (not the textarea) means Cmd+S works regardless of
  focus, including while typing in the ABC body. Existing inputs do not call
  `stopPropagation`, so bubbling is unaffected.

### Out of scope

- No autosave. Save is still explicit.
- No Cmd+Enter / Esc-to-cancel shortcuts in this pass (Esc already does nothing
  dangerous; could be a follow-up).

---

## 2. Persist non-list transpose to `localStorage`

### Goal

Today, transposing a sheet outside any list context is ephemeral — it resets on
navigation, with no hint that it isn't saved (the "Auto-saves to list" label is
hidden when no `listId` is present). Persist it in the browser so a user's
preferred transpose for a given sheet sticks across reloads.

### Precedence (source of truth)

| Context | Source of transpose | Persisted? |
|---------|---------------------|------------|
| `?list=<id>` in URL | `ListItem.transpose` (DB) | server (existing) |
| No list context | `localStorage` | browser (new) |

DB always wins when in a list. `localStorage` is only read/written for the bare
sheet view.

### Storage

- Key: `tremolo:transpose:{sheetId}` (sheet `id` is stable across renames; slug
  is not).
- Value: the integer transpose as a string (e.g. `"-2"`).
- No expiry; no size concern (one entry per sheet the user transposes).
- Guarded with `try/catch` around all `localStorage` access (private mode /
  quota / disabled storage must never throw into the UI).

### Behavior in `AbcViewer`

- **Init:** keep seeding `transpose` state from `initialTranspose` (unchanged)
  so SSR and first paint match the server value — avoids a hydration mismatch.
  Compute a `targetTranspose` during render: `listId ? initialTranspose :
  (readStoredTranspose(sheet.id) ?? initialTranspose)`. A simple effect
  `setTranspose(targetTranspose)` on `[targetTranspose]` applies it after mount.
  The localStorage read is confined to the dep value (never the rendered output),
  so SSR output stays consistent and the effect updates state post-mount.
- **Lint note:** `react-hooks/set-state-in-effect` flags complex effect bodies
  (conditional + function calls) but accepts a single `setTranspose(value)`
  mirroring a dep. Precomputing `targetTranspose` keeps the effect structurally
  simple and lint-clean — HEAD's original transpose effect used the same shape.
- **On transpose change (`handleTransposeChange`):**
  - If `listId` present → existing debounced server save (unchanged).
  - If no `listId` → write `localStorage` and update local state. No server call.
- **"Saved" indicator / "Auto-saves to list" label:**
  - **DECISION (please veto if wrong):** in the bare (non-list) view, **hide**
    both the "Saved" checkmark and the "Auto-saves to list" hint. `localStorage`
    writes are instant and synchronous, so a "Saved" flash is noise; the label
    is meaningless without a list. The number readout (`+2` / `-3`) already
    communicates state.
- **Reset:** not in this pass. A future "reset transpose" affordance can clear
  both `localStorage` and the in-memory value.

### Hydration note

The only value rendered into the DOM at first paint is the number readout, which
stays `initialTranspose` (almost always `0` in the bare view) until the effect
runs on the client. This is the standard "read from browser storage after mount"
pattern and produces no hydration warning.

### Out of scope

- No target-key picker ("transpose to D"). Still ±1 semitone buttons.
- No per-list "remembered" state; lists are unaffected.

---

## 3. Empty-allowed tempo field with save-time validation

### Goal

The tempo input is a controlled `type="number"` that coerces via
`parseInt(value) || 120` on every keystroke. Clearing the field to type a new
value snaps it back to `120` mid-typing — painful, especially on mobile. Allow
empty input during editing, but reject an invalid/empty value at save time with
an explicit error instead of silently defaulting.

### Behavior

- **Local string state:** introduce `tempoInput: string` in `SheetEditor`,
  seeded from `sheet.tempo.toString()`. The `<input>` binds to this string, not
  directly to `sheet.tempo`.
- **`onChange`:** update `tempoInput` only. Empty string and partial numerics
  (e.g. `"12"`) are allowed and do **not** propagate to the parent's `sheet`
  until committed. This is what stops the fighting.
- **Sync from prop:** when `props.sheet.tempo` changes (sheet switch via
  `useEffect` reset in `sheet-detail.tsx`, or Cancel), re-seed `tempoInput` from
  the prop so the field reflects the canonical value.
- **`onBlur`:** hard fallback to `120`. If `tempoInput` is empty, `NaN`, or
  `<= 0`, set `tempoInput = "120"` and call `updateTempo(120)`. Otherwise parse
  and commit via `updateTempo`.
- **Enter key:** treat like blur (commit). Keeps keyboard-only editing fluid.
- **`handleSave` validation:** before calling `updateSheet`, parse `tempoInput`.
  If it is empty, `NaN`, or not a positive integer → show an inline error and
  **abort the save** (do not call the server action). This applies to both the
  Save button and the new Cmd/Ctrl+S shortcut.
- **Error UI:** small red message under/beside the field, e.g.
  "Tempo must be a positive whole number." Cleared as soon as `tempoInput`
  becomes valid (on the next `onChange`).

### Why both "hard 120" and "error on save"

- Hard 120 on **blur** handles the common "I left the field empty by accident"
  case gracefully — the field self-heals to a sane value.
- Error on **save** handles the "I'm mid-edit and hit Save / Cmd+S before
  blurring" case — instead of silently shipping 120 (or shipping garbage), we
  stop and tell the user. The two together cover graceful recovery and explicit
  rejection without ever persisting an invalid tempo.

### Out of scope

- No min/max BPM clamping beyond "positive integer" (existing Zod schema is
  `z.number().int().positive()`; we mirror that client-side).
- No unit change (still BPM).

---

## Implementation order

1. Cmd/Ctrl+S (#1) — self-contained, no design open questions.
2. Empty-allowed tempo (#3) — self-contained in the same file as #1.
3. `localStorage` transpose (#2) — pending confirmation of the "Saved"
   indicator decision above.
