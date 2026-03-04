"use client";

import { useState } from "react";
import { AbcViewer } from "./abc-viewer";
import { SheetEditor } from "./sheet-editor";

export function SheetDetail({
  sheet,
  tags,
  allTags,
}: {
  sheet: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  };
  tags: { id: string; name: string }[];
  allTags: { id: string; name: string }[];
}): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(sheet.content);
  const [editingTitle, setEditingTitle] = useState(sheet.title);

  const displayContent = isEditing ? editingContent : sheet.content;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        <AbcViewer
          title={isEditing ? editingTitle : sheet.title}
          content={displayContent}
        />
      </div>
      <div className="border-t border-zinc-200 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-zinc-400">No tags</span>
          )}
        </div>
        <SheetEditor
          sheetId={sheet.id}
          initialContent={sheet.content}
          initialTitle={sheet.title}
          initialTagIds={tags.map((t) => t.id)}
          allTags={allTags}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
        />
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
