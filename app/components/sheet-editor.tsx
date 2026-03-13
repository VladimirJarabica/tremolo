"use client";

import { useRouter } from "next/navigation";
import { createSheet } from "@/app/actions/create-sheet";
import { updateSheet } from "@/app/actions/update-sheet";
import { deleteSheet } from "@/app/actions/delete-sheet";
import { createTag } from "@/app/actions/create-tag";
import { TagSelector } from "./tag-selector";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import { useState } from "react";
import { Meter, Scale, type Scale as ScaleType } from "@/be/db/enums";
import { METER_OPTIONS, SCALE_OPTIONS } from "@/lib/constants";

export function SheetEditor({
  sheet,
  updateContent,
  updateTitle,
  updateAuthor,
  updateSource,
  updateMeter,
  updateTempo,
  updateScale,
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
  updateAuthor: (author: string) => void;
  updateSource: (source: string) => void;
  updateMeter: (meter: Meter) => void;
  updateTempo: (tempo: number) => void;
  updateScale: (scale: ScaleType) => void;
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
        author: sheet.author ?? undefined,
        source: sheet.source ?? undefined,
        meter: sheet.meter as Meter,
        tempo: sheet.tempo,
        scale: sheet.scale as ScaleType,
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
          className="rounded-xl bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[oklch(0.55_0.18_160/0.3)] transition-all hover:shadow-lg hover:shadow-[oklch(0.55_0.18_160/0.4)] hover:scale-[1.02] active:scale-[0.98]"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-xl border border-[oklch(0.85_0.04_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.4_0.05_160)] transition-all hover:bg-[oklch(0.96_0.02_160)] hover:border-[oklch(0.7_0.06_160)] disabled:opacity-50"
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
        className="w-full rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 p-3 text-lg font-medium text-[oklch(0.25_0.03_160)] placeholder:text-[oklch(0.55_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm"
        placeholder="Title"
      />
      <div className="flex gap-4">
        <input
          type="text"
          value={sheet.author ?? ""}
          onChange={(e) => updateAuthor(e.target.value)}
          className="flex-1 rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 p-3 text-sm text-[oklch(0.3_0.03_160)] placeholder:text-[oklch(0.55_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm"
          placeholder="Composer name"
        />
        <input
          type="text"
          value={sheet.source ?? ""}
          onChange={(e) => updateSource(e.target.value)}
          className="flex-1 rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 p-3 text-sm text-[oklch(0.3_0.03_160)] placeholder:text-[oklch(0.55_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm"
          placeholder="Source or reference"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="meter" className="text-sm font-medium text-[oklch(0.45_0.05_160)]">
            Meter
          </label>
          <select
            id="meter"
            value={sheet.meter}
            onChange={(e) => updateMeter(e.target.value as Meter)}
            className="rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.3_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm cursor-pointer"
          >
            {METER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="tempo" className="text-sm font-medium text-[oklch(0.45_0.05_160)]">
            Tempo
          </label>
          <input
            id="tempo"
            type="number"
            min={1}
            value={sheet.tempo}
            onChange={(e) => updateTempo(parseInt(e.target.value, 10) || 120)}
            className="w-20 rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.3_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm"
          />
          <span className="text-sm text-[oklch(0.5_0.04_160)]">BPM</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="scale" className="text-sm font-medium text-[oklch(0.45_0.05_160)]">
            Key
          </label>
          <select
            id="scale"
            value={sheet.scale}
            onChange={(e) => updateScale(e.target.value as ScaleType)}
            className="rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 px-3 py-2 text-sm text-[oklch(0.3_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm cursor-pointer"
          >
            {SCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={sheet.content}
        onChange={(e) => updateContent(e.target.value)}
        className="h-48 w-full rounded-xl border border-[oklch(0.92_0.02_160)] bg-white/80 p-3 font-mono text-sm text-[oklch(0.25_0.03_160)] placeholder:text-[oklch(0.55_0.03_160)] focus:border-[oklch(0.6_0.18_160)] focus:ring-2 focus:ring-[oklch(0.6_0.18_160/0.2)] focus:outline-none transition-all shadow-sm"
        placeholder="Enter ABC notation here (without T:, M:, Q:, K: lines)..."
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
          className="rounded-xl bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[oklch(0.55_0.18_160/0.3)] transition-all hover:shadow-lg hover:shadow-[oklch(0.55_0.18_160/0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-xl border border-[oklch(0.85_0.04_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.4_0.05_160)] transition-all hover:bg-[oklch(0.96_0.02_160)] hover:border-[oklch(0.7_0.06_160)]"
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
        content: `L:1/8
`,
        title: "New Tune",
        meter: Meter.m_2_4,
        tempo: 120,
        scale: Scale.C,
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
