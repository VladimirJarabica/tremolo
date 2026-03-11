"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  GripVertical,
} from "lucide-react";
import type { ListWithItems } from "@/be/list/get-lists";
import { reorderListItem } from "@/app/actions/reorder-list-item";
import { updateListOrder } from "@/app/actions/update-list-order";
import { EditListDialog } from "./list-dialogs";

export function SidebarListSection({
  list,
  currentSlug,
  currentListId,
  listPageId,
}: {
  list: ListWithItems;
  currentSlug: string | undefined;
  currentListId: string | null;
  listPageId: string | undefined;
}): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(
    currentListId === list.id || listPageId === list.id,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(list.items);

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

      // Boundary check
      if (
        (direction === "up" && itemIndex === 0) ||
        (direction === "down" && itemIndex === items.length - 1)
      ) {
        return;
      }

      // Optimistic update
      const newItems = [...items];
      const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
      [newItems[itemIndex], newItems[newIndex]] = [
        newItems[newIndex],
        newItems[itemIndex],
      ];

      const previousItems = items;
      setItems(newItems);

      // Persist
      const result = await reorderListItem({
        listId: list.id,
        sheetId,
        direction,
      });
      if (!result.success) {
        setItems(previousItems);
      }
    },
    [items, list.id],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over === null || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.sheetId === active.id);
      const newIndex = items.findIndex((i) => i.sheetId === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update
      const newItems = arrayMove(items, oldIndex, newIndex);
      const previousItems = items;
      setItems(newItems);

      // Persist
      const result = await updateListOrder({
        listId: list.id,
        sheetIdsOrder: newItems.map((i) => i.sheetId),
      });
      if (!result.success) {
        setItems(previousItems);
      }
    },
    [items, list.id],
  );

  return (
    <li className="group">
      {/* List header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-md px-1 py-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <Link
          href={`/list/${list.id}`}
          className="flex flex-1 items-center gap-1 rounded-md px-1 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          <span className="truncate">{list.name}</span>
          <span className="ml-auto text-xs text-zinc-400">{items.length}</span>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100"
          title="Edit list"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>

      {/* List items */}
      {isExpanded && items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.sheetId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="ml-4 mt-1 space-y-1 border-l border-zinc-200 pl-2">
              {items.map((item, index) => (
                <SortableListItem
                  key={item.sheetId}
                  item={item}
                  listId={list.id}
                  index={index}
                  totalItems={items.length}
                  currentSlug={currentSlug}
                  currentListId={currentListId}
                  onArrowClick={handleArrowClick}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <EditListDialog
        list={{ id: list.id, name: list.name }}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </li>
  );
}

interface SortableItem {
  sheetId: string;
  sheetSlug: string;
  sheetTitle: string;
  transpose: number;
}

function SortableListItem({
  item,
  listId,
  index,
  totalItems,
  currentSlug,
  currentListId,
  onArrowClick,
}: {
  item: SortableItem;
  listId: string;
  index: number;
  totalItems: number;
  currentSlug: string | undefined;
  currentListId: string | null;
  onArrowClick: (sheetId: string, direction: "up" | "down") => void;
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
    <li ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
          currentSlug === item.sheetSlug && currentListId === listId
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-50",
        )}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab text-zinc-300 hover:text-zinc-500"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Link */}
        <Link
          href={`/sheet/${item.sheetSlug}?list=${listId}`}
          className="flex-1"
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{item.sheetTitle || "Untitled"}</span>
            {item.transpose !== 0 && (
              <span className="text-xs text-zinc-400">
                {item.transpose > 0 ? "+" : ""}
                {item.transpose}
              </span>
            )}
          </div>
        </Link>

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
            <ChevronUp className="h-3 w-3" />
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
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </li>
  );
}
