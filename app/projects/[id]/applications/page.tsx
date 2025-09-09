import { headers, cookies } from "next/headers";

async function getApplications(id: string) {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/v1/projects/${id}/applications`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!res.ok) return { items: [] };
  return res.json();
}

export default async function ApplicationsPage({ params }: { params: { id: string } }) {
  const { items } = await getApplications(params.id);
  // Fetch project to know accepted app
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const projRes = await fetch(`${base}/api/v1/projects/${params.id}`, { cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : undefined });
  const project = projRes.ok ? await projRes.json() : null;
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Applications</h1>
        {(!items || items.length === 0) ? (
          <div className="text-gray-300">No applications yet.</div>
        ) : (
          <ul className="divide-y divide-gray-700/60">
            {items.map((a: any) => (
              <li key={a.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-gray-100 text-sm font-semibold">@{a.username}</div>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap mt-1">{a.cover_letter || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-200 text-sm font-semibold">USD {(Number(a.proposed_cents||0)/100).toFixed(2)}</div>
                    <div className="text-gray-400 text-xs">Status: {a.status}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  {!project?.chosen_application_id && a.status !== 'accepted' && (
                    <form action={`/api/v1/projects/${params.id}/applications/${a.id}/status`} method="post">
                      <button name="status" value="accepted" className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">Accept</button>
                    </form>
                  )}
                  {a.status !== 'rejected' && (
                    <form action={`/api/v1/projects/${params.id}/applications/${a.id}/status`} method="post">
                      <button name="status" value="rejected" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 text-xs">Reject</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
