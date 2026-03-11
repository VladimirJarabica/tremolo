"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { GetListsData } from "@/be/list/get-lists";
import { CreateListDialog } from "./list-dialogs";
import { SidebarListSection } from "./sidebar-list-section";

export function SheetList({
  lists,
  isLoggedIn,
}: {
  lists: GetListsData;
  isLoggedIn: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentListId = searchParams.get("list");
  const currentSlug = pathname.startsWith("/sheet/")
    ? pathname.replace("/sheet/", "")
    : undefined;

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
      </div>

      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
