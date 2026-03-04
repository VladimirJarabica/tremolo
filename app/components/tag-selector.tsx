"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function TagSelector({
  allTags,
  selectedIds,
  onChange,
  onCreateTag,
}: {
  allTags: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag: (name: string) => Promise<string | null>;
}): React.JSX.Element {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id));
  const filteredTags = allTags.filter(
    (t) =>
      !selectedIds.includes(t.id) &&
      t.name.toLowerCase().includes(inputValue.toLowerCase())
  );
  const showCreateOption =
    inputValue.trim() &&
    !allTags.some((t) => t.name.toLowerCase() === inputValue.toLowerCase());

  function handleSelect(tagId: string): void {
    onChange([...selectedIds, tagId]);
    setInputValue("");
    setIsOpen(false);
  }

  function handleRemove(tagId: string): void {
    onChange(selectedIds.filter((id) => id !== tagId));
  }

  async function handleCreate(): Promise<void> {
    if (!inputValue.trim()) return;
    setIsCreating(true);
    try {
      const newId = await onCreateTag(inputValue.trim());
      if (newId) {
        onChange([...selectedIds, newId]);
        setInputValue("");
        setIsOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
          >
            {tag.name}
            <button
              onClick={() => handleRemove(tag.id)}
              className="ml-1 hover:text-zinc-900"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Add tag..."
          className="min-w-[100px] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
      {isOpen && (filteredTags.length > 0 || showCreateOption) && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleSelect(tag.id)}
              className={cn(
                "block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
              )}
            >
              {tag.name}
            </button>
          ))}
          {showCreateOption && (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="block w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-zinc-100"
            >
              {isCreating ? "Creating..." : `Create "${inputValue}"`}
            </button>
          )}
        </div>
      )}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
