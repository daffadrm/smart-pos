"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Product, ProductListResponse, Sale, StoreSetting, Unit, UnitListResponse } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { SaleDetailModal } from "@/components/SaleDetailModal";

function saleProfit(sale: Sale): number {
  return sale.items.reduce((sum, item) => sum + (item.sell_price - item.buy_price) * item.qty, 0);
}

export default function RiwayatTransaksiPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Sale[]>("/sales"),
      api.get<ProductListResponse>("/products"),
      api.get<UnitListResponse>("/units"),
      api.get<StoreSetting>("/store-settings"),
    ])
      .then(([s, p, u, ss]) => {
        setSales(s);
        setProducts(p.items);
        setUnits(u.items);
        setStoreSetting(ss);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat riwayat transaksi"))
      .finally(() => setLoading(false));
  }, []);

  function productName(id: number) {
    return products.find((p) => p.id === id)?.name ?? `Produk #${id}`;
  }
  function unitName(id: number) {
    return units.find((u) => u.id === id)?.abbreviation || units.find((u) => u.id === id)?.name || "-";
  }
  function baseUnitName(productId: number) {
    const product = products.find((p) => p.id === productId);
    return product ? unitName(product.base_unit_id) : "-";
  }

  return (
    <div>
      <PageHeader title="Riwayat Transaksi" />
      {error && <Alert message={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Nomor Nota</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Tanggal</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Kasir</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Total</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500">Laba</th>
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
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Belum ada transaksi
                </td>
              </tr>
            )}
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{sale.invoice_number}</td>
                <td className="px-4 py-2.5 text-gray-600">{formatDateTime(sale.created_at)}</td>
                <td className="px-4 py-2.5 text-gray-600">{sale.cashier.full_name || sale.cashier.username}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrency(sale.total)}</td>
                <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(saleProfit(sale))}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => setSelected(sale)} className="text-indigo-600 hover:underline">
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SaleDetailModal
        sale={selected}
        onClose={() => setSelected(null)}
        productName={productName}
        unitName={unitName}
        baseUnitName={baseUnitName}
        storeSetting={storeSetting}
      />
    </div>
  );
}
