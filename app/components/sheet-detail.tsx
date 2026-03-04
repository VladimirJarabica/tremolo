"use client";

import { useEffect, useState } from "react";
import { AbcViewer } from "./abc-viewer";
import { SheetEditor } from "./sheet-editor";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";

export function SheetDetail({
  allTags,
  currentUserId,
  ...props
}: {
  sheet: SheetBySlug;
  allTags: { id: string; name: string }[];
  currentUserId: string | null;
}): React.JSX.Element {
  const [updateSheet, setUpdatedSheet] = useState(props.sheet);
  const [isEditing, setIsEditing] = useState(false);

  const sheet = isEditing ? updateSheet : props.sheet;

  const isOwner = currentUserId === props.sheet.userId;

  // Reset editing state when sheet changes
  useEffect(() => {
    setUpdatedSheet(sheet);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reset state when sheet changes
  }, [props.sheet.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        <AbcViewer sheet={sheet} />
      </div>
      <div className="border-t border-zinc-200 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {sheet.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {sheet.tags.length === 0 && (
            <span className="text-sm text-zinc-400">No tags</span>
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
