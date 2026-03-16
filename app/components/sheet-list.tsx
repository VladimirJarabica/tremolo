"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, Music2 } from "lucide-react";
import type { GetListsData } from "@/be/list/get-lists";
import { CreateListDialog } from "./list-dialogs";
import { SidebarListSection } from "./sidebar-list-section";
import Link from "next/link";
import { useSidebar } from "./sidebar-provider";

export function SheetList({
  lists,
  isLoggedIn,
}: {
  lists: GetListsData;
  isLoggedIn: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsOpen } = useSidebar();
  const currentListId = searchParams.get("list");
  const currentSlug = pathname.startsWith("/sheet/")
    ? pathname.replace("/sheet/", "")
    : undefined;

  // Extract list ID when on list page
  const listPageId = pathname.startsWith("/list/")
    ? pathname.replace("/list/", "")
    : undefined;

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {/* Home Link */}
        <div className="p-3 border-b border-[oklch(0.92_0.02_160)]">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[oklch(0.4_0.05_160)] hover:bg-[oklch(0.96_0.02_160)] transition-colors"
          >
            <Music2 className="h-4 w-4 text-[oklch(0.55_0.18_160)]" />
            All Sheets
          </Link>
        </div>

        {/* Lists Section */}
        {isLoggedIn && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 text-xs font-semibold uppercase tracking-wide text-[oklch(0.5_0.04_160)]">
                Lists
              </span>
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="rounded-lg p-1.5 text-[oklch(0.5_0.06_160)] hover:bg-linear-to-r hover:from-[oklch(0.96_0.02_160)] hover:to-[oklch(0.96_0.02_150)] hover:text-[oklch(0.45_0.12_160)] transition-all"
                title="Create new list"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {lists.length === 0 ? (
              <div className="mt-2 px-2 text-center text-sm text-[oklch(0.55_0.03_160)]">
                No lists yet
              </div>
            ) : (
              <ul className="space-y-1">
                {lists.map((list) => (
                  <SidebarListSection
                    key={list.id}
                    list={list}
                    currentSlug={currentSlug}
                    currentListId={currentListId}
                    listPageId={listPageId}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
