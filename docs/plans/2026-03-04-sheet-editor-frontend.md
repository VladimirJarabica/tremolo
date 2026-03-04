# Sheet Editor Frontend Design

## Overview
Split-view interface for managing ABC notation music sheets. List on left, detail/editor on right.

## Data Model
- Sheet: Add `deletedAt: DateTime?` for soft delete
- Tag: Many-to-many via `_SheetToTag`, unique by name
- Auto-create tags when user types new ones

## Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Tremolo                                    [Trash] [New]   │
├──────────────────────┬──────────────────────────────────────┤
│   Sheet List         │         Detail / Editor              │
│   (left sidebar)     │         (right panel)                │
├──────────────────────┴──────────────────────────────────────┤
```

## Components
- `SheetList` - Server component, lists sheets
- `SheetListItem` - Client component, clickable with active state
- `SheetDetail` - Server component, shows ABC preview + tags + actions
- `SheetEditor` - Client component, ABC textarea + tag combobox
- `TagSelector` - Client component, combobox with create option

## Flows
- **Create**: New → Create sheet → Preview shows → Edit to modify
- **Edit**: Edit button → Textarea + tags → Save → Preview
- **Delete**: Delete → Soft delete → Toast with undo
- **Trash**: View deleted → Restore or permanent delete

## Technical
- URL param `?sheetId=xxx` for selection
- abcjs for ABC notation rendering
- Server actions for all mutations
