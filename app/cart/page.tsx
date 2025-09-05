import { headers, cookies } from "next/headers";

async function getCart() {
  // On the server, fetch needs an absolute URL; forward cookies for session
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/v1/cart`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!res.ok) return { items: [], total_cents: 0 };
  return res.json();
}

export default async function CartPage() {
  const { items, total_cents } = await getCart();
  const total = (Number(total_cents || 0) / 100).toFixed(2);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-100">Shopping Cart</h1>
        {(!items || items.length === 0) ? (
          <div className="text-gray-300">no Snippets yet, go get some!</div>
        ) : (
          <div className="space-y-4">
            <ul className="divide-y divide-gray-700/60">
              {items.map((it: any) => (
                <li key={it.thread_id} className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-gray-100 text-sm font-medium truncate">{it.title}</div>
                    <div className="text-gray-400 text-xs flex gap-3 mt-0.5">
                      <span>ID #{it.thread_id}</span>
                      {it.license && <span>License: {it.license}</span>}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="text-gray-200 text-sm font-semibold tabular-nums">
                      {it.price_label ?? `$${(Number(it.price_cents || 0)/100).toFixed(2)}`}
                    </div>
                    {/* Remove from cart */}
                    <form action={`/api/v1/cart?threadId=${it.thread_id}`} method="post" onSubmit={(e) => {
                      // Use fetch to DELETE for better UX; server action fallback is POST
                      e.preventDefault();
                      fetch(`/api/v1/cart?threadId=${it.thread_id}`, { method: 'DELETE' })
                        .then(() => window.location.reload())
                        .catch(() => window.location.reload());
                    }}>
                      <button type="submit" className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs">Remove</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-700/60 pt-4">
              <div className="text-gray-400 text-sm">Total</div>
              <div className="text-gray-100 text-lg font-bold tabular-nums">${total}</div>
            </div>
            <div className="text-right">
              <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Checkout</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
