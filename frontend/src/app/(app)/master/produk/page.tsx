"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Category, Product, Unit } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { ImportProductsModal } from "@/components/ImportProductsModal";
import { BulkStockModal } from "@/components/BulkStockModal";
import { Pagination } from "@/components/ui/Pagination";
import { RowActions } from "@/components/ui/RowActions";

type UnitRow = { unit_id: string; conversion: string; buy_price: string; sell_price: string };
type FormState = {
  name: string;
  barcode: string;
  category_id: string;
  base_unit_id: string;
  min_stock: string;
  is_active: boolean;
  units: UnitRow[];
};

const emptyForm = (): FormState => ({
  name: "",
  barcode: "",
  category_id: "",
  base_unit_id: "",
  min_stock: "0",
  is_active: true,
  units: [{ unit_id: "", conversion: "1", buy_price: "", sell_price: "" }],
});

export default function ProdukPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStockOpen, setBulkStockOpen] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get<Product[]>("/products"), api.get<Category[]>("/categories"), api.get<Unit[]>("/units")])
      .then(([p, c, u]) => {
        setItems(p);
        setCategories(c);
        setUnits(u);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat produk"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function categoryName(id: number) {
    return categories.find((c) => c.id === id)?.name ?? "-";
  }
  function unitName(id: number) {
    return units.find((u) => u.id === id)?.name ?? "-";
  }
  function secondUnit(product: Product) {
    return product.units.find((u) => u.unit_id !== product.base_unit_id);
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        categoryName(p.category_id).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((p) => selectedIds.has(p.id));
  const selectedProducts = items.filter((p) => selectedIds.has(p.id));

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filteredItems.map((p) => p.id)));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: Product) {
    setEditing(item);
    setForm({
      name: item.name,
      barcode: item.barcode ?? "",
      category_id: String(item.category_id),
      base_unit_id: String(item.base_unit_id),
      min_stock: String(item.min_stock),
      is_active: item.is_active,
      units: item.units.map((u) => ({
        unit_id: String(u.unit_id),
        conversion: String(u.conversion),
        buy_price: String(u.buy_price),
        sell_price: String(u.sell_price),
      })),
    });
    setFormError(null);
    setModalOpen(true);
  }

  function updateUnitRow(index: number, patch: Partial<UnitRow>) {
    setForm((f) => ({
      ...f,
      units: f.units.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function addUnitRow() {
    setForm((f) => ({ ...f, units: [...f.units, { unit_id: "", conversion: "", buy_price: "", sell_price: "" }] }));
  }

  function removeUnitRow(index: number) {
    setForm((f) => ({ ...f, units: f.units.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        barcode: form.barcode || null,
        category_id: Number(form.category_id),
        base_unit_id: Number(form.base_unit_id),
        min_stock: Number(form.min_stock),
        is_active: form.is_active,
        units: form.units.map((u) => ({
          unit_id: Number(u.unit_id),
          conversion: Number(u.conversion),
          buy_price: Number(u.buy_price),
          sell_price: Number(u.sell_price),
        })),
      };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.del(`/products/${deleting.id}`);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Gagal menghapus produk");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Produk"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import Excel
            </Button>
            <Button onClick={openCreate}>+ Tambah Produk</Button>
          </div>
        }
      />
      {error && <Alert message={error} />}

      <Input
        placeholder="Cari nama, SKU, atau kategori..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
      />

      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5">
          <p className="text-sm text-indigo-700">{selectedIds.size} produk dipilih</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelectedIds(new Set())}>
              Batal Pilih
            </Button>
            <Button onClick={() => setBulkStockOpen(true)}>Tambah Stok untuk Produk Terpilih</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  aria-label={`Pilih semua ${filteredItems.length} produk`}
                  title={`Pilih semua ${filteredItems.length} produk`}
                />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Nama</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">SKU</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Kategori</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Satuan Dasar</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Satuan 2</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Harga Beli</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Harga Jual</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Stok</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Min. Stok</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-400">
                  Produk tidak ditemukan
                </td>
              </tr>
            )}
            {paginatedItems.map((item) => {
              const secondPu = secondUnit(item);
              return (
              <tr key={item.id} className={selectedIds.has(item.id) ? "bg-indigo-50/40" : undefined}>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Pilih ${item.name}`}
                  />
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.sku}</td>
                <td className="px-4 py-2.5 text-gray-600">{categoryName(item.category_id)}</td>
                <td className="px-4 py-2.5 text-gray-600">{unitName(item.base_unit_id)}</td>
                <td className="px-4 py-2.5 text-gray-600">{secondPu ? unitName(secondPu.unit_id) : "-"}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">
                  {secondPu ? formatCurrency(secondPu.buy_price) : "-"}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-600">
                  {secondPu ? formatCurrency(secondPu.sell_price) : "-"}
                </td>
                <td
                  className={`px-4 py-2.5 text-right ${item.stock <= item.min_stock ? "font-semibold text-amber-600" : "text-gray-600"}`}
                >
                  {item.stock.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-600">{item.min_stock.toLocaleString("id-ID")}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <RowActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => {
                      setDeleteError(null);
                      setDeleting(item);
                    }}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Produk" : "Tambah Produk"} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert message={formError} />}
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Nama Produk" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </FormRow>
            {editing ? (
              <FormRow label="SKU">
                <Input value={editing.sku} disabled />
              </FormRow>
            ) : (
              <FormRow label="SKU">
                <Input value="Dibuat otomatis setelah disimpan" disabled />
              </FormRow>
            )}
            <FormRow label="Barcode">
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </FormRow>
            <FormRow label="Kategori" required>
              <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Satuan Dasar" required>
              <Select
                value={form.base_unit_id}
                onChange={(e) => setForm({ ...form, base_unit_id: e.target.value })}
                required
              >
                <option value="">Pilih satuan</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Minimum Stok" required>
              <Input
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                required
              />
            </FormRow>
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Produk aktif
            </label>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Konversi Satuan &amp; Harga</p>
              <Button type="button" variant="secondary" onClick={addUnitRow}>
                + Baris Satuan
              </Button>
            </div>
            <p className="mb-2 text-xs text-gray-400">
              Satuan dasar harus ada di daftar ini dengan konversi 1. Contoh: PACK dengan konversi 24 berarti 1 PACK = 24
              satuan dasar.
            </p>
            <div className="space-y-2">
              {form.units.map((row, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <Select
                    className="col-span-3"
                    value={row.unit_id}
                    onChange={(e) => updateUnitRow(i, { unit_id: e.target.value })}
                    required
                  >
                    <option value="">Satuan</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    className="col-span-2"
                    type="number"
                    min={1}
                    placeholder="Konversi"
                    value={row.conversion}
                    onChange={(e) => updateUnitRow(i, { conversion: e.target.value })}
                    required
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    placeholder="Harga beli"
                    value={row.buy_price}
                    onChange={(e) => updateUnitRow(i, { buy_price: e.target.value })}
                    required
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    placeholder="Harga jual"
                    value={row.sell_price}
                    onChange={(e) => updateUnitRow(i, { sell_price: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeUnitRow(i)}
                    className="col-span-1 text-red-500 hover:text-red-700"
                    disabled={form.units.length <= 1}
                    title="Hapus baris"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus Produk"
        message={`Yakin ingin menghapus produk "${deleting?.name}"?`}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        loading={deleteLoading}
      />

      <ImportProductsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />

      <BulkStockModal
        open={bulkStockOpen}
        onClose={() => setBulkStockOpen(false)}
        products={selectedProducts}
        units={units}
        onDone={() => {
          load();
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
