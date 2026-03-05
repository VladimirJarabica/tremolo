"use client";

import { cn } from "@/lib/utils";
import { SheetList } from "./sheet-list";
import { Header } from "./header";
import type { GetSheetsData } from "@/be/sheet/get-sheets";

import { useSidebar } from "./sidebar-provider";

export function AppShell({
  sheets,
  user,
  children,
}: {
  sheets: GetSheetsData;
  user: { email: string } | null;
  children: React.ReactNode;
}): React.JSX.Element {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Header - full width */}
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-zinc-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <SheetList sheets={sheets} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
