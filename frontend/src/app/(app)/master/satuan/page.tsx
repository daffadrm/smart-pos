"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Unit } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormRow, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { RowActions } from "@/components/ui/RowActions";

type FormState = { name: string; abbreviation: string };
const emptyForm: FormState = { name: "", abbreviation: "" };

export default function SatuanPage() {
  const [items, setItems] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.abbreviation ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function load() {
    setLoading(true);
    api
      .get<Unit[]>("/units")
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat satuan"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: Unit) {
    setEditing(item);
    setForm({ name: item.name, abbreviation: item.abbreviation ?? "" });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name: form.name, abbreviation: form.abbreviation || null };
      if (editing) {
        await api.put(`/units/${editing.id}`, payload);
      } else {
        await api.post("/units", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan satuan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.del(`/units/${deleting.id}`);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Gagal menghapus satuan");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Satuan" action={<Button onClick={openCreate}>+ Tambah Satuan</Button>} />
      {error && <Alert message={error} />}

      <Input
        placeholder="Cari nama atau singkatan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
      />

      <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Nama</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Singkatan</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  {items.length === 0 ? "Belum ada satuan" : "Satuan tidak ditemukan"}
                </td>
              </tr>
            )}
            {paginatedItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.abbreviation || "-"}</td>
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
            ))}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Satuan" : "Tambah Satuan"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert message={formError} />}
          <FormRow label="Nama" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </FormRow>
          <FormRow label="Singkatan">
            <Input
              value={form.abbreviation}
              onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
            />
          </FormRow>
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
        title="Hapus Satuan"
        message={`Yakin ingin menghapus satuan "${deleting?.name}"?`}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        loading={deleteLoading}
      />
    </div>
  );
}
