"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { Alert } from "./Alert";

export function ConfirmDialog({
  open,
  title,
  message,
  error,
  confirmLabel = "Hapus",
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title: string;
  message: string;
  error?: string | null;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      {error && (
        <div className="mt-3">
          <Alert message={error} inline />
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Memproses..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
