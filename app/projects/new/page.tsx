"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [ndaRequired, setNdaRequired] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const budget_cents = Math.round(Number(budget || 0) * 100);
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, description, budget_cents, currency: 'USD', nda_required: ndaRequired }),
    });
    if (!res.ok) {
      const er = await res.json().catch(() => ({}));
      alert(er.error || 'Failed to create project');
      return;
    }
    const { id } = await res.json();
    // Optional: if files were selected, upload them now
    const files = (document.getElementById('docs') as HTMLInputElement | null)?.files;
    if (files && files.length > 0) {
      setUploading(true);
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        const up = await fetch(`/api/v1/projects/${id}/documents`, { method: 'POST', body: fd });
        if (!up.ok) {
          setUploading(false);
          alert('Some document uploads failed. You can upload from the project page.');
          router.push(`/projects/${id}`);
          return;
        }
      }
      setUploading(false);
    }
    router.push(`/projects/${id}`);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-100">New Project</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Summary</label>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 min-h-[160px]" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Budget (USD)</label>
              <input type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input id="nda" type="checkbox" checked={ndaRequired} onChange={(e) => setNdaRequired(e.target.checked)} />
              <label htmlFor="nda" className="text-sm text-gray-300">NDA required to view docs</label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Attach documents (optional)</label>
            <input id="docs" type="file" multiple className="block w-full text-sm text-gray-300" />
            <p className="text-xs text-gray-400 mt-1">Up to 10MB per file.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Cancel</button>
            <button type="submit" className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white" disabled={uploading}>{uploading ? 'Uploading…' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
