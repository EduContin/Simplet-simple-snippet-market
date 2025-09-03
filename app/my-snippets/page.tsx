"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type ThreadRow = {
	id: number;
	title: string;
	username: string;
	category_name: string;
	post_count: number;
	last_post_at: string;
};

export default function MySnippetsPage() {
	const [tab, setTab] = useState<'created' | 'liked'>('created');
	const [created, setCreated] = useState<ThreadRow[]>([]);
	const [liked, setLiked] = useState<ThreadRow[]>([]);
	const [loading, setLoading] = useState(false);

		const refresh = async () => {
		setLoading(true);
		try {
				const meRes = await fetch('/api/auth/session', { cache: 'no-store' });
				const me = await meRes.json();
				const userId = me?.user?.id;
				if (userId) {
					const r1 = await fetch(`/api/v1/threads?userId=${userId}&page=1&pageSize=100`, { cache: 'no-store' });
					if (r1.ok) setCreated(await r1.json());
				}
				// Load liked list from localStorage (client-only)
				try {
					const raw = localStorage.getItem('likedThreads');
					if (raw) {
						const arr = JSON.parse(raw) as ThreadRow[];
						setLiked(arr);
						(window as any).__likedThreads = arr;
					}
				} catch {}
		} catch {}
		setLoading(false);
	};

	useEffect(() => {
		refresh();
		const onLikes = () => refresh();
		window.addEventListener('likes:changed', onLikes as any);
		return () => window.removeEventListener('likes:changed', onLikes as any);
	}, []);

	const Chart = ({ value }: { value: number }) => {
		// Tiny animated bar approximating popularity (0-100)
		const width = Math.max(0, Math.min(100, value));
		return (
			<div className="h-2 w-full bg-gray-700/60 rounded">
				<div className="h-2 bg-emerald-500 rounded transition-all" style={{ width: `${width}%` }} />
			</div>
		);
	};

	const StatCard = ({ label, value }: { label: string; value: string }) => (
		<div className="rounded-md border border-gray-700 p-3 bg-gray-900/40">
			<div className="text-xs text-gray-400">{label}</div>
			<div className="text-lg text-gray-100 font-semibold">{value}</div>
		</div>
	);

	const renderList = (rows: ThreadRow[]) => (
		<ul className="divide-y divide-gray-700">
			{rows.map((t) => (
				<li key={t.id} className="py-3 flex items-center justify-between">
					<div>
						<Link href={`/snippet/${t.id}`} className="text-blue-300 hover:text-blue-200 font-medium">{t.title}</Link>
						<div className="text-xs text-gray-400">{t.category_name} • Replies {Math.max(0, t.post_count - 1)}</div>
						<div className="mt-2 w-64"><Chart value={Math.min(100, (t.post_count - 1) * 5)} /></div>
					</div>
					<div className="w-56 grid grid-cols-3 gap-2">
						<StatCard label="Replies" value={String(Math.max(0, t.post_count - 1))} />
						<StatCard label="Popularity" value={`${Math.min(100, (t.post_count - 1) * 5)}%`} />
						<StatCard label="Revenue" value={`$${(0).toFixed(2)}`} />
					</div>
				</li>
			))}
			{rows.length === 0 && (
				<li className="py-6 text-gray-400">No snippets yet.</li>
			)}
		</ul>
	);

	return (
		<main className="container mx-auto px-4 py-6">
			<div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold text-gray-100">My Snippets</h1>
					<div className="flex gap-2">
						<button onClick={() => setTab('created')} className={`px-3 py-1.5 rounded-md ${tab==='created'?'bg-blue-600 text-white':'bg-gray-700/60 text-gray-200'}`}>Created</button>
						<button onClick={() => setTab('liked')} className={`px-3 py-1.5 rounded-md ${tab==='liked'?'bg-blue-600 text-white':'bg-gray-700/60 text-gray-200'}`}>Liked</button>
					</div>
				</div>
				{loading ? (
					<div className="text-gray-300">Loading…</div>
				) : tab === 'created' ? (
					renderList(created)
				) : (
					renderList(liked)
				)}
			</div>
		</main>
	);
}
