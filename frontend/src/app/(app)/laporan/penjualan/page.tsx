"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { SalesReportRow, TopProductRow } from "@/lib/types";
import { formatCurrency, formatDate, daysAgoISO, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { LineChart } from "@/components/charts/LineChart";

export default function LaporanPenjualanPage() {
  const [start, setStart] = useState(daysAgoISO(29));
  const [end, setEnd] = useState(todayISO());
  const [appliedRange, setAppliedRange] = useState({ start: daysAgoISO(29), end: todayISO() });
  const [rows, setRows] = useState<SalesReportRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<SalesReportRow[]>(`/reports/sales?start=${appliedRange.start}&end=${appliedRange.end}`),
      api.get<TopProductRow[]>(`/reports/top-products?start=${appliedRange.start}&end=${appliedRange.end}&limit=10`),
    ])
      .then(([sales, top]) => {
        setRows(sales);
        setTopProducts(top);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat laporan penjualan"))
      .finally(() => setLoading(false));
  }, [appliedRange]);

  const totalSales = rows.reduce((sum, r) => sum + r.total_sales, 0);
  const totalTransactions = rows.reduce((sum, r) => sum + r.total_transactions, 0);

  return (
    <div>
      <PageHeader title="Laporan Penjualan" />
      <DateRangeFilter
        start={start}
        end={end}
        onChangeStart={setStart}
        onChangeEnd={setEnd}
        onApply={() => setAppliedRange({ start, end })}
      />
      {error && <Alert message={error} />}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
          <p className="text-sm text-gray-500">Total penjualan</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalSales)}</p>
        </div>
        <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
          <p className="text-sm text-gray-500">Total transaksi</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalTransactions.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
        <p className="mb-3 text-sm font-semibold text-gray-900">Tren Penjualan Harian</p>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <LineChart
            data={rows.map((r) => ({ label: formatDate(r.date), value: r.total_sales }))}
            formatValue={formatCurrency}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Rincian Harian</p>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Tanggal</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.date}>
                  <td className="px-4 py-2 text-gray-600">{formatDate(r.date)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(r.total_sales)}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{r.total_transactions}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Produk Terlaris</p>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Produk</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Qty Terjual</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((p) => (
                <tr key={p.product_id}>
                  <td className="px-4 py-2 text-gray-900">{p.product_name}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{p.qty_sold_base}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(p.total_sales)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
