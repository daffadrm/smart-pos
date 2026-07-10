"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PaymentMethod, Product, ProductListResponse, Sale, StoreSetting, Unit, UnitListResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, NumberInput, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { Receipt } from "@/components/Receipt";

type CartLine = { product_id: number; unit_id: number; qty: number };

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Kredit" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Transfer" },
  { value: "other", label: "Lainnya" },
];

const PRODUCT_SEARCH_LIMIT = 20;

export default function PenjualanPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [productCache, setProductCache] = useState<Map<number, Product>>(new Map());

  const [cart, setCart] = useState<CartLine[]>([]);

  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  function load() {
    Promise.all([api.get<UnitListResponse>("/units"), api.get<StoreSetting>("/store-settings")])
      .then(([u, s]) => {
        setUnits(u.items);
        setStoreSetting(s);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Gagal memuat data produk"));
  }

  useEffect(load, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(!!search.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) return;
    const params = new URLSearchParams({
      search: q,
      is_active: "true",
      page: "1",
      page_size: String(PRODUCT_SEARCH_LIMIT),
    });
    api
      .get<ProductListResponse>(`/products?${params.toString()}`)
      .then((res) => {
        setSearchResults(res.items);
        setSearchTotal(res.total);
        setProductCache((prev) => {
          const next = new Map(prev);
          res.items.forEach((p) => next.set(p.id, p));
          return next;
        });
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Gagal mencari produk"))
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  function unitName(id: number) {
    return units.find((u) => u.id === id)?.abbreviation || units.find((u) => u.id === id)?.name || "-";
  }
  function productName(id: number) {
    return productCache.get(id)?.name ?? `Produk #${id}`;
  }
  function baseUnitName(productId: number) {
    const product = productCache.get(productId);
    return product ? unitName(product.base_unit_id) : "-";
  }
  function findProductUnit(productId: number, unitId: number) {
    return productCache.get(productId)?.units.find((u) => u.unit_id === unitId);
  }

  function addToCart(product: Product) {
    const unitId = product.base_unit_id;
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id && l.unit_id === unitId);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product_id: product.id, unit_id: unitId, qty: 1 }];
    });
  }

  function updateLine(index: number, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce((sum, line) => {
    const pu = findProductUnit(line.product_id, line.unit_id);
    return sum + (pu ? pu.sell_price * line.qty : 0);
  }, 0);
  const discountNum = Number(discount) || 0;
  const taxNum = Number(tax) || 0;
  const total = Math.max(0, subtotal - discountNum + taxNum);
  const paidNum = Number(paidAmount) || 0;
  const change = paidNum - total;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const sale = await api.post<Sale>("/sales", {
        items: cart.map((l) => ({ product_id: l.product_id, unit_id: l.unit_id, qty: l.qty })),
        discount: discountNum,
        tax: taxNum,
        paid_amount: paidNum,
        payment_method: paymentMethod,
      });
      setCompletedSale(sale);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gagal memproses transaksi");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewSale() {
    setCompletedSale(null);
    setCart([]);
    setDiscount("0");
    setTax("0");
    setPaidAmount("");
    setPaymentMethod("cash");
    setSubmitError(null);
    load();
  }

  if (completedSale) {
    return (
      <div>
        <div className="no-print">
          <PageHeader title="Transaksi Berhasil" action={<Button onClick={startNewSale}>+ Transaksi Baru</Button>} />
        </div>
        <Receipt
          sale={completedSale}
          storeSetting={storeSetting}
          unitName={unitName}
          productName={productName}
          baseUnitName={baseUnitName}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Penjualan" />
      {loadError && <Alert message={loadError} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Input
            placeholder="Cari produk (nama, SKU, atau barcode)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="mb-3"
          />
          <div className="max-h-[520px] overflow-y-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
            {searching && <p className="p-4 text-sm text-gray-400">Mencari...</p>}
            {!searching && search.trim() === "" && (
              <p className="p-4 text-sm text-gray-400">Ketik nama, SKU, atau barcode produk untuk mencari...</p>
            )}
            {!searching && search.trim() !== "" && searchResults.length === 0 && (
              <p className="p-4 text-sm text-gray-400">Produk tidak ditemukan</p>
            )}
            {search.trim() !== "" && (
              <ul className="divide-y divide-gray-100">
                {searchResults.map((p) => {
                  const pu = p.units.find((u) => u.unit_id === p.base_unit_id);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.sku} &middot; Stok {p.stock} {unitName(p.base_unit_id)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{pu ? formatCurrency(pu.sell_price) : "-"}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {search.trim() !== "" && !searching && searchTotal > searchResults.length && (
              <p className="border-t border-gray-100 p-3 text-center text-xs text-gray-400">
                Menampilkan {searchResults.length} dari {searchTotal} hasil, perkecil kata kunci pencarian untuk hasil
                lebih spesifik.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
            <p className="mb-2 text-sm font-semibold text-gray-900">Keranjang</p>
            {cart.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Belum ada item</p>}
            <div className="space-y-3">
              {cart.map((line, i) => {
                const product = productCache.get(line.product_id);
                const pu = findProductUnit(line.product_id, line.unit_id);
                return (
                  <div key={i} className="rounded-md border border-gray-100 p-2.5">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900">{product?.name}</p>
                      <button onClick={() => removeLine(i)} className="text-xs text-red-500 hover:underline">
                        Hapus
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Select
                        value={line.unit_id}
                        onChange={(e) => updateLine(i, { unit_id: Number(e.target.value) })}
                        className="w-28 py-1 text-xs"
                      >
                        {product?.units.map((u) => (
                          <option key={u.unit_id} value={u.unit_id}>
                            {unitName(u.unit_id)}
                          </option>
                        ))}
                      </Select>
                      <NumberInput
                        value={String(line.qty)}
                        onChange={(raw) => updateLine(i, { qty: Math.max(1, Number(raw) || 0) })}
                        className="w-20 py-1 text-xs"
                      />
                      <p className="ml-auto text-sm font-medium text-gray-700">
                        {pu ? formatCurrency(pu.sell_price * line.qty) : "-"}
                      </p>
                    </div>
                    {pu && product && pu.conversion > 1 && (
                      <p className="mt-1 text-xs text-gray-400">
                        1 {unitName(line.unit_id)} {pu.conversion} {unitName(product.base_unit_id)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Diskon</span>
                <NumberInput
                  value={discount}
                  onChange={setDiscount}
                  className="w-32 py-1 text-right text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Pajak</span>
                <NumberInput
                  value={tax}
                  onChange={setTax}
                  className="w-32 py-1 text-right text-xs"
                />
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Metode</span>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-32 py-1 text-xs"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Bayar</span>
                <NumberInput
                  value={paidAmount}
                  onChange={setPaidAmount}
                  className="w-32 py-1 text-right text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Kembalian</span>
                <span className={`font-medium ${change < 0 ? "text-red-600" : "text-gray-900"}`}>
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            </div>

            {submitError && (
              <div className="mt-3">
                <Alert message={submitError} inline />
              </div>
            )}

            <Button
              className="mt-4 w-full"
              disabled={cart.length === 0 || paidNum < total || submitting}
              onClick={handleCheckout}
            >
              {submitting ? "Memproses..." : "Proses Transaksi"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
