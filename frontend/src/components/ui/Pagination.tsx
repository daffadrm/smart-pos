"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const navButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">
          Menampilkan {start}-{end} dari {totalItems} data
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="hidden sm:inline">Baris/halaman</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 py-1 pl-2 pr-6 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={page <= 1}
          className={navButtonClass}
          aria-label="Halaman pertama"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={navButtonClass}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-sm text-gray-600">
          Halaman {page} dari {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={navButtonClass}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={page >= totalPages}
          className={navButtonClass}
          aria-label="Halaman terakhir"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
