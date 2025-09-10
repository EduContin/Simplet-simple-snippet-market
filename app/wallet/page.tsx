"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export default function WalletPage() {
  const { data: session } = useSession();
  const userId = useMemo(() => session?.user && (session.user as any).id, [session]);
  const [tab, setTab] = useState<"card" | "transfer">("card");
  const [balance, setBalance] = useState<{ balance_cents: number; currency: string } | null>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [txs, setTxs] = useState<any[]>([]);

  // New card form (expects a PSP token, not raw card data)
  const [cardToken, setCardToken] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");

  const fetchBalance = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/v1/wallet/balance?userId=${userId}`, { cache: 'no-store' });
      if (res.ok) setBalance(await res.json());
    } catch {}
  };

  const fetchMethods = async () => {
    try {
      const r = await fetch('/api/v1/wallet/card/list', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setMethods(data.methods || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchBalance();
    fetchMethods();
    (async () => {
      try {
        const r = await fetch('/api/v1/wallet/transactions?limit=50', { cache: 'no-store' });
        if (r.ok) {
          const js = await r.json();
          setTxs(js.items || []);
        }
      } catch {}
    })();
  }, [userId]);

  const handleAttach = async () => {
    setMsg(null);
    try {
      const r = await fetch('/api/v1/wallet/card/attach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cardToken, brand: cardBrand, last4: cardLast4, exp_month: Number(cardExpMonth)||undefined, exp_year: Number(cardExpYear)||undefined })
      });
      if (r.ok) {
        setMsg('Card added');
        setCardToken(''); setCardBrand(''); setCardLast4(''); setCardExpMonth(''); setCardExpYear('');
        fetchMethods();
      } else {
        const er = await r.json().catch(() => ({ error: 'Failed' }));
        setMsg(er.error || 'Failed');
      }
    } catch (e: any) { setMsg(e.message || 'Error'); }
  };

  const handleTopUp = async (payment_method_id: number) => {
    setMsg(null);
    const cents = Math.round(parseFloat(amount || '0') * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setMsg('Enter amount'); return; }
    try {
      const r = await fetch('/api/v1/wallet/card/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id, amount_cents: cents, currency: balance?.currency || 'BRL' })
      });
      if (r.ok) {
        setMsg('Top up successful');
        fetchBalance();
      } else {
        const er = await r.json().catch(() => ({ error: 'Failed' }));
        setMsg(er.error || 'Failed');
      }
    } catch (e: any) { setMsg(e.message || 'Error'); }
  };

  const handleTransfer = async () => {
    setMsg(null);
    if (!userId) return;
    const amt = Math.round(parseFloat(amount) * 100);
    if (!recipient || !Number.isFinite(amt) || amt <= 0) { setMsg('Enter a valid recipient and amount'); return; }
    setSending(true);
    try {
      // resolve recipient username to user id
      const ures = await fetch(`/api/v1/users/${recipient}`);
      if (!ures.ok) throw new Error('Recipient not found');
      const udata = await ures.json();
      const toId = udata.id;
      const r = await fetch('/api/v1/wallet/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: userId, to_user_id: toId, amount_cents: amt, currency: balance?.currency || 'BRL' })
      });
      if (r.ok) { setMsg('Transfer sent'); fetchBalance(); }
      else { const er = await r.json().catch(() => ({ error: 'Failed' })); setMsg(er.error || 'Failed'); }
    } catch (e: any) { setMsg(e.message || 'Error'); }
    finally { setSending(false); }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-100">Wallet</h1>
          {balance && (
            <div className="text-sm text-gray-200">Balance: <span className="font-semibold">R$ {(balance.balance_cents / 100).toFixed(2)}</span></div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('card')} className={`px-3 py-1.5 rounded-md ${tab === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-700/60 text-gray-200'}`}>Card</button>
          <button onClick={() => setTab('transfer')} className={`px-3 py-1.5 rounded-md ${tab === 'transfer' ? 'bg-blue-600 text-white' : 'bg-gray-700/60 text-gray-200'}`}>Send to user</button>
        </div>

        {tab === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="p-4 border border-gray-700 rounded bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Add a card</h2>
              <div className="space-y-2">
                <input value={cardToken} onChange={(e) => setCardToken(e.target.value)} placeholder="PSP card token" className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} placeholder="Brand (e.g., Visa)" className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                  <input value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} placeholder="Last 4" className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={cardExpMonth} onChange={(e) => setCardExpMonth(e.target.value)} placeholder="Exp month" className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                  <input value={cardExpYear} onChange={(e) => setCardExpYear(e.target.value)} placeholder="Exp year" className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={handleAttach}>Save card</button>
                </div>
                {msg && <div className="text-xs text-gray-300">{msg}</div>}
              </div>
            </div>
            <div className="p-4 border border-gray-700 rounded bg-gray-900/50">
              <h3 className="font-semibold text-gray-100 mb-2">Saved cards</h3>
              <div className="space-y-2">
                {methods.length === 0 && <div className="text-gray-400 text-sm">No cards yet</div>}
                {methods.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border border-gray-700 rounded px-3 py-2">
                    <div className="text-gray-200 text-sm">{m.brand || 'Card'} •••• {m.last4} {m.exp_month && m.exp_year ? `(exp ${m.exp_month}/${m.exp_year})` : ''}</div>
                    <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={() => handleTopUp(m.id)}>Top up</button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (R$)" className="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                  <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={() => { const first = methods[0]; if (first) handleTopUp(first.id); }}>Top up with first card</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="p-4 border border-gray-700 rounded bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Send to a user</h2>
              <div className="flex flex-col gap-2">
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient username" className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                <div className="flex items-center gap-2">
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (R$)" className="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700" />
                  <button onClick={handleTransfer} disabled={sending} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Send</button>
                </div>
                {msg && <div className="text-xs text-gray-300">{msg}</div>}
              </div>
            </div>
            <div className="p-4 border border-gray-700 rounded bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Balance & tips</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center justify-between border border-gray-700 rounded px-3 py-2 bg-gray-800/60">
                  <span>Current balance</span>
                  <span className="font-semibold">{balance ? `R$ ${(balance.balance_cents / 100).toFixed(2)}` : '—'}</span>
                </div>
                <ul className="list-disc list-inside text-gray-400">
                  <li>Transfers are instant and final.</li>
                  <li>Use the exact username of the recipient.</li>
                  <li>You can top up in the Card tab.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Transactions</h2>
          <div className="rounded border border-gray-700 bg-gray-900/40">
            <div className="grid grid-cols-6 text-xs text-gray-400 border-b border-gray-700/60 px-3 py-2">
              <div>Date</div>
              <div>Type</div>
              <div>Status</div>
              <div>From</div>
              <div>To</div>
              <div className="text-right">Amount</div>
            </div>
            {txs.length === 0 && <div className="px-3 py-3 text-sm text-gray-400">No transactions yet.</div>}
            {txs.map((t) => (
              <div key={t.id} className="grid grid-cols-6 items-center px-3 py-2 border-b border-gray-800/60 last:border-b-0 text-sm">
                <div className="text-gray-300">{new Date(t.created_at).toLocaleString()}</div>
                <div className="text-gray-300 capitalize">{t.type}</div>
                <div className={`text-xs font-medium ${t.status==='confirmed'?'text-emerald-300':'text-amber-300'}`}>{t.status}</div>
                <div className="text-gray-300">{t.from_username || (t.from_user_id ? `#${t.from_user_id}` : '—')}</div>
                <div className="text-gray-300">{t.to_username || (t.to_user_id ? `#${t.to_user_id}` : '—')}</div>
                <div className={`text-right font-semibold ${t.to_user_id===Number(userId)?'text-emerald-300':'text-red-300'}`}>
                  {t.currency || 'BRL'} {(Number(t.amount_cents||0)/100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

