"use client";

import { useEffect, useRef } from "react";
import abcjs from "abcjs";

export function AbcViewer({
  content,
  title,
}: {
  title: string;
  content: string;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  const abcContent = `X:1\nT:${title}\n${content}`;
  console.log("content", content, abcContent);

  useEffect(() => {
    if (containerRef.current && content.trim()) {
      abcjs.renderAbc(containerRef.current, abcContent, {
        responsive: "resize",
        visualTranspose: 0,
      });
      // Clear any previous renders
      const children = containerRef.current.children;
      while (children.length > 1) {
        containerRef.current.removeChild(children[0]);
      }
    }
  }, [abcContent]);

  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        No content to preview
      </div>
    );
  }

  return <div ref={containerRef} className="abc-container" />;
}
