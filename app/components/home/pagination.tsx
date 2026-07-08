"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  total,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}): React.JSX.Element | null {
  const totalPages = Math.ceil(total / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-border backdrop-blur-sm bg-card/60 p-4">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              currentPage === page
                ? "bg-brand-gradient text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function getVisiblePages(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
