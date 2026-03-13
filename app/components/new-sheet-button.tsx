"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSheet } from "@/app/actions/create-sheet";
import { Meter, Scale } from "@/be/db/enums";

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
        content: `CDE`,
        title: "New Tune",
        meter: Meter.m_2_4,
        tempo: 120,
        scale: Scale.C,
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
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[oklch(0.55_0.18_160/0.3)] transition-all hover:shadow-lg hover:shadow-[oklch(0.55_0.18_160/0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
    >
      <Plus className="h-4 w-4" />
      {isCreating ? "Creating..." : "New"}
    </button>
  );
}
