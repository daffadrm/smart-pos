"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Ruler,
  Users,
  Store,
  ShoppingCart,
  PackagePlus,
  History,
  BarChart3,
  TrendingUp,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[]; adminOnly?: boolean };

const NAV: (NavItem | NavGroup)[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Master",
    adminOnly: true,
    items: [
      { label: "Produk", href: "/master/produk", icon: Package },
      { label: "Kategori", href: "/master/kategori", icon: Tags },
      { label: "Satuan", href: "/master/satuan", icon: Ruler },
      { label: "Pengguna", href: "/master/pengguna", icon: Users },
      { label: "Pengaturan Toko", href: "/master/pengaturan-toko", icon: Store },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { label: "Penjualan", href: "/transaksi/penjualan", icon: ShoppingCart },
      { label: "Tambah Stok", href: "/transaksi/tambah-stok", icon: PackagePlus },
      { label: "Riwayat Transaksi", href: "/transaksi/riwayat", icon: History },
    ],
  },
  {
    label: "Laporan",
    adminOnly: true,
    items: [
      { label: "Penjualan", href: "/laporan/penjualan", icon: BarChart3 },
      { label: "Laba", href: "/laporan/laba", icon: TrendingUp },
      { label: "Stok", href: "/laporan/stok", icon: Boxes },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  function handleMouseEnter() {
    if (!collapsed || !linkRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return;
    const rect = linkRef.current.getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  function handleClick() {
    setTooltipPos(null);
    onNavigate();
  }

  return (
    <>
      <Link
        ref={linkRef}
        href={item.href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          collapsed ? "lg:justify-center" : ""
        } ${
          active
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon size={18} strokeWidth={2} className={active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"} />
        <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
      </Link>
      {collapsed &&
        tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-60 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            {item.label}
          </div>,
          document.body
        )}
    </>
  );
}

export function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  role: Role;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <span className={`text-lg font-bold tracking-tight text-indigo-600 ${collapsed ? "lg:hidden" : ""}`}>
            SmartPOS
          </span>
          {collapsed && <span className="mx-auto hidden text-lg font-bold text-indigo-600 lg:block">S</span>}
          <button onClick={onCloseMobile} className="text-gray-400 hover:text-gray-600 lg:hidden" aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>


        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            if (!isGroup(item)) {
              if (item.href === "/dashboard" && role !== "admin") return null;
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  collapsed={collapsed}
                  onNavigate={onCloseMobile}
                />
              );
            }

            if (item.adminOnly && role !== "admin") return null;

            const items =
              item.label === "Transaksi" && role !== "admin"
                ? item.items.filter((i) => i.href !== "/transaksi/tambah-stok")
                : item.items;

            return (
              <div key={item.label}>
                <p
                  className={`px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {item.label}
                </p>
                {collapsed && <div className="mx-2 mb-2 hidden border-t border-gray-100 lg:block" />}
                <div className="mt-1 space-y-0.5">
                  {items.map((sub) => (
                    <NavLink
                      key={sub.href}
                      item={sub}
                      active={pathname.startsWith(sub.href)}
                      collapsed={collapsed}
                      onNavigate={onCloseMobile}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <button
          onClick={onToggleCollapse}
          className="hidden shrink-0 items-center gap-2 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 lg:flex"
        >
          {collapsed ? <ChevronsRight size={18} /> : (
            <>
              <ChevronsLeft size={18} />
              <span>Ciutkan</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
