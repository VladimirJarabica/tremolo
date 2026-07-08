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
            className="text-muted-foreground hover:bg-muted hover:text-secondary-foreground"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => setShowRegister(true)}
            className="bg-brand-gradient text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg"
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
          <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted">
            <Avatar className="h-9 w-9 ring-2 ring-input">
              <AvatarFallback className="bg-brand-gradient text-sm font-medium text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="p-2">
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-muted-foreground focus:bg-muted">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
