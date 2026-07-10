"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Product, ProductListResponse, StockMovement, StockMovementType, Unit, UnitListResponse } from "@/lib/types";
import { formatDateTime, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, NumberInput, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

const TYPE_LABEL: Record<StockMovementType, string> = {
  in: "Tambah Stok",
  out: "Kurangi Stok",
  adjustment: "Stock Adjustment",
};

export default function TambahStokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState(todayISO());

  const [productId, setProductId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [type, setType] = useState<StockMovementType>("in");
  const [qtyInput, setQtyInput] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function loadReferenceData() {
    Promise.all([api.get<ProductListResponse>("/products"), api.get<UnitListResponse>("/units")])
      .then(([p, u]) => {
        setProducts(p.items);
        setUnits(u.items);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat data"));
  }

  function loadMovements(date: string) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    api
      .get<StockMovement[]>(`/stock-movements?${params.toString()}`)
      .then(setMovements)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat riwayat stok"))
      .finally(() => setMovementsLoading(false));
  }

  useEffect(() => {
    loadReferenceData();
    loadMovements(dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === productId);

  function productName(id: number) {
    return products.find((p) => p.id === id)?.name ?? `Produk #${id}`;
  }
  function unitName(id: number) {
    return units.find((u) => u.id === id)?.name ?? "-";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSuccess(null);
    try {
      await api.post("/stock-movements", {
        product_id: Number(productId),
        unit_id: Number(unitId),
        type,
        qty_input: Number(qtyInput),
        note: note || null,
      });
      setSuccess("Pergerakan stok berhasil dicatat.");
      setQtyInput("");
      setNote("");
      loadReferenceData();
      loadMovements(dateFilter);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal mencatat pergerakan stok");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tambah Stok" />
      {error && <Alert message={error} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200/70 bg-white shadow-sm p-5">
          {formError && <Alert message={formError} />}
          {success && <Alert message={success} variant="success" />}

          <FormRow label="Produk" required>
            <Select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setUnitId("");
              }}
              required
            >
              <option value="">Pilih produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stok: {p.stock})
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Satuan" required>
            <Select value={unitId} onChange={(e) => setUnitId(e.target.value)} required disabled={!selectedProduct}>
              <option value="">Pilih satuan</option>
              {selectedProduct?.units.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  {unitName(u.unit_id)}
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Jenis" required>
            <Select value={type} onChange={(e) => setType(e.target.value as StockMovementType)} required>
              <option value="in">Tambah Stok</option>
              <option value="out">Kurangi Stok</option>
              <option value="adjustment">Stock Adjustment</option>
            </Select>
            {type === "adjustment" && (
              <p className="mt-1 text-xs text-gray-400">
                Jumlah yang diisi adalah stok akhir (absolut) dalam satuan terpilih, bukan penambahan/pengurangan.
              </p>
            )}
          </FormRow>

          <FormRow label={type === "adjustment" ? "Jumlah Stok Akhir" : "Jumlah"} required>
            <NumberInput value={qtyInput} onChange={setQtyInput} required />
          </FormRow>

          <FormRow label="Catatan">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </FormRow>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>

        <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Riwayat Terbaru</p>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setMovementsLoading(true);
                loadMovements(e.target.value);
              }}
              className="w-auto py-1 text-xs"
            />
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <tbody className="divide-y divide-gray-100">
                {movementsLoading && (
                  <tr>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Spinner size={20} />
                      </div>
                    </td>
                  </tr>
                )}
                {!movementsLoading && movements.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-center text-gray-400">Belum ada pergerakan stok pada tanggal ini</td>
                  </tr>
                )}
                {!movementsLoading && movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{productName(m.product_id)}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(m.created_at)}</p>
                      {m.note && <p className="text-xs text-gray-400">{m.note}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <p className="text-xs text-gray-500">{TYPE_LABEL[m.type]}</p>
                      <p className={`font-medium ${m.qty_base < 0 ? "text-red-600" : "text-green-600"}`}>
                        {m.qty_base > 0 ? "+" : ""}
                        {m.qty_base}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
