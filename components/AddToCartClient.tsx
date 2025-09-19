"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartClient({ threadId }: { threadId: number }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const add = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      if (res.ok) {
        setAdded(true);
  // Optional: take user to Cart to confirm
  router.push("/cart");
      } else if (res.status === 401) {
        router.push("/login");
      } else {
        try {
          const data = await res.json();
          setError(data?.error || "Failed to add to cart");
        } catch {
          setError("Failed to add to cart");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={add}
        disabled={loading || added}
        className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white"
      >
        {added ? "Added" : loading ? "Adding…" : "Add to Cart"}
      </button>
      <button
        onClick={() => router.push("/cart")}
        className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm"
      >
        Go to Cart
      </button>
      {error && (
        <span className="text-xs text-red-400" role="alert">{error}</span>
      )}
    </div>
  );
}
