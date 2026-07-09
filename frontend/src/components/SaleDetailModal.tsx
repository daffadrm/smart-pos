"use client";

import type { Sale, StoreSetting } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Receipt } from "@/components/Receipt";
import { printOnly } from "@/lib/print";

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  debit: "Debit",
  credit: "Kredit",
  qris: "QRIS",
  transfer: "Transfer",
  other: "Lainnya",
};

export function SaleDetailModal({
  sale,
  onClose,
  productName,
  unitName,
  baseUnitName,
  storeSetting,
}: {
  sale: Sale | null;
  onClose: () => void;
  productName: (id: number) => string;
  unitName: (id: number) => string;
  baseUnitName: (productId: number) => string;
  storeSetting: StoreSetting | null;
}) {
  if (!sale) return null;

  return (
    <Modal open={!!sale} onClose={onClose} title={`Detail Transaksi — ${sale.invoice_number}`} wide>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-gray-500">Tanggal</p>
          <p className="font-medium text-gray-900">{formatDateTime(sale.created_at)}</p>
        </div>
        <div>
          <p className="text-gray-500">Kasir</p>
          <p className="font-medium text-gray-900">{sale.cashier.full_name || sale.cashier.username}</p>
        </div>
        <div>
          <p className="text-gray-500">Metode Bayar</p>
          <p className="font-medium text-gray-900">{PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-medium text-green-700">Berhasil</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Produk</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Harga</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 text-gray-900">{productName(item.product_id)}</td>
                <td className="px-3 py-2 text-right text-gray-600">
                  <p>
                    {item.qty} {unitName(item.unit_id)}
                  </p>
                  {item.conversion > 1 && (
                    <p className="text-xs text-gray-400">
                      1 {unitName(item.unit_id)} {item.conversion} {baseUnitName(item.product_id)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.sell_price)}</td>
                <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
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
        <div className="flex justify-between border-t border-gray-100 pt-1 text-base font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Bayar</span>
          <span>{formatCurrency(sale.paid_amount)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Kembalian</span>
          <span>{formatCurrency(sale.change_amount)}</span>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
        <Button variant="secondary" onClick={printOnly}>
          Cetak Nota
        </Button>
      </div>

      <div className="print-area" aria-hidden="true" inert>
        <Receipt
          sale={sale}
          storeSetting={storeSetting}
          unitName={unitName}
          productName={productName}
          baseUnitName={baseUnitName}
        />
      </div>
    </Modal>
  );
}
