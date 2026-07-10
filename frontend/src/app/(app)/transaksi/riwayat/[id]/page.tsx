"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Product, ProductListResponse, Sale, StoreSetting, Unit, UnitListResponse } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Receipt } from "@/components/Receipt";

export default function RiwayatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Sale>(`/sales/${params.id}`),
      api.get<ProductListResponse>("/products"),
      api.get<UnitListResponse>("/units"),
      api.get<StoreSetting>("/store-settings"),
    ])
      .then(([s, p, u, ss]) => {
        setSale(s);
        setProducts(p.items);
        setUnits(u.items);
        setStoreSetting(ss);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat transaksi"))
      .finally(() => setLoading(false));
  }, [params.id]);

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
      <div className="no-print">
        <PageHeader
          title="Detail Transaksi"
          action={
            <Button variant="secondary" onClick={() => router.push("/transaksi/riwayat")}>
              &larr; Kembali
            </Button>
          }
        />
      </div>
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {error && <Alert message={error} />}
      {sale && (
        <Receipt
          sale={sale}
          storeSetting={storeSetting}
          unitName={unitName}
          productName={productName}
          baseUnitName={baseUnitName}
        />
      )}
    </div>
  );
}
