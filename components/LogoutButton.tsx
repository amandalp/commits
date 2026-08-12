"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      aria-label="Sign out"
      className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-cream-deep hover:text-ink"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
