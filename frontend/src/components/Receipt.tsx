"use client";

import type { Sale, StoreSetting } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  debit: "Debit",
  credit: "Kredit",
  qris: "QRIS",
  transfer: "Transfer",
  other: "Lainnya",
};

export function Receipt({
  sale,
  storeSetting,
  unitName,
  productName,
}: {
  sale: Sale;
  storeSetting: StoreSetting | null;
  unitName: (id: number) => string;
  productName: (id: number) => string;
}) {
  return (
    <div>
      <div className="mx-auto max-w-sm rounded-xl border border-gray-200/70 bg-white shadow-sm p-5 text-sm">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">{storeSetting?.store_name ?? "Toko"}</p>
          {storeSetting?.address && <p className="text-xs text-gray-500">{storeSetting.address}</p>}
          {storeSetting?.phone && <p className="text-xs text-gray-500">{storeSetting.phone}</p>}
        </div>
        <div className="my-3 border-t border-dashed border-gray-300" />
        <div className="space-y-0.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>No. Nota</span>
            <span className="font-medium text-gray-900">{sale.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{formatDateTime(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>{sale.cashier.full_name || sale.cashier.username}</span>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-gray-300" />
        <div className="space-y-1.5">
          {sale.items.map((item) => (
            <div key={item.id} className="text-xs">
              <p className="text-gray-900">{productName(item.product_id)}</p>
              <div className="flex justify-between text-gray-500">
                <span>
                  {item.qty} {unitName(item.unit_id)} x {formatCurrency(item.sell_price)}
                </span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-gray-300" />
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Diskon</span>
              <span>-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Pajak</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Bayar ({PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method})</span>
            <span>{formatCurrency(sale.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Kembalian</span>
            <span>{formatCurrency(sale.change_amount)}</span>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-gray-300" />
        <p className="text-center text-xs text-gray-500">
          {storeSetting?.receipt_footer ?? "Terima kasih telah berbelanja."}
        </p>
      </div>
      <div className="no-print mt-4 flex justify-center">
        <Button onClick={() => window.print()}>Cetak Nota</Button>
      </div>
    </div>
  );
}
