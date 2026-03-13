"use client";

import type { GetListsData } from "@/be/list/get-lists";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AbcViewer } from "./abc-viewer";
import { AddToListDialog } from "./add-to-list-dialog";
import { SheetEditor } from "./sheet-editor";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpdatedSheet(props.sheet);
    setIsEditing(false);
  }, [props.sheet.id, props.sheet.slug]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        <AbcViewer
          sheet={sheet}
          listId={listId}
          initialTranspose={initialTranspose}
        />
      </div>
      <div className="sticky bottom-0 border-t border-[oklch(0.92_0.02_160)] backdrop-blur-sm bg-white/80 p-4 print:hidden">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {sheet.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {sheet.tags.length === 0 && (
            <span className="text-sm text-[oklch(0.5_0.03_160)]">No tags</span>
          )}
          {isOwner && (
            <button
              onClick={() => setShowAddToList(true)}
              className="ml-auto rounded-xl border border-[oklch(0.85_0.04_160)] px-3 py-1.5 text-xs font-medium text-[oklch(0.4_0.05_160)] transition-all hover:bg-gradient-to-r hover:from-[oklch(0.96_0.02_160)] hover:to-[oklch(0.96_0.02_150)] hover:border-[oklch(0.7_0.08_160)]"
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

function TagBadge({ name }: { name: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[oklch(0.94_0.04_160)] to-[oklch(0.94_0.04_150)] px-3 py-1 text-xs font-medium text-[oklch(0.4_0.08_160)]">
      {name}
    </span>
  );
}

export function EmptyState(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-[oklch(0.5_0.03_160)]">
      <div className="text-center">
        <p className="text-lg">Select a sheet or create a new one</p>
      </div>
    </div>
  );
}
