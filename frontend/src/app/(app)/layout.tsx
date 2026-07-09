"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

const ADMIN_ONLY_PREFIXES = ["/dashboard", "/master", "/laporan", "/transaksi/tambah-stok"];

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const forbidden = !!user && user.role !== "admin" && isAdminOnlyRoute;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (forbidden) {
      router.replace("/transaksi/penjualan");
    }
  }, [loading, user, forbidden, router]);

  if (loading || !user || forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Memuat...</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
