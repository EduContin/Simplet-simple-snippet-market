import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getProject(id: string) {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/v1/projects/${id}`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">Not found</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{project.title}</h1>
            <div className="text-gray-300 mt-1">{project.summary}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-200 text-sm font-semibold">{project.currency} {(Number(project.budget_cents||0)/100).toFixed(2)}</div>
            <div className="text-gray-400 text-xs">Status: {project.status}</div>
          </div>
        </div>
        {project.can_view_documents && !project.is_owner && (
          <div className="mt-3 text-xs rounded bg-green-900/40 text-green-200 border border-green-700 px-3 py-2">Documents are unlocked for you.</div>
        )}
        <div className="mt-4 text-gray-200 whitespace-pre-wrap">{project.description}</div>

        {/* Apply section (not for owner) */}
        {!project.is_owner && (
          <ApplicationFlow project={project} />
        )}

        {/* Documents section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">Documents</h2>
          {project.can_view_documents ? (
            <div className="space-y-2">
              {(!project.documents || project.documents.length === 0) ? (
                <div className="text-gray-300 text-sm">No documents uploaded.</div>
              ) : (
                <ul className="list-disc pl-5 text-sm text-blue-300">
                  {project.documents.map((d: any) => (
                    <li key={d.id}><a href={d.url} target="_blank" rel="noreferrer" className="hover:underline">{d.filename}</a></li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {project?.my_application?.status !== 'accepted'
                ? 'Documents are visible only after the owner accepts your application.'
                : (project.nda_text ? 'Accept the NDA to view documents.' : 'Documents will be available shortly.')}
            </div>
          )}
        </div>

        {/* Owner-only controls */}
        {project.is_owner && (
          <div className="mt-6 space-y-4">
            <OwnerUpload projectId={project.id} />
            <OwnerActions projectId={project.id} currentStatus={project.status} />
            <div>
              <a href={`/projects/${project.id}/applications`} className="text-sm text-blue-300 hover:underline">View applications</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ApplicationFlow({ project }: { project: any }) {
  const app = project.my_application;
  const projectId = project.id as number;
  if (!app) {
    return (
      <form className="mt-6 rounded border border-gray-700 p-4 bg-gray-900/60">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">Apply</h2>
        <div className="mt-3 space-y-2 text-sm">
          <textarea name="cover_letter" placeholder="Briefly describe your fit and experience" className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 min-h-[100px]"></textarea>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Proposed amount (USD)</label>
            <input type="number" step="0.01" min="0" name="proposed" className="rounded bg-gray-900 border border-gray-700 px-2 py-1 text-gray-100 w-32" />
          </div>
        </div>
        <div className="mt-3">
          <button formAction={async (formData: FormData) => {
            'use server'
            const cover_letter = String(formData.get('cover_letter') || '');
            const proposed_cents = Math.round(Number(formData.get('proposed') || 0) * 100);
            const cookieHeader = cookies().toString();
            const h = headers();
            const host = h.get('host');
            const proto = h.get('x-forwarded-proto') || 'http';
            const base = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
            await fetch(`${base}/api/v1/projects/${projectId}/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { cookie: cookieHeader } : {}) },
              body: JSON.stringify({ cover_letter, proposed_cents }),
              cache: 'no-store',
            });
            revalidatePath(`/projects/${projectId}`);
            redirect(`/projects/${projectId}`);
          }} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white">Apply</button>
        </div>
      </form>
    );
  }
  if (app.status !== 'accepted' && app.status !== 'rejected') {
    return (
      <div className="mt-6 rounded border border-gray-700 p-4 bg-gray-900/60 text-sm text-gray-200">
        Your application has been submitted. Please wait for the owner to review it.
      </div>
    );
  }
  if (app.status === 'rejected') {
    return (
      <div className="mt-6 rounded border border-red-800 p-4 bg-red-900/30 text-sm text-red-200">
        Your application was rejected.
      </div>
    );
  }
  // accepted
  if (project.nda_text && !app.nda_accepted) {
    return (
      <form className="mt-6 rounded border border-gray-700 p-4 bg-gray-900/60">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">Accept NDA</h2>
        <div className="text-gray-300 text-sm whitespace-pre-wrap bg-gray-800 p-3 rounded border border-gray-700 max-h-56 overflow-auto">{project.nda_text}</div>
        <div className="mt-3">
          <button formAction={async () => {
            'use server'
            const cookieHeader = cookies().toString();
            const h = headers();
            const host = h.get('host');
            const proto = h.get('x-forwarded-proto') || 'http';
            const base = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
            await fetch(`${base}/api/v1/projects/${projectId}/nda/accept`, {
              method: 'POST',
              headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
              cache: 'no-store',
            });
            revalidatePath(`/projects/${projectId}`);
            redirect(`/projects/${projectId}`);
          }} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white">I Accept the NDA</button>
        </div>
      </form>
    );
  }
  return null;
}

function OwnerUpload({ projectId }: { projectId: number }) {
  return (
    <form action={`/api/v1/projects/${projectId}/documents`} method="post" encType="multipart/form-data" className="mt-6 rounded border border-gray-700 p-4 bg-gray-900/60">
      <h2 className="text-lg font-semibold text-blue-400 mb-2">Owner: Upload Documents</h2>
      <input type="file" name="file" className="block w-full text-sm text-gray-300" />
      <div className="mt-3">
        <button className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Upload</button>
      </div>
    </form>
  );
}

function OwnerActions({ projectId, currentStatus }: { projectId: number; currentStatus: string }) {
  return (
    <form action={`/api/v1/projects/${projectId}/status`} method="post" className="rounded border border-gray-700 p-4 bg-gray-900/60">
      <h2 className="text-lg font-semibold text-blue-400 mb-2">Owner: Project Status</h2>
      <div className="text-sm text-gray-300 mb-2">Current: {currentStatus}</div>
      <div className="flex gap-2">
        <button name="status" value="open" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Mark Open</button>
        <button name="status" value="in_progress" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">In Progress</button>
        <button name="status" value="closed" className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white">Close</button>
      </div>
    </form>
  );
}
