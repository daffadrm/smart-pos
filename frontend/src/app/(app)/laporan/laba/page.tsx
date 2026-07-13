"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ProfitReportRow } from "@/lib/types";
import { formatCurrency, formatDate, daysAgoISO, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { LineChart } from "@/components/charts/LineChart";

export default function LaporanLabaPage() {
  const [start, setStart] = useState(daysAgoISO(29));
  const [end, setEnd] = useState(todayISO());
  const [appliedRange, setAppliedRange] = useState({ start: daysAgoISO(29), end: todayISO() });
  const [rows, setRows] = useState<ProfitReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<ProfitReportRow[]>(`/reports/profit?start=${appliedRange.start}&end=${appliedRange.end}`)
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat laporan laba"))
      .finally(() => setLoading(false));
  }, [appliedRange]);

  const totalProfit = rows.reduce((sum, r) => sum + r.total_profit, 0);

  return (
    <div>
      <PageHeader title="Laporan Laba" />
      <DateRangeFilter
        start={start}
        end={end}
        onChangeStart={setStart}
        onChangeEnd={setEnd}
        onApply={() => setAppliedRange({ start, end })}
      />
      {error && <Alert message={error} />}

      <div className="mb-5 rounded-xl border border-gray-200/70 bg-white shadow-sm p-4 sm:w-72">
        <p className="text-sm text-gray-500">Total laba periode ini</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalProfit)}</p>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
        <p className="mb-3 text-sm font-semibold text-gray-900">Tren Laba Harian</p>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <LineChart
            data={rows.map((r) => ({ label: formatDate(r.date), value: r.total_profit }))}
            formatValue={formatCurrency}
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Rincian Harian</p>
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Tanggal</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Laba</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.date}>
                <td className="px-4 py-2 text-gray-600">{formatDate(r.date)}</td>
                <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(r.total_profit)}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
