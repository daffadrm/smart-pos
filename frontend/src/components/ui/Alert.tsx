"use client";

import { useEffect, useState } from "react";

const AUTO_DISMISS_MS = 5000;

export function Alert({
  message,
  variant = "error",
  inline = false,
}: {
  message: string;
  variant?: "error" | "success";
  /** Render statically in place with no auto-dismiss timer, for contexts (e.g. inside a
   * confirmation dialog) where the user needs the message to stay until they act on it. */
  inline?: boolean;
}) {
  const [hiddenMessage, setHiddenMessage] = useState<string | null>(null);

  useEffect(() => {
    if (inline) return;
    const t = setTimeout(() => setHiddenMessage(message), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message, inline]);

  if (!inline && message === hiddenMessage) return null;

  const classes =
    variant === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  if (inline) {
    return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{message}</div>;
  }

  return (
    <div
      className={`fixed right-4 top-18 z-100 max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg ${classes}`}
    >
      {message}
    </div>
  );
}
