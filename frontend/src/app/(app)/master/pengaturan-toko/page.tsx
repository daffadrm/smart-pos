"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { StoreSetting } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type FormState = {
  store_name: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
  receipt_paper_size: string;
  receipt_footer: string;
  transaction_number_format: string;
};

export default function PengaturanTokoPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<StoreSetting>("/store-settings")
      .then((data) =>
        setForm({
          store_name: data.store_name,
          logo_url: data.logo_url ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          receipt_paper_size: data.receipt_paper_size,
          receipt_footer: data.receipt_footer,
          transaction_number_format: data.transaction_number_format,
        })
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pengaturan toko"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put("/store-settings", {
        ...form,
        logo_url: form.logo_url || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
      });
      setSuccess("Pengaturan toko berhasil disimpan.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan pengaturan toko");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Pengaturan Toko" />
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {error && <Alert message={error} />}
      {success && <Alert message={success} variant="success" />}

      {form && (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-gray-200/70 bg-white shadow-sm p-6">
          <FormRow label="Nama Toko" required>
            <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
          </FormRow>
          <FormRow label="Logo (URL)">
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </FormRow>
          <FormRow label="Alamat">
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          </FormRow>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Telepon">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormRow>
            <FormRow label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FormRow>
          </div>
          <FormRow label="Ukuran Kertas Nota" required>
            <Select
              value={form.receipt_paper_size}
              onChange={(e) => setForm({ ...form, receipt_paper_size: e.target.value })}
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
              <option value="A4">A4</option>
            </Select>
          </FormRow>
          <FormRow label="Footer Nota">
            <Textarea
              value={form.receipt_footer}
              onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              rows={2}
            />
          </FormRow>
          <FormRow label="Format Nomor Transaksi" required>
            <Input
              value={form.transaction_number_format}
              onChange={(e) => setForm({ ...form, transaction_number_format: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Token: {"{YYYY}"} {"{MM}"} {"{DD}"} {"{YYYYMMDD}"} dan urutan angka misal {"{0001}"}
            </p>
          </FormRow>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
