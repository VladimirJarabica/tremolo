"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { GetSheetsData } from "@/be/sheet/get-sheets";

export function SheetList({
  sheets,
}: {
  sheets: GetSheetsData;
}): React.JSX.Element {
  const pathname = usePathname();
  const currentSlug = pathname.startsWith("/sheet/")
    ? pathname.replace("/sheet/", "")
    : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {sheets.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            No sheets yet. Click &quot;New&quot; to create one.
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {sheets.map((sheet) => (
              <SheetListItem
                key={sheet.id}
                slug={sheet.slug}
                title={sheet.title}
                createdAt={sheet.createdAt}
                isActive={sheet.slug === currentSlug}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SheetListItem({
  slug,
  title,
  createdAt,
  isActive,
}: {
  slug: string;
  title: string;
  createdAt: Date;
  isActive: boolean;
}): React.JSX.Element {
  return (
    <li>
      <Link
        href={`/sheet/${slug}`}
        className={cn(
          "block rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-50",
        )}
      >
        <div className="truncate font-medium">{title || "Untitled"}</div>
        <div className="text-xs text-zinc-400">
          {format(createdAt, "d. MMMM yyyy")}
        </div>
      </Link>
    </li>
  );
}
