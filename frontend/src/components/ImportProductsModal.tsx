"use client";

import { useRef, useState } from "react";
import { api, ApiError, downloadFile } from "@/lib/api";
import type { ProductImportResult } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ImportProductsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleDownloadTemplate() {
    try {
      await downloadFile("/products/import/template", "template_produk.xlsx");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunduh template");
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.postForm<ProductImportResult>("/products/import", formData);
      setResult(res);
      if (res.created > 0) onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengimpor file");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Produk dari Excel" wide>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p>
            Unduh template terlebih dahulu, isi data produk (satu baris per produk — Satuan 1 = satuan dasar, Satuan
            2 &amp; 3 opsional untuk produk dengan lebih dari satu satuan), lalu unggah kembali di sini. SKU dibuat
            otomatis oleh sistem. Kategori dan Satuan harus sudah dibuat di menu Master.
          </p>
          <button onClick={handleDownloadTemplate} className="mt-2 font-medium text-indigo-600 hover:underline">
            Unduh Template Excel
          </button>
        </div>

        {error && <Alert message={error} />}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xlsm"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />

        {result && (
          <div className="space-y-2">
            <Alert
              variant={result.errors.length === 0 ? "success" : "error"}
              message={`${result.created} dari ${result.total_rows} produk berhasil diimpor.${
                result.errors.length > 0 ? ` ${result.errors.length} gagal.` : ""
              }`}
            />
            {result.errors.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Baris</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Nama Produk</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-600">{err.row}</td>
                        <td className="px-3 py-2 text-gray-600">{err.product_name ?? "-"}</td>
                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Tutup
          </Button>
          <Button type="button" onClick={handleImport} disabled={!file || importing}>
            {importing ? "Mengimpor..." : "Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
