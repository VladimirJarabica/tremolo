# Sortable List Items

## Overview

Allow users to reorder sheets within lists using arrow buttons or drag-and-drop in the sidebar.

## Data Model Changes

Add `sheetIdsOrder` field to `List` model:

```prisma
model List {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  name           String
  sheetIdsOrder  String[] // Ordered array of sheet IDs

  items          ListItem[]

  user   User   @relation(fields: [userId], references: [id])
  userId String

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
}
```

**No changes to `ListItem`** - it remains the join table with transpose settings.

### Invariants

- `sheetIdsOrder` always matches the ListItem records for that list
- Every mutation (add/remove) updates both atomically
- Order in `sheetIdsOrder` = display order in UI

## Backend API

### New Functions

```ts
// be/list/reorder-list-item.ts
reorderListItem(listId: string, sheetId: string, direction: 'up' | 'down')
```
- Moves the sheet's position in `sheetIdsOrder` array
- Returns updated list

```ts
// be/list/update-list-order.ts
updateListOrder(listId: string, sheetIdsOrder: string[])
```
- Updates the full `sheetIdsOrder` array after drag operations
- Returns updated list

### Modified Functions

| Function | Change |
|----------|--------|
| `addSheetToList` | Append `sheetId` to `sheetIdsOrder` |
| `removeSheetFromList` | Remove `sheetId` from `sheetIdsOrder` |
| `getLists` | Return items ordered by `sheetIdsOrder` |

## Server Actions

Add to `app/actions/list.ts`:

```ts
reorderListItem(listId: string, sheetId: string, direction: 'up' | 'down')
updateListOrder(listId: string, sheetIdsOrder: string[])
```

## Frontend UI

### Sidebar List Items

```
┌─────────────────────────────┐
│ ▼ My Setlist                │
│   [↑↓] Sheet 1 (+2)         │  ← Drag handle + arrow buttons
│   [↑↓] Sheet 3              │
│   [↑↓] Sheet 2 (-1)         │
└─────────────────────────────┘
```

### Arrow Buttons

- Up/Down chevrons (ChevronUp/ChevronDown icons from lucide-react)
- Disabled at boundaries (up disabled for first, down for last)
- Optimistic update with rollback on error

### Drag and Drop

- Use `@dnd-kit/core` library
- Drag handle on the left of each item
- Visual feedback during drag (opacity, drop indicator)
- Immediate save on drop

## Implementation Details

### Arrow Button Handler

```ts
const handleArrowClick = async (sheetId: string, direction: 'up' | 'down') => {
  // Optimistic: reorder local state immediately
  setListItems(reorderLocally(items, sheetId, direction));

  // Persist
  const result = await reorderListItem(listId, sheetId, direction);
  if (!result.success) {
    // Rollback on error
    setListItems(items);
    toast.error('Failed to reorder');
  }
};
```

### Drag Handler

```ts
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const newOrder = reorderArray(items, active.id, over.id);
  setListItems(newOrder);

  // Save entire new order
  await updateListOrder(listId, newOrder.map(i => i.sheetId));
};
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Sheet deleted externally | Filter `sheetIdsOrder` to only include existing ListItems |
| Concurrent modifications | Last write wins |
| Empty list | `sheetIdsOrder` is `[]`, UI shows empty state |
| Single item | Arrow buttons disabled, drag has no effect |
| Network errors | Optimistic update rolls back, toast notification |

## Implementation Order

1. **Database migration**
   - Add `sheetIdsOrder String[]` to `List` model
   - Default to empty array `[]`

2. **Backend functions**
   - Create `be/list/reorder-list-item.ts`
   - Create `be/list/update-list-order.ts`
   - Modify `addSheetToList` to append to `sheetIdsOrder`
   - Modify `removeSheetFromList` to remove from `sheetIdsOrder`
   - Modify `getLists` to order items by `sheetIdsOrder`

3. **Server actions**
   - Add `reorderListItem` action
   - Add `updateListOrder` action

4. **Frontend - Arrows**
   - Add up/down buttons to sidebar list items
   - Implement optimistic updates with rollback
   - Handle boundary conditions (first/last item)

5. **Frontend - Drag & Drop**
   - Install `@dnd-kit/core`
   - Add drag handle to list items
   - Implement drag-and-drop reordering
   - Wire up to `updateListOrder` action
