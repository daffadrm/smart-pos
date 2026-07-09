"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Product, StockMovementType, Unit } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type RowState = { unit_id: string; qty: string };
type RowResult = { productId: number; status: "ok" | "error"; message?: string };

export function BulkStockModal({
  open,
  onClose,
  products,
  units,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  units: Unit[];
  onDone: () => void;
}) {
  const [type, setType] = useState<StockMovementType>("in");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [bulkQty, setBulkQty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  function rowFor(p: Product): RowState {
    return rows[p.id] ?? { unit_id: String(p.base_unit_id), qty: "" };
  }
  function updateRow(p: Product, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [p.id]: { ...rowFor(p), ...patch } }));
  }
  function unitName(id: number) {
    return units.find((u) => u.id === id)?.name ?? "-";
  }

  function applyBulkQty() {
    if (!bulkQty || Number(bulkQty) <= 0) return;
    setRows((r) => {
      const next = { ...r };
      products.forEach((p) => {
        const current = r[p.id] ?? { unit_id: String(p.base_unit_id), qty: "" };
        next[p.id] = { ...current, qty: bulkQty };
      });
      return next;
    });
  }

  function handleClose() {
    setRows({});
    setResults(null);
    setNote("");
    setType("in");
    setBulkQty("");
    onClose();
  }

  async function handleSubmit() {
    const targets = products.filter((p) => Number(rowFor(p).qty) > 0);
    if (targets.length === 0) return;
    setSubmitting(true);
    const out: RowResult[] = [];
    for (const p of targets) {
      const row = rowFor(p);
      try {
        await api.post("/stock-movements", {
          product_id: p.id,
          unit_id: Number(row.unit_id),
          type,
          qty_input: Number(row.qty),
          note: note || null,
        });
        out.push({ productId: p.id, status: "ok" });
      } catch (err) {
        out.push({ productId: p.id, status: "error", message: err instanceof ApiError ? err.message : "Gagal" });
      }
    }
    setSubmitting(false);
    if (out.some((r) => r.status === "ok")) onDone();

    const allSucceeded = out.every((r) => r.status === "ok");
    if (allSucceeded) {
      handleClose();
    } else {
      setResults(out);
    }
  }

  const successCount = results?.filter((r) => r.status === "ok").length ?? 0;

  return (
    <Modal open={open} onClose={handleClose} title={`Tambah Stok untuk ${products.length} Produk`} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Jenis" required>
            <Select value={type} onChange={(e) => setType(e.target.value as StockMovementType)}>
              <option value="in">Tambah Stok</option>
              <option value="out">Kurangi Stok</option>
              <option value="adjustment">Stock Adjustment</option>
            </Select>
          </FormRow>
          <FormRow label="Catatan (opsional, berlaku untuk semua)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </FormRow>
        </div>

        {!results && (
          <FormRow label="Jumlah Massal">
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Contoh: 100"
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
                className="max-w-[160px]"
              />
              <Button type="button" variant="secondary" onClick={applyBulkQty} disabled={!bulkQty}>
                Terapkan ke Semua
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Isi angka lalu klik "Terapkan ke Semua" untuk mengisi kolom Jumlah di semua produk terpilih sekaligus.
              Baris tertentu masih bisa diubah manual setelahnya.
            </p>
          </FormRow>
        )}

        <p className="text-xs text-gray-400">
          Isi jumlah hanya untuk produk yang ingin diproses — baris dengan jumlah kosong akan dilewati.
        </p>

        {results && (
          <Alert
            variant={successCount === results.length ? "success" : "error"}
            message={`${successCount} dari ${results.length} produk berhasil diproses.`}
          />
        )}

        <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Produk</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Satuan</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Jumlah</th>
                {results && <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const row = rowFor(p);
                const result = results?.find((r) => r.productId === p.id);
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-gray-900">{p.name}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={row.unit_id}
                        onChange={(e) => updateRow(p, { unit_id: e.target.value })}
                        className="py-1 text-xs"
                        disabled={!!results}
                      >
                        {p.units.map((u) => (
                          <option key={u.unit_id} value={u.unit_id}>
                            {unitName(u.unit_id)}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) => updateRow(p, { qty: e.target.value })}
                        className="w-24 py-1 text-xs"
                        disabled={!!results}
                      />
                    </td>
                    {results && (
                      <td className="px-3 py-2">
                        {result ? (
                          result.status === "ok" ? (
                            <span className="text-green-600">Berhasil</span>
                          ) : (
                            <span className="text-red-600">{result.message}</span>
                          )
                        ) : (
                          <span className="text-gray-400">Dilewati</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Tutup
          </Button>
          {!results && (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Memproses..." : "Proses Semua"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
