"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, Music2, Ear } from "lucide-react";
import type { GetListsData } from "@/be/list/get-lists";
import { CreateListDialog } from "./list-dialogs";
import { SidebarListSection } from "./sidebar-list-section";
import Link from "next/link";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";

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
        {/* Primary nav links */}
        <nav className="p-3 border-b border-border">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Music2 className="h-4 w-4 text-primary" />
            All Sheets
          </Link>
          <Link
            href="/trainer"
            onClick={() => setIsOpen(false)}
            className={cn(
              "mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/trainer")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Ear className="h-4 w-4 text-primary" />
            Pitch Trainer
          </Link>
        </nav>

        {/* Lists Section */}
        {isLoggedIn && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lists
              </span>
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                title="Create new list"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {lists.length === 0 ? (
              <div className="mt-2 px-2 text-center text-sm text-muted-foreground">
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
