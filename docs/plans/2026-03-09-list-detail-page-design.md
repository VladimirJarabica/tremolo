# List Detail Page Design

Date: 2026-03-09

## Overview

Create a dedicated page at `/list/{listId}` to display and manage a single list with its sheets.

## Requirements

### Display
- Show all sheets in the list with:
  - Title (clickable, links to sheet page)
  - Transpose setting (if not 0)
  - Metadata: meter, tempo, scale
- Apply custom ordering from `sheetIdsOrder`
- Empty state: "No sheets in this list"

### Actions

**List Management:**
- Edit list name (via dropdown menu)
- Delete list (via dropdown menu, redirects to home)

**Sheet Management:**
- Reorder sheets: drag-and-drop + up/down arrows (same as sidebar)
- Remove sheets from list
- Click to navigate: `/sheet/{slug}?list={listId}`

### Error Handling
- List not found → Redirect to `/`
- Unauthorized → Redirect to `/`
- API failures → Revert optimistic updates, show toast

## Technical Design

### Route Structure
```
app/(app)/list/[listId]/page.tsx
```

### Backend Functions

**New:**
- `be/list/get-list.ts` - Fetch single list with ordered items
  - Input: `listId`
  - Returns: List with items (including sheet metadata)
  - Verifies user ownership
  - Returns NOT_FOUND if not owned

**Existing (reuse):**
- `reorderListItem` - Up/down arrow reordering
- `updateListOrder` - Drag-and-drop reordering
- `updateList` - Rename list
- `deleteList` - Delete list
- `removeSheetFromList` - Remove sheet from list

### Server Actions

**New:**
- `app/actions/get-list.ts` - Wrapper with revalidation

**Existing (reuse):**
- `app/actions/reorder-list-item.ts`
- `app/actions/update-list-order.ts`
- `app/actions/update-list.ts`
- `app/actions/delete-list.ts`
- `app/actions/remove-sheet-from-list.ts`

### Components

**Server Component:**
- `app/(app)/list/[listId]/page.tsx`
  - Fetches list data
  - Redirects to `/` if not found/unauthorized
  - Passes data to client component

**Client Components:**
- `app/components/list-detail.tsx`
  - Main interactive list component
  - Manages state for optimistic updates
  - Uses @dnd-kit for drag-and-drop
  - Same pattern as `SidebarListSection`

- `app/components/list-item-card.tsx`
  - Individual sheet card
  - Displays: title, metadata, transpose, actions
  - Drag handle + up/down arrows + remove button

- `app/components/list-actions-menu.tsx`
  - Dropdown menu with Edit and Delete options
  - Uses shadcn DropdownMenu

### UI/UX Details

**Header:**
- List name (large, prominent)
- Dropdown menu button (MoreVertical icon)
  - "Edit name" → Dialog to rename
  - "Delete list" → Confirmation dialog → Redirect to `/`

**Sheet Card:**
- Left: Drag handle (GripVertical)
- Center-left: Title (clickable link)
- Center-right: Metadata badges (meter, tempo, scale)
- Right: Transpose indicator + up/down arrows + remove button

**Styling:**
- Consistent with sidebar items
- Hover states for interactive elements
- Visual feedback during drag
- Disabled states for boundary arrows

### Dependencies

All required dependencies already installed:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
- `lucide-react`
- shadcn components (DropdownMenu, Dialog)

## Implementation Plan

1. Create backend function `get-list.ts`
2. Create server action `get-list.ts`
3. Create page component `app/(app)/list/[listId]/page.tsx`
4. Create `list-detail.tsx` client component
5. Create `list-item-card.tsx` component
6. Create `list-actions-menu.tsx` component
7. Test all interactions
