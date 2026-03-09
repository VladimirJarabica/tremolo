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
