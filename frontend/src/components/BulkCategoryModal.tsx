"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { CategoryBulkResult } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

function parseLines(text: string): { name: string; description: string | null }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name, ...rest] = line.split("|");
      const description = rest.join("|").trim();
      return { name: name.trim(), description: description || null };
    });
}

export function BulkCategoryModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CategoryBulkResult | null>(null);

  const items = parseLines(text);

  function handleClose() {
    setText("");
    setError(null);
    setResult(null);
    onClose();
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<CategoryBulkResult>("/categories/bulk", { items });
      if (res.errors.length === 0) {
        onDone();
        handleClose();
      } else {
        setResult(res);
        onDone();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan kategori");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Banyak Kategori" wide>
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Paste satu nama kategori per baris. Boleh tambah deskripsi dengan format{" "}
          <code className="rounded bg-gray-100 px-1">Nama | Deskripsi</code>. Nama yang sudah ada atau duplikat di
          daftar akan otomatis dilewati.
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"Elektronik\nAlat Tulis | Pensil, pulpen, buku\nMinuman"}
          disabled={submitting}
        />

        <p className="text-xs text-gray-400">{items.length} kategori siap disimpan</p>

        {error && <Alert message={error} inline />}

        {result && (
          <div className="space-y-2">
            <Alert
              variant={result.created === result.total_rows ? "success" : "error"}
              message={`${result.created} dari ${result.total_rows} kategori berhasil disimpan.`}
              inline
            />
            {result.errors.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Baris</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-600">{err.row}</td>
                        <td className="px-3 py-2 text-gray-600">{err.name ?? "-"}</td>
                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Tutup
          </Button>
          {!result && (
            <Button type="button" onClick={handleSubmit} disabled={items.length === 0 || submitting}>
              {submitting ? "Menyimpan..." : `Simpan ${items.length} Kategori`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
