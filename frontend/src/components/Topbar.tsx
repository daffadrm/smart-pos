"use client";

import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
          <p className="text-xs capitalize text-gray-500">{user.role}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {(user.full_name || user.username).charAt(0).toUpperCase()}
        </div>
        <Button variant="secondary" onClick={logout} className="!px-2.5">
          <LogOut size={16} />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
