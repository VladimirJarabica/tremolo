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
        content: `%%score { 1 2 }
V:1 clef=treble
G2B2G2
V:2 clef=bass
"G"G,,2[G,B,D]2[G,B,D]2`,
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
      className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
    >
      <Plus className="h-4 w-4" />
      {isCreating ? "Creating..." : "New"}
    </button>
  );
}
