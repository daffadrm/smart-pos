"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type FormState = {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "kasir";
  is_active: boolean;
};
const emptyForm: FormState = { username: "", email: "", password: "", full_name: "", role: "kasir", is_active: true };

export default function PenggunaPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<User[]>("/users")
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pengguna"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: User) {
    setEditing(item);
    setForm({
      username: item.username,
      email: item.email,
      password: "",
      full_name: item.full_name ?? "",
      role: item.role,
      is_active: item.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          username: form.username,
          email: form.email,
          password: form.password || null,
          full_name: form.full_name || null,
          role: form.role,
          is_active: form.is_active,
        });
      } else {
        await api.post("/users", {
          username: form.username,
          email: form.email,
          password: form.password,
          full_name: form.full_name || null,
          role: form.role,
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan pengguna");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.del(`/users/${deleting.id}`);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Gagal menghapus pengguna");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Pengguna" action={<Button onClick={openCreate}>+ Tambah Pengguna</Button>} />
      {error && <Alert message={error} />}

      <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Username</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Nama</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{item.username}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.full_name || "-"}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.email}</td>
                <td className="px-4 py-2.5 capitalize text-gray-600">{item.role}</td>
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
                  <button onClick={() => openEdit(item)} className="mr-3 text-indigo-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => setDeleting(item)} className="text-red-600 hover:underline">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Pengguna" : "Tambah Pengguna"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert message={formError} />}
          <FormRow label="Username" required>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoFocus />
          </FormRow>
          <FormRow label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </FormRow>
          <FormRow label="Nama Lengkap">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </FormRow>
          <FormRow label={editing ? "Password (kosongkan jika tidak diganti)" : "Password"} required={!editing}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
            />
          </FormRow>
          <FormRow label="Role" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "kasir" })}>
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
            </Select>
          </FormRow>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Akun aktif
            </label>
          )}
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
        title="Hapus Pengguna"
        message={`Yakin ingin menghapus pengguna "${deleting?.username}"? ${deleteError ?? ""}`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
