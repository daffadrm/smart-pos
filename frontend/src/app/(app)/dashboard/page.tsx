"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Alert } from "@/components/ui/Alert";

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
      {data && (
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
      )}
    </div>
  );
}
