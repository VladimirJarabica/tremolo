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
    <div className="flex items-center justify-center gap-1.5 border-t border-[oklch(0.92_0.02_160)] backdrop-blur-sm bg-white/60 p-4">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl p-2 text-[oklch(0.4_0.04_160)] hover:bg-[oklch(0.96_0.02_160)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[oklch(0.5_0.03_160)]">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            className={`min-w-[40px] rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              currentPage === page
                ? "bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-white shadow-md shadow-[oklch(0.55_0.18_160/0.25)]"
                : "text-[oklch(0.4_0.04_160)] hover:bg-[oklch(0.96_0.02_160)]"
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
        className="rounded-xl p-2 text-[oklch(0.4_0.04_160)] hover:bg-[oklch(0.96_0.02_160)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
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
