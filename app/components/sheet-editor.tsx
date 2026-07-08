"use client";

import { useRouter } from "next/navigation";
import { updateSheet } from "@/app/actions/update-sheet";
import { deleteSheet } from "@/app/actions/delete-sheet";
import type { SheetBySlug } from "@/be/sheet/get-sheet-by-slug";
import { useEffect, useRef, useState } from "react";
import { Meter, type Scale as ScaleType } from "@/be/db/enums";
import { METER_OPTIONS, SCALE_OPTIONS } from "@/lib/constants";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TempoInput } from "./tempo-input";

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
  isEditing,
  setIsEditing,
}: {
  sheet: SheetBySlug;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(true);

  // Latest-handler ref so the keydown listener can be attached once per
  // isEditing toggle without capturing a stale handleSave.
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    saveRef.current = handleSave;
  });

  // Cmd/Ctrl+S saves while editing. No-op when not editing.
  useEffect(() => {
    if (!isEditing) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isEditing]);

  async function handleSave(): Promise<void> {
    if (isSaving) return;
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
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:border-primary/40 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Collapsible metadata section */}
      <div className="rounded-xl border border-border bg-card/60">
        <button
          type="button"
          onClick={() => setMetadataExpanded(!metadataExpanded)}
          className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2">
            {metadataExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {sheet.title || "Untitled"}
            <span className="text-muted-foreground font-normal">
              • {sheet.author || "No author"}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {metadataExpanded ? "Collapse" : "Expand"}
          </span>
        </button>
        {metadataExpanded && (
          <div className="space-y-3 border-t border-border p-3">
            <input
              type="text"
              value={sheet.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/80 p-3 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm"
              placeholder="Title"
            />
            <div className="flex gap-4">
              <input
                type="text"
                value={sheet.author ?? ""}
                onChange={(e) => updateAuthor(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-card/80 p-3 text-sm text-secondary-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm"
                placeholder="Composer name"
              />
              <input
                type="text"
                value={sheet.source ?? ""}
                onChange={(e) => updateSource(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-card/80 p-3 text-sm text-secondary-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm"
                placeholder="Source or reference"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="meter" className="text-sm font-medium text-muted-foreground">
                  Meter
                </label>
                <select
                  id="meter"
                  value={sheet.meter}
                  onChange={(e) => updateMeter(e.target.value as Meter)}
                  className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm cursor-pointer"
                >
                  {METER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <TempoInput
                originalTempo={sheet.tempo}
                id={sheet.id}
                onUpdate={updateTempo}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="scale" className="text-sm font-medium text-muted-foreground">
                  Key
                </label>
                <select
                  id="scale"
                  value={sheet.scale}
                  onChange={(e) => updateScale(e.target.value as ScaleType)}
                  className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-secondary-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm cursor-pointer"
                >
                  {SCALE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Textarea - always visible */}
      <textarea
        value={sheet.content}
        onChange={(e) => updateContent(e.target.value)}
        className="min-h-32 flex-1 w-full rounded-xl border border-border bg-card/80 p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all shadow-sm"
        placeholder="Enter ABC notation here (without T:, M:, Q:, K: lines)..."
      />

      {/* Actions section */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:border-primary/40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
