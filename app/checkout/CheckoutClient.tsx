"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type CartItem = { thread_id: number; title: string; price_cents: number; price_label: string; license: string|null; already_owned?: boolean };

export default function CheckoutClient({ initialCart, initialWallet }: { initialCart: { items: CartItem[]; total_cents: number }; initialWallet: { balance_cents: number; currency: string }; }) {
  const [cart] = useState(initialCart);
  const [wallet] = useState(initialWallet);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pay = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/v1/checkout', { method: 'POST' });
      if (!res.ok) {
        const js = await res.json().catch(()=>({error:'Error'}));
        setError(js.error || 'Checkout failed');
      } else {
        // Force refetch after purchase then redirect to owned tab
        router.push('/my-snippets?tab=owned');
      }
    } catch (e:any) {
      setError(e?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const ownedCount = cart.items.filter(i=>i.already_owned).length;
  const effectiveTotal = cart.total_cents / 100;
  const balance = wallet.balance_cents / 100;
  const afford = balance >= effectiveTotal;

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Checkout</h1>
        {(!cart.items || cart.items.length === 0) ? (
          <div className="text-gray-300">Cart is empty.</div>
        ) : (
          <div className="space-y-4">
            <ul className="divide-y divide-gray-700/60">
              {cart.items.map((it) => (
                <li key={it.thread_id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-gray-100 text-sm font-medium flex items-center gap-2">
                      {it.title}
                      {it.already_owned && <span className="text-[10px] bg-green-700/60 text-green-200 px-1.5 py-0.5 rounded">Owned</span>}
                    </div>
                    <div className="text-xs text-gray-400">ID #{it.thread_id} {it.license ? `• ${it.license}` : ''}</div>
                  </div>
                  <div className="text-gray-200 text-sm font-semibold">{it.already_owned ? '—' : it.price_label}</div>
                </li>
              ))}
            </ul>
            {ownedCount > 0 && <div className="text-xs text-amber-300">{ownedCount} already owned item{ownedCount>1?'s':''} will not be charged.</div>}
            <div className="flex items-center justify-between border-t border-gray-700/60 pt-4">
              <div className="text-gray-400 text-sm">Total</div>
              <div className="text-gray-100 text-lg font-bold">${effectiveTotal.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-700/60 pt-4">
              <div className="text-gray-400 text-sm">Wallet Balance</div>
              <div className="text-gray-100 text-lg font-bold">${balance.toFixed(2)}</div>
            </div>
            {balance < effectiveTotal && (
              <div className="text-sm text-red-300">Insufficient funds. Please fund your wallet first.</div>
            )}
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-3">
              <button onClick={pay} disabled={!afford || submitting} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm">
                {submitting ? 'Processing…' : afford ? 'Pay Now' : 'Cannot Pay'}
              </button>
              <button onClick={()=>router.push('/cart')} className="px-3 py-2 text-sm text-gray-300 hover:text-white">Back to Cart</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
