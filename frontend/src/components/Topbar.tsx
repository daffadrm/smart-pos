"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = (user.full_name || user.username).charAt(0).toUpperCase();

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
        <div ref={containerRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="max-w-36 text-right sm:max-w-none">
              <p className="truncate text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
              <p className="truncate text-xs capitalize text-gray-500">{user.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {initial}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.full_name || user.username}</p>
                  <p className="truncate text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="truncate text-gray-900">{user.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Role</dt>
                  <dd className="capitalize text-gray-900">{user.role}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
        <Button variant="secondary" onClick={logout} className="!px-2.5">
          <LogOut size={16} />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
