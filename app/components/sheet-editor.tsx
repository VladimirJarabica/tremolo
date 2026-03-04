"use client";

import { useRouter } from "next/navigation";
import { createSheet } from "@/app/actions/create-sheet";
import { updateSheet } from "@/app/actions/update-sheet";
import { deleteSheet } from "@/app/actions/delete-sheet";
import { createTag } from "@/app/actions/create-tag";
import { TagSelector } from "./tag-selector";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import { useState } from "react";

export function SheetEditor({
  sheet,
  updateContent,
  updateTitle,
  onCancel,
  allTags,
  isEditing,
  setIsEditing,
}: {
  sheet: SheetBySlug;
  allTags: { id: string; name: string }[];
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    sheet.tags.map((t) => t.id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    try {
      const result = await updateSheet({
        sheetId: sheet.id,
        content: sheet.content,
        title: sheet.title,
        tagIds: selectedTagIds,
      });
      if (result.success) {
        setIsEditing(false);
        const newSlug = result.data.slug;
        if (newSlug !== sheet.slug) {
          router.push(`/sheet/${newSlug}`);
        } else {
          router.refresh();
        }
      } else {
        alert("Failed to save: " + result.error.code);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!confirm("Are you sure you want to delete this sheet?")) {
      return;
    }
    setIsDeleting(true);
    try {
      const result = await deleteSheet({ sheetId: sheet.id });
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to delete: " + result.error.code);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCancel(): void {
    onCancel();
    setSelectedTagIds(sheet.tags.map((t) => t.id));
    setIsEditing(false);
  }

  async function handleCreateTag(name: string): Promise<string | null> {
    const result = await createTag({ name });
    if (result.success) {
      return result.data.id;
    }
    return null;
  }

  if (!isEditing) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={sheet.title}
        onChange={(e) => updateTitle(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 p-3 text-lg font-medium"
        placeholder="Title"
      />
      <textarea
        value={sheet.content}
        onChange={(e) => updateContent(e.target.value)}
        className="h-48 w-full rounded-lg border border-zinc-300 p-3 font-mono text-sm"
        placeholder="Enter ABC notation here (without T: line)..."
      />
      <TagSelector
        allTags={allTags}
        selectedIds={selectedTagIds}
        onChange={setSelectedTagIds}
        onCreateTag={handleCreateTag}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function NewSheetButton(): React.JSX.Element {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  async function handleClick(): Promise<void> {
    setIsCreating(true);
    try {
      const result = await createSheet({
        content: `M:2/4
L:1/8
Q:1/4=120
K:C
`,
        title: "New Tune",
      });
      if (result.success) {
        router.push(`/sheet/${result.data.slug}`);
        router.refresh();
      } else {
        alert("Failed to create sheet: " + result.error.code);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isCreating}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {isCreating ? "Creating..." : "New"}
    </button>
  );
}
