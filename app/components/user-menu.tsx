"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/actions/auth";
import { AuthDialogs } from "./auth-dialogs";

export function UserMenu({
  user,
}: {
  user: { email: string } | null;
}): React.JSX.Element {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.refresh();
  }

  if (!user) {
    return (
      <>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogin(true)}
            className="text-[oklch(0.4_0.05_160)] hover:bg-[oklch(0.96_0.02_160)] hover:text-[oklch(0.3_0.06_160)]"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => setShowRegister(true)}
            className="bg-gradient-to-r from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-white shadow-md shadow-[oklch(0.55_0.18_160/0.3)] hover:shadow-lg"
          >
            Sign Up
          </Button>
        </div>
        <AuthDialogs
          showLogin={showLogin}
          showRegister={showRegister}
          onClose={() => {
            setShowLogin(false);
            setShowRegister(false);
          }}
        />
      </>
    );
  }

  const initials = user.email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-[oklch(0.96_0.02_160)]">
            <Avatar className="h-9 w-9 ring-2 ring-[oklch(0.85_0.04_160)]">
              <AvatarFallback className="bg-gradient-to-br from-[oklch(0.55_0.18_160)] to-[oklch(0.5_0.18_150)] text-sm font-medium text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="p-2">
            <p className="text-sm font-medium text-[oklch(0.25_0.03_160)]">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-[oklch(0.4_0.05_160)] focus:bg-[oklch(0.96_0.02_160)]">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
