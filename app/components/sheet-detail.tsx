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
        {/* Tags section under the sheet */}
        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          {sheet.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {sheet.tags.length === 0 && (
            <span className="text-sm text-[oklch(0.5_0.03_160)]">No tags</span>
          )}
          {isOwner && (
            <button
              onClick={() => setShowAddToList(true)}
              className="rounded-xl border border-[oklch(0.85_0.04_160)] px-3 py-1.5 text-xs font-medium text-[oklch(0.4_0.05_160)] transition-all hover:bg-linear-to-r hover:from-[oklch(0.96_0.02_160)] hover:to-[oklch(0.96_0.02_150)] hover:border-[oklch(0.7_0.08_160)]"
            >
              Add to List
            </button>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 max-h-[50vh] overflow-auto border-t border-[oklch(0.92_0.02_160)] backdrop-blur-sm bg-white/80 p-4 print:hidden">
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
    <span className="inline-flex items-center rounded-full bg-linear-to-r from-[oklch(0.94_0.04_160)] to-[oklch(0.94_0.04_150)] px-3 py-1 text-xs font-medium text-[oklch(0.4_0.08_160)]">
      {name}
    </span>
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
          ? "inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.7_0.08_160)] bg-[oklch(0.94_0.04_160)] px-3 py-1 text-xs font-medium text-[oklch(0.35_0.08_160)]"
          : "inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.85_0.04_160)] bg-white px-3 py-1 text-xs font-medium text-[oklch(0.4_0.05_160)] transition-colors hover:bg-[oklch(0.97_0.02_160)] hover:border-[oklch(0.7_0.06_160)]"
      }
    >
      <span>{name}</span>
      {transposeLabel !== null && (
        <span
          className={
            isActive
              ? "rounded bg-[oklch(0.85_0.06_160)] px-1.5 py-0.5 text-[10px] text-[oklch(0.3_0.08_160)]"
              : "rounded bg-[oklch(0.95_0.03_160)] px-1.5 py-0.5 text-[10px] text-[oklch(0.45_0.06_160)]"
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
    <div className="flex h-full items-center justify-center text-[oklch(0.5_0.03_160)]">
      <div className="text-center">
        <p className="text-lg">Select a sheet or create a new one</p>
      </div>
    </div>
  );
}
