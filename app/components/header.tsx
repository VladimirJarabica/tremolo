"use client";

import { Menu, X, Music2 } from "lucide-react";
import { NewSheetButton } from "./new-sheet-button";
import { UserMenu } from "./user-menu";
import { useSidebar } from "./sidebar-provider";
import Link from "next/link";

export function Header({
  user,
}: {
  user: { email: string } | null;
}): React.JSX.Element {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <header className="flex w-full z-1 fixed top-0 h-14 items-center justify-between border-b border-[oklch(0.92_0.02_160)] backdrop-blur-xl bg-white/80 px-4 print:hidden shadow-sm shadow-[oklch(0.6_0.12_160/0.08)]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-[oklch(0.45_0.06_160)] hover:bg-[oklch(0.94_0.04_160)] transition-colors lg:hidden"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] shadow-md shadow-[oklch(0.55_0.18_160/0.3)] group-hover:shadow-lg group-hover:shadow-[oklch(0.55_0.18_160/0.4)] transition-shadow">
            <Music2 className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[oklch(0.5_0.18_160)] via-[oklch(0.45_0.18_160)] to-[oklch(0.5_0.18_150)] bg-clip-text text-transparent">
            Tremolo
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user && <NewSheetButton />}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
