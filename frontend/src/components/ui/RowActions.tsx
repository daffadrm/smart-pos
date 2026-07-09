"use client";

import { Pencil, Trash2 } from "lucide-react";

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={onEdit}
        className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
        aria-label="Edit"
        title="Edit"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
        aria-label="Hapus"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
