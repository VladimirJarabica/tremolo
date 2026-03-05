"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSheet } from "@/app/actions/create-sheet";

import { useSidebar } from "./sidebar-provider";

import { Plus } from "lucide-react";

export function NewSheetButton(): React.JSX.Element {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { setIsOpen } = useSidebar();

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
        setIsOpen(false);
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
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      <Plus className="h-4 w-4" />
      {isCreating ? "Creating..." : "New"}
    </button>
  );
}
