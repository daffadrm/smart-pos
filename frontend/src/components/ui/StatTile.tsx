"use client";

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${tone === "warning" ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
