import Link from "next/link";
import { headers } from "next/headers";

async function getProjects() {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/v1/projects?status=open`, { cache: 'no-store' });
  if (!res.ok) return { items: [] };
  return res.json();
}

export default async function ProjectsPage() {
  const { items } = await getProjects();
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
          <div className="flex items-center gap-2">
            <Link href="/projects/legal" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm">Legal</Link>
            <Link href="/projects/new" className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">New Project</Link>
          </div>
        </div>
        {(!items || items.length === 0) ? (
          <div className="text-gray-300">No projects yet.</div>
        ) : (
          <ul className="divide-y divide-gray-700/60">
            {items.map((p: any) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <Link href={`/projects/${p.id}`} className="text-gray-100 text-sm font-semibold hover:underline">{p.title}</Link>
                  <div className="text-gray-300 text-xs mt-1 line-clamp-2">{p.summary}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-200 text-sm font-semibold">{p.currency} {(Number(p.budget_cents||0)/100).toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
