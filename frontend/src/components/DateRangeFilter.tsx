"use client";

import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function DateRangeFilter({
  start,
  end,
  onChangeStart,
  onChangeEnd,
  onApply,
}: {
  start: string;
  end: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200/70 bg-white shadow-sm p-3">
      <div>
        <Label>Dari Tanggal</Label>
        <Input type="date" value={start} onChange={(e) => onChangeStart(e.target.value)} />
      </div>
      <div>
        <Label>Sampai Tanggal</Label>
        <Input type="date" value={end} onChange={(e) => onChangeEnd(e.target.value)} />
      </div>
      <Button onClick={onApply}>Terapkan</Button>
    </div>
  );
}
