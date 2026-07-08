"use client";

import { Menu, X, Music2 } from "lucide-react";
import { NewSheetButton } from "./new-sheet-button";
import { ThemeToggle } from "./theme-toggle";
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
    <header className="flex w-full z-1 fixed top-0 h-14 items-center justify-between border-b border-border backdrop-blur-xl bg-card/80 px-4 print:hidden shadow-sm shadow-primary/10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors lg:hidden"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-brand-gradient shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40 transition-shadow">
            <Music2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
            Tremolo
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user && <NewSheetButton />}
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
