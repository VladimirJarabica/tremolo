"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { GetSheetsData } from "@/be/sheet/get-sheets";
import type { GetListsData } from "@/be/list/get-lists";
import { CreateListDialog } from "./list-dialogs";
import { SidebarListSection } from "./sidebar-list-section";

export function SheetList({
  sheets,
  lists,
  isLoggedIn,
}: {
  sheets: GetSheetsData;
  lists: GetListsData;
  isLoggedIn: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentListId = searchParams.get("list");
  const currentSlug = pathname.startsWith("/sheet/")
    ? pathname.replace("/sheet/", "")
    : undefined;

  const [expandedAllSheets, setExpandedAllSheets] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {/* Lists Section */}
        {isLoggedIn && (
          <div className="p-2">
            <div className="flex items-center justify-between">
              <span className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Lists
              </span>
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                title="Create new list"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {lists.length === 0 ? (
              <div className="mt-2 px-2 text-center text-sm text-zinc-500">
                No lists yet
              </div>
            ) : (
              <ul className="mt-1 space-y-1">
                {lists.map((list) => (
                  <SidebarListSection
                    key={list.id}
                    list={list}
                    currentSlug={currentSlug}
                    currentListId={currentListId}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* All Sheets Section */}
        <div className="border-y border-zinc-200 p-2">
          <button
            type="button"
            onClick={() => setExpandedAllSheets((prev) => !prev)}
            className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-100"
          >
            {expandedAllSheets ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            All Sheets
            <span className="ml-auto text-xs">{sheets.length}</span>
          </button>
          {expandedAllSheets &&
            (sheets.length === 0 ? (
              <div className="px-4 py-2 text-center text-sm text-zinc-500">
                No sheets yet
              </div>
            ) : (
              <ul className="mt-1 space-y-1">
                {sheets.map((sheet) => (
                  <SheetListItem
                    key={sheet.id}
                    slug={sheet.slug}
                    title={sheet.title}
                    createdAt={sheet.createdAt}
                    isActive={sheet.slug === currentSlug && !currentListId}
                  />
                ))}
              </ul>
            ))}
        </div>
      </div>

      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
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
