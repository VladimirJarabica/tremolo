# Lists Feature Design

## Overview

Users can create lists to organize sheets with list-specific transposition settings. Each sheet can appear in multiple lists with different transpositions.

## Data Model

Already in schema:

- `List`: id, name, userId, timestamps
- `ListItem`: listId, sheetId, transpose (default 0), timestamps
- Composite key [listId, sheetId]

## Sidebar Structure

```
┌─────────────────────┐
│ ▼ All Sheets        │  ← Shows all sheets (current behavior)
│   Sheet 1           │
│   Sheet 2           │
│                     │
│ ▼ My Setlist        │  ← Expandable list
│   Sheet 1 (+2)      │  ← Shows transposition if non-zero
│   Sheet 3           │
│                     │
│ ▼ Practice List     │
│   Sheet 2 (-1)      │
│                     │
│ + New List          │  ← Button to create list
└─────────────────────┘
```

- Click list name to expand/collapse
- Click sheet within list to view in list context
- Transposition shown inline when ≠ 0

## List Management (Modals)

### Create List Modal

- Triggered by "+ New List" button
- Single text input for name
- "Create" and "Cancel" buttons

### Edit List Modal

- Triggered by edit icon next to list name
- Rename list, view/remove sheets in list
- Delete list option

### Delete Confirmation

- Shows sheet count being removed from list
- Sheets NOT deleted, only list associations

## Adding Sheets to Lists

### "Add to List" Dropdown

- Button in sheet toolbar (near tags/edit controls)
- Dropdown shows user's lists with checkmarks for existing
- Click unchecked → adds with initial transposition modal
- Click checked → removes from list

### Initial Transposition Modal

- "Add 'Sheet Name' to 'List Name'"
- Number input (default 0)
- "Add" and "Cancel" buttons

## Transposition in List Context

### URL Structure

`/sheet/[slug]?list=[listId]` - optional query param for list context

### Behavior

**From list context:**
- Transpose changes auto-save to ListItem
- "Saved" indicator appears briefly (fades after 1-2s)

**From "All Sheets":**
- Transpose is local state (no persistence)

## Backend API

### List Operations

- `createList(userId, name)` → list
- `getLists(userId)` → lists with items (sheet slugs, transpositions)
- `updateList(listId, name)` → updated list
- `deleteList(listId)` → void

### ListItem Operations

- `addSheetToList(listId, sheetId, transpose?)` → listItem
- `removeSheetFromList(listId, sheetId)` → void
- `updateListItemTranspose(listId, sheetId, transpose)` → listItem

All follow existing patterns: Zod validation → Kysely query → ApiResponse<T>

## Implementation Order

1. Backend: list validation schemas
2. Backend: list CRUD functions
3. Backend: list item CRUD functions
4. Server actions for all operations
5. UI: list modals (create, edit, delete)
6. UI: sidebar with lists section
7. UI: add-to-list dropdown on sheet page
8. UI: transposition save indicator in list context
