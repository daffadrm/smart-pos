"use client";

export function Alert({ message, variant = "error" }: { message: string; variant?: "error" | "success" }) {
  const classes =
    variant === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{message}</div>;
}
