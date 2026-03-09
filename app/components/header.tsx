"use client";

import { Menu, X } from "lucide-react";
import { NewSheetButton } from "./new-sheet-button";
import { UserMenu } from "./user-menu";
import { useSidebar } from "./sidebar-provider";

export function Header({
  user,
}: {
  user: { email: string } | null;
}): React.JSX.Element {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <header className="flex w-full z-1 fixed top-0 h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 print:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="text-xl font-semibold">Tremolo</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && <NewSheetButton />}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
