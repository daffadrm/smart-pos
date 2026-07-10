"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { LowStockRow, StockValueRow } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

export default function LaporanStokPage() {
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [stockValue, setStockValue] = useState<StockValueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<LowStockRow[]>("/reports/low-stock"), api.get<StockValueRow[]>("/reports/stock-value")])
      .then(([low, value]) => {
        setLowStock(low);
        setStockValue(value);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat laporan stok"))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = stockValue.reduce((sum, r) => sum + r.value, 0);

  return (
    <div>
      <PageHeader title="Laporan Stok" />
      {error && <Alert message={error} />}

      <div className="mb-5 rounded-xl border border-gray-200/70 bg-white shadow-sm p-4 sm:w-72">
        <p className="text-sm text-gray-500">Total nilai stok</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Stok Menipis</p>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Produk</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Stok</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Min. Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center">
                    <div className="flex justify-center">
                      <Spinner size={20} />
                    </div>
                  </td>
                </tr>
              )}
              {!loading && lowStock.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Tidak ada produk yang menipis
                  </td>
                </tr>
              )}
              {lowStock.map((r) => (
                <tr key={r.product_id}>
                  <td className="px-4 py-2 text-gray-900">{r.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-amber-600">{r.stock}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{r.min_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Nilai Stok Saat Ini</p>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Produk</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Stok</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center">
                    <div className="flex justify-center">
                      <Spinner size={20} />
                    </div>
                  </td>
                </tr>
              )}
              {stockValue.map((r) => (
                <tr key={r.product_id}>
                  <td className="px-4 py-2 text-gray-900">{r.name}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{r.stock}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
