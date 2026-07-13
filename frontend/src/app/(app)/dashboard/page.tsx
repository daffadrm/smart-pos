"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { LineChart } from "@/components/charts/LineChart";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>("/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat dashboard"));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" />
      {error && <Alert message={error} />}
      {!data && !error && (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Penjualan hari ini" value={formatCurrency(data.sales_today)} />
            <StatTile label="Laba hari ini" value={formatCurrency(data.profit_today)} />
            <StatTile label="Transaksi hari ini" value={data.transactions_today.toLocaleString("id-ID")} />
            <StatTile label="Jumlah produk" value={data.product_count.toLocaleString("id-ID")} />
            <StatTile label="Total stok" value={data.total_stock.toLocaleString("id-ID")} />
            <StatTile
              label="Produk hampir habis"
              value={data.low_stock_count.toLocaleString("id-ID")}
              tone={data.low_stock_count > 0 ? "warning" : "default"}
            />
          </div>

          <div className="mt-5 rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Tren Penjualan 7 Hari Terakhir</p>
            <LineChart
              data={data.sales_trend.map((r) => ({ label: formatDate(r.date), value: r.total_sales }))}
              formatValue={formatCurrency}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Produk Hampir Habis</p>
                <Link href="/transaksi/tambah-stok" className="text-xs font-medium text-indigo-600 hover:underline">
                  + Tambah Stok
                </Link>
              </div>
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Produk</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Stok</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Min. Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.low_stock_items.map((row) => (
                    <tr key={row.product_id}>
                      <td className="px-4 py-2 text-gray-900">{row.name}</td>
                      <td className="px-4 py-2 text-right font-medium text-amber-600">{row.stock}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{row.min_stock}</td>
                    </tr>
                  ))}
                  {data.low_stock_items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        Tidak ada produk yang hampir habis
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
              <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                Produk Terlaris (7 Hari Terakhir)
              </p>
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Produk</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Terjual</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.top_products.map((row) => (
                    <tr key={row.product_id}>
                      <td className="px-4 py-2 text-gray-900">{row.product_name}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{row.qty_sold_base}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(row.total_sales)}
                      </td>
                    </tr>
                  ))}
                  {data.top_products.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        Belum ada penjualan dalam 7 hari terakhir
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
