"use client";

import type { GetListsData } from "@/be/list/get-lists";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AbcViewer } from "./abc-viewer";
import { AddToListDialog } from "./add-to-list-dialog";
import { SheetEditor } from "./sheet-editor";

export function SheetDetail({
  lists,
  currentUserId,
  ...props
}: {
  sheet: SheetBySlug;
  lists: GetListsData;
  currentUserId: string | null;
}): React.JSX.Element {
  const searchParams = useSearchParams();
  const [updateSheet, setUpdatedSheet] = useState(props.sheet);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);

  const sheet = isEditing ? updateSheet : props.sheet;

  const isOwner = currentUserId === props.sheet.userId;

  // Get list context from URL
  const listId = searchParams.get("list");
  const listItem = listId
    ? lists
        .find((l) => l.id === listId)
        ?.items.find((i) => i.sheetId === sheet.id)
    : null;
  const initialTranspose = listItem?.transpose ?? 0;

  // Reset editing state when sheet changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpdatedSheet(props.sheet);
    setIsEditing(false);
  }, [props.sheet.id, props.sheet.slug]);

  // Find all lists containing this sheet
  const containingLists = lists
    .map((list) => ({
      name: list.name,
      id: list.id,
      item: list.items.find((i) => i.sheetId === sheet.id),
    }))
    .filter((l) => l.item !== undefined);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6 print:overflow-visible">
        <AbcViewer
          sheet={sheet}
          listId={listId}
          initialTranspose={initialTranspose}
        />
        {/* Lists containing this sheet */}
        {containingLists.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
            {containingLists.map((list) => (
              <ListBadge
                key={list.id}
                name={list.name}
                transpose={list.item!.transpose}
                listId={list.id}
                sheetSlug={sheet.slug}
                isActive={listId === list.id}
              />
            ))}
          </div>
        )}
        {/* Add to list */}
        {isOwner && (
          <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setShowAddToList(true)}
              className="rounded-xl border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:border-primary/40"
            >
              Add to List
            </button>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 max-h-[50vh] overflow-auto border-t border-border backdrop-blur-sm bg-card/80 p-4 print:hidden">
        {isOwner ? (
          <SheetEditor
            sheet={sheet}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updateContent={(content) =>
              setUpdatedSheet((prev) => ({ ...prev, content }))
            }
            updateTitle={(title) =>
              setUpdatedSheet((prev) => ({ ...prev, title }))
            }
            updateAuthor={(author) =>
              setUpdatedSheet((prev) => ({ ...prev, author }))
            }
            updateSource={(source) =>
              setUpdatedSheet((prev) => ({ ...prev, source }))
            }
            updateMeter={(meter) =>
              setUpdatedSheet((prev) => ({ ...prev, meter }))
            }
            updateTempo={(tempo) =>
              setUpdatedSheet((prev) => ({ ...prev, tempo }))
            }
            updateScale={(scale) =>
              setUpdatedSheet((prev) => ({ ...prev, scale }))
            }
            onCancel={() => setUpdatedSheet(props.sheet)}
          />
        ) : null}
      </div>

      <AddToListDialog
        sheetId={sheet.id}
        sheetSlug={sheet.slug}
        sheetTitle={sheet.title}
        lists={lists}
        open={showAddToList}
        onOpenChange={setShowAddToList}
      />
    </div>
  );
}

function ListBadge({
  name,
  transpose,
  listId,
  sheetSlug,
  isActive,
}: {
  name: string;
  transpose: number;
  listId: string;
  sheetSlug: string;
  isActive: boolean;
}): React.JSX.Element {
  const transposeLabel =
    transpose === 0 ? null : transpose > 0 ? `+${transpose}` : `${transpose}`;

  return (
    <a
      href={`/sheet/${sheetSlug}?list=${listId}`}
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-3 py-1 text-xs font-medium text-secondary-foreground"
          : "inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:border-primary/40"
      }
    >
      <span>{name}</span>
      {transposeLabel !== null && (
        <span
          className={
            isActive
              ? "rounded bg-accent px-1.5 py-0.5 text-[10px] text-secondary-foreground"
              : "rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
          }
        >
          {transposeLabel}
        </span>
      )}
    </a>
  );
}

export function EmptyState(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">Select a sheet or create a new one</p>
      </div>
    </div>
  );
}
