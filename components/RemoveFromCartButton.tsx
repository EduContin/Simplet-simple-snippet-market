"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function RemoveFromCartButton({ threadId }: { threadId: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/api/v1/cart?threadId=${threadId}`, { method: "DELETE" });
    } catch {}
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs"
    >
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}
