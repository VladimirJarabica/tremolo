"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  total,
  itemsPerPage,
}: {
  currentPage: number;
  total: number;
  itemsPerPage: number;
}): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / itemsPerPage);

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 border-t border-zinc-200 p-4">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-zinc-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            className={`min-w-[40px] rounded-lg px-3 py-2 text-sm ${
              currentPage === page
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
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
