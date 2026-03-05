"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AbcViewer } from "./abc-viewer";
import { SheetEditor } from "./sheet-editor";
import { AddToListDialog } from "./add-to-list-dialog";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import type { GetListsData } from "@/be/list/get-lists";

export function SheetDetail({
  allTags,
  lists,
  currentUserId,
  ...props
}: {
  sheet: SheetBySlug;
  allTags: { id: string; name: string }[];
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
    setUpdatedSheet(sheet);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reset state when sheet changes
  }, [props.sheet.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        <AbcViewer
          sheet={sheet}
          listId={listId}
          initialTranspose={initialTranspose}
        />
      </div>
      <div className="border-t border-zinc-200 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {sheet.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {sheet.tags.length === 0 && (
            <span className="text-sm text-zinc-400">No tags</span>
          )}
          {isOwner && (
            <button
              onClick={() => setShowAddToList(true)}
              className="ml-auto rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Add to List
            </button>
          )}
        </div>
        {isOwner ? (
          <SheetEditor
            sheet={sheet}
            allTags={allTags}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updateContent={(content) =>
              setUpdatedSheet((prev) => ({ ...prev, content }))
            }
            updateTitle={(title) =>
              setUpdatedSheet((prev) => ({ ...prev, title }))
            }
            onCancel={() => setUpdatedSheet(props.sheet)}
          />
        ) : (
          <p className="text-sm text-zinc-400">
            Sign in as the owner to edit this sheet
          </p>
        )}
      </div>

      <AddToListDialog
        sheetId={sheet.id}
        sheetTitle={sheet.title}
        lists={lists}
        open={showAddToList}
        onOpenChange={setShowAddToList}
      />
    </div>
  );
}

function TagBadge({ name }: { name: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
      {name}
    </span>
  );
}

export function EmptyState(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-zinc-400">
      <div className="text-center">
        <p className="text-lg">Select a sheet or create a new one</p>
      </div>
    </div>
  );
}
