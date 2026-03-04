"use client";

import { useEffect, useRef, useState } from "react";
import abcjs from "abcjs";
import { SheetDetail } from "@/be/sheet/get-sheet";
import { getAbcNotationFromSheet } from "../utils/abc-notation";

export function AbcViewer({
  sheet,
}: {
  sheet: SheetDetail;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transpose, setTranspose] = useState(0);

  const abcContent = getAbcNotationFromSheet(sheet);
  console.log("content", sheet.content, abcContent);

  useEffect(() => {
    if (containerRef.current && sheet.content.trim()) {
      abcjs.renderAbc(containerRef.current, abcContent, {
        responsive: "resize",
        visualTranspose: transpose,
      });
      // Clear any previous renders
      const children = containerRef.current.children;
      while (children.length > 1) {
        containerRef.current.removeChild(children[0]);
      }
    }
  }, [abcContent, transpose]);

  if (!sheet.content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        No content to preview
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="abc-container" />
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-zinc-500">Transpose:</span>
        <button
          onClick={() => setTranspose((t) => t - 1)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-lg font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          -
        </button>
        <span className="min-w-12 text-center font-mono">
          {transpose > 0 ? `+${transpose}` : transpose}
        </span>
        <button
          onClick={() => setTranspose((t) => t + 1)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-lg font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </>
  );
}
