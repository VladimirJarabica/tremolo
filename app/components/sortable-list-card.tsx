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
