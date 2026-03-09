# List Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a dedicated page at `/list/{listId}` to display and manage a single list with reordering, removal, rename, and delete capabilities.

**Architecture:** Server component fetches list data with ownership verification, client component handles interactive reordering with @dnd-kit (same pattern as sidebar). Reuses existing backend functions and EditListDialog.

**Tech Stack:** Next.js 16, React 19, @dnd-kit, Kysely, shadcn UI components

---

## Task 1: Create Backend Function get-list

**Files:**
- Create: `be/list/get-list.ts`

**Step 1: Create get-list.ts backend function**

Create `be/list/get-list.ts` with:
- Input type: `{ listId: string }`
- Return type: `ApiResponse<ListWithItems>` (reuse type from get-lists.ts)
- Fetch list by ID with ownership check
- Join with Sheet to get metadata (title, slug, transpose, meter, tempo, scale)
- Apply sheetIdsOrder for ordering
- Return NOT_FOUND if list doesn't exist or not owned

```typescript
import { db } from "@/be/db";
import { getUserContext } from "@/be/auth/guards";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import type { ListWithItems } from "./get-lists";

export async function getList(input: {
  listId: string;
}): Promise<ApiResponse<ListWithItems>> {
  const { user } = await getUserContext();

  try {
    const list = await db
      .selectFrom("List")
      .select(["id", "name", "sheetIdsOrder"])
      .where("id", "=", input.listId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!list) {
      return apiError(ApiErrorCode.NOT_FOUND);
    }

    const listItems = await db
      .selectFrom("ListItem")
      .innerJoin("Sheet", "ListItem.sheetId", "Sheet.id")
      .select([
        "ListItem.sheetId",
        "ListItem.transpose",
        "Sheet.slug as sheetSlug",
        "Sheet.title as sheetTitle",
        "Sheet.meter",
        "Sheet.tempo",
        "Sheet.scale",
      ])
      .where("ListItem.listId", "=", list.id)
      .where("Sheet.deletedAt", "is", null)
      .execute();

    const sheetIdsOrder = list.sheetIdsOrder ?? [];
    const orderedItems =
      sheetIdsOrder.length > 0
        ? sheetIdsOrder
            .map((sheetId) =>
              listItems.find((item) => item.sheetId === sheetId),
            )
            .filter((item) => item !== undefined)
        : listItems;

    return apiSuccess({
      id: list.id,
      name: list.name,
      items: orderedItems,
    });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR);
  }
}

export type GetListData = ApiResponseData<typeof getList>;
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add be/list/get-list.ts
git commit -m "feat: add get-list backend function"
```

---

## Task 2: Create Server Action get-list

**Files:**
- Create: `app/actions/get-list.ts`

**Step 1: Create server action wrapper**

Create `app/actions/get-list.ts`:

```typescript
"use server";

import { getList as getListFn } from "@/be/list/get-list";

export async function getList(listId: string) {
  return getListFn({ listId });
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add app/actions/get-list.ts
git commit -m "feat: add get-list server action"
```

---

## Task 3: Create List Detail Page Component

**Files:**
- Create: `app/(app)/list/[listId]/page.tsx`

**Step 1: Create page server component**

Create `app/(app)/list/[listId]/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getList } from "@/app/actions/get-list";
import { ListDetail } from "@/app/components/list-detail";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<React.JSX.Element> {
  const { listId } = await params;
  const result = await getList(listId);

  if (!result.success) {
    redirect("/");
  }

  return <ListDetail initialList={result.data} />;
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/list/[listId]/page.tsx
git commit -m "feat: add list detail page route"
```

---

## Task 4: Create List Detail Client Component

**Files:**
- Create: `app/components/list-detail.tsx`

**Step 1: Create main interactive component**

Create `app/components/list-detail.tsx` with:
- Accept initialList prop (ListWithItems type)
- Manage local state for items (optimistic updates)
- DndContext with sensors for drag-and-drop
- SortableContext for sortable items
- Header with list name and actions menu
- Map through items with SortableListItem component
- Handle drag end and arrow click with optimistic updates + rollback
- Handle remove with optimistic update + rollback

```typescript
"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ListWithItems } from "@/be/list/get-lists";
import { reorderListItem } from "@/app/actions/reorder-list-item";
import { updateListOrder } from "@/app/actions/update-list-order";
import { removeSheetFromList } from "@/app/actions/remove-sheet-from-list";
import { ListActionsMenu } from "./list-actions-menu";
import { SortableListCard } from "./sortable-list-card";

export function ListDetail({
  initialList,
}: {
  initialList: ListWithItems;
}): React.JSX.Element {
  const [items, setItems] = useState(initialList.items);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleArrowClick = useCallback(
    async (sheetId: string, direction: "up" | "down") => {
      const itemIndex = items.findIndex((i) => i.sheetId === sheetId);
      if (itemIndex === -1) return;

      if (
        (direction === "up" && itemIndex === 0) ||
        (direction === "down" && itemIndex === items.length - 1)
      ) {
        return;
      }

      const newItems = [...items];
      const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
      [newItems[itemIndex], newItems[newIndex]] = [
        newItems[newIndex],
        newItems[itemIndex],
      ];

      const previousItems = items;
      setItems(newItems);

      const result = await reorderListItem({
        listId: initialList.id,
        sheetId,
        direction,
      });
      if (!result.success) {
        setItems(previousItems);
      }
    },
    [items, initialList.id],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over === null || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.sheetId === active.id);
      const newIndex = items.findIndex((i) => i.sheetId === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(items, oldIndex, newIndex);
      const previousItems = items;
      setItems(newItems);

      const result = await updateListOrder({
        listId: initialList.id,
        sheetIdsOrder: newItems.map((i) => i.sheetId),
      });
      if (!result.success) {
        setItems(previousItems);
      }
    },
    [items, initialList.id],
  );

  const handleRemove = useCallback(
    async (sheetId: string) => {
      const previousItems = items;
      const newItems = items.filter((i) => i.sheetId !== sheetId);
      setItems(newItems);

      const result = await removeSheetFromList({
        listId: initialList.id,
        sheetId,
      });
      if (!result.success) {
        setItems(previousItems);
      }
    },
    [items, initialList.id],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {initialList.name}
        </h1>
        <ListActionsMenu
          list={{ id: initialList.id, name: initialList.name }}
        />
      </div>

      {items.length === 0 ? (
        <p className="text-center text-zinc-500">No sheets in this list</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.sheetId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableListCard
                  key={item.sheetId}
                  item={item}
                  listId={initialList.id}
                  index={index}
                  totalItems={items.length}
                  onArrowClick={handleArrowClick}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/list-detail.tsx
git commit -m "feat: add list detail client component"
```

---

## Task 5: Create Sortable List Card Component

**Files:**
- Create: `app/components/sortable-list-card.tsx`

**Step 1: Create individual card component**

Create `app/components/sortable-list-card.tsx`:

```typescript
"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
} from "lucide-react";

interface SortableItem {
  sheetId: string;
  sheetSlug: string;
  sheetTitle: string;
  transpose: number;
  meter?: string | null;
  tempo?: number | null;
  scale?: string | null;
}

export function SortableListCard({
  item,
  listId,
  index,
  totalItems,
  onArrowClick,
  onRemove,
}: {
  item: SortableItem;
  listId: string;
  index: number;
  totalItems: number;
  onArrowClick: (sheetId: string, direction: "up" | "down") => void;
  onRemove: (sheetId: string) => void;
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.sheetId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-4",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab text-zinc-300 hover:text-zinc-500"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Title link */}
        <Link
          href={`/sheet/${item.sheetSlug}?list=${listId}`}
          className="flex-1"
        >
          <div className="font-medium text-zinc-900">
            {item.sheetTitle || "Untitled"}
          </div>
        </Link>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {item.meter && (
            <span className="rounded bg-zinc-100 px-2 py-1">
              {item.meter.replace("m_", "").replace("_", "/")}
            </span>
          )}
          {item.tempo && (
            <span className="rounded bg-zinc-100 px-2 py-1">
              {item.tempo} BPM
            </span>
          )}
          {item.scale && (
            <span className="rounded bg-zinc-100 px-2 py-1">
              {item.scale}
            </span>
          )}
          {item.transpose !== 0 && (
            <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
              {item.transpose > 0 ? "+" : ""}
              {item.transpose}
            </span>
          )}
        </div>

        {/* Arrow buttons */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onArrowClick(item.sheetId, "up")}
            disabled={isFirst}
            className={cn(
              "rounded p-0.5",
              isFirst
                ? "text-zinc-200"
                : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500",
            )}
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onArrowClick(item.sheetId, "down")}
            disabled={isLast}
            className={cn(
              "rounded p-0.5",
              isLast
                ? "text-zinc-200"
                : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500",
            )}
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(item.sheetId)}
          className="rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
          title="Remove from list"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/sortable-list-card.tsx
git commit -m "feat: add sortable list card component"
```

---

## Task 6: Create List Actions Menu Component

**Files:**
- Create: `app/components/list-actions-menu.tsx`

**Step 1: Create dropdown menu component**

Create `app/components/list-actions-menu.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditListDialog } from "./list-dialogs";
import { deleteList } from "@/app/actions/delete-list";

export function ListActionsMenu({
  list,
}: {
  list: { id: string; name: string };
}): React.JSX.Element {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete "${list.name}"? This will remove all sheets from this list.`)) {
      return;
    }

    const result = await deleteList({ listId: list.id });
    if (result.success) {
      router.push("/");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditListDialog
        list={list}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/list-actions-menu.tsx
git commit -m "feat: add list actions menu component"
```

---

## Task 7: Final Testing

**Step 1: Run full type check**

Run: `npm run type-check`
Expected: No errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Test in browser**

1. Start dev server: `npm run dev`
2. Navigate to a list page: `http://localhost:3000/list/{listId}`
3. Verify:
   - Page loads with list name and sheets
   - Drag and drop works
   - Up/down arrows work
   - Remove button removes sheet
   - Edit menu opens dialog
   - Delete redirects to home
   - Not found list redirects to home

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete list detail page implementation"
```

---

## Summary

This implementation creates a fully functional list detail page with:
- Server-side data fetching with ownership verification
- Interactive reordering (drag-and-drop + arrow buttons)
- Sheet removal with optimistic updates
- List rename and delete via dropdown menu
- Consistent UI with existing sidebar pattern
- Proper error handling and redirects

All components follow project conventions:
- Server components by default
- Client components only for interactivity
- Reuse existing actions and dialogs
- Optimistic updates with rollback
- Proper type safety throughout
