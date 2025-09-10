"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
// (query param handled via window.location)

type ThreadRow = {
	id: number;
	title: string;
	username: string;
	category_name: string;
	post_count: number;
	last_post_at: string;
	first_post_likes?: number;
};

export default function MySnippetsPage() {
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
const initialTab = (params?.get('tab') as any) || 'created';
const [tab, setTab] = useState<'created' | 'liked' | 'owned'>(['created','liked','owned'].includes(initialTab)?initialTab:'created');
	const [created, setCreated] = useState<ThreadRow[]>([]);
	const [liked, setLiked] = useState<ThreadRow[]>([]);
	const [owned, setOwned] = useState<ThreadRow[]>([]);
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
				const r2 = await fetch(`/api/v1/threads?likedBy=me&page=1&pageSize=100`, { cache: 'no-store' });
				if (r2.ok) setLiked(await r2.json());
				const r3 = await fetch(`/api/v1/threads?ownedBy=me&page=1&pageSize=100`, { cache: 'no-store' });
				if (r3.ok) setOwned(await r3.json());
			}
		} catch (e) { /* noop */ }
		setLoading(false);
	};

	useEffect(() => {
		refresh();
		const onLikes = () => refresh();
		window.addEventListener('likes:changed', onLikes as any);
		return () => window.removeEventListener('likes:changed', onLikes as any);
	}, []);

	const Sparkline = ({ threadId }: { threadId: number }) => {
		const [series, setSeries] = useState<{ date: string; count: number; cumulative: number }[]>([]);
		const [loading, setLoading] = useState(false);

		const load = async () => {
			setLoading(true);
			try {
				const r = await fetch(`/api/v1/threads/${threadId}/likes/timeseries?days=90`, { cache: 'no-store' });
				if (r.ok) {
					const js = await r.json();
					setSeries(js.series || []);
				}
			} catch {}
			setLoading(false);
		};

		useEffect(() => {
			load();
			const onLikes = (e: any) => {
				if (!e?.detail?.threadId || e.detail.threadId === threadId) load();
			};
			window.addEventListener('likes:changed', onLikes as any);
			return () => window.removeEventListener('likes:changed', onLikes as any);
		}, [threadId]);

		const path = useMemo(() => {
			if (!series.length) return '';
			const w = 256, h = 40;
			const maxVal = Math.max(1, ...series.map(s => s.cumulative));
			const dx = w / Math.max(1, series.length - 1);
			return series.map((s, i) => {
				const x = i * dx;
				const y = h - (s.cumulative / maxVal) * (h - 4) - 2;
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
			}).join(' ');
		}, [series]);

		return (
			<div className="w-64 h-10">
				{path ? (
					<svg viewBox="0 0 256 40" className="w-64 h-10">
						<path d={path} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
					</svg>
				) : (
					<div className="text-xs text-gray-500">{loading ? 'Loading…' : 'No likes yet'}</div>
				)}
			</div>
		);
	};

	const StatCard = ({ label, value }: { label: string; value: string }) => (
		<div className="rounded-md border border-gray-700 px-3 py-2 bg-gray-900/40">
			<div className="text-xs text-gray-400">{label}</div>
			<div className="text-lg text-gray-100 font-semibold whitespace-nowrap">{value}</div>
		</div>
	);

	const renderList = (rows: ThreadRow[], own: boolean, ownedList: boolean) => (
		<ul className="divide-y divide-gray-700">
			{rows.map((t) => (
				<li key={t.id} className="py-3 flex items-center justify-between">
					<div>
						<Link href={`/snippet/${t.id}`} className="text-blue-300 hover:text-blue-200 font-medium">{t.title}</Link>
						<div className="text-xs text-gray-400">{t.category_name} • Replies {Math.max(0, t.post_count - 1)}</div>
						<div className="mt-2 w-64"><Sparkline threadId={t.id} /></div>
					</div>
					<div className="flex items-center gap-3">
						<div className="grid grid-flow-col auto-cols-max gap-2 text-right items-end justify-end">
							<StatCard label="Replies" value={String(Math.max(0, t.post_count - 1))} />
							<StatCard label="Likes" value={String(Math.max(0, Number((t as any).first_post_likes || 0)))} />
							{own && <StatCard label="Revenue" value={`$${(((t as any).revenue_cents||0)/100).toFixed(2)}`} />}
						</div>
						{ownedList && (
							<a href={`/api/v1/snippets/${t.id}/download`} className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">Download</a>
						)}
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
						<button onClick={() => {setTab('created'); history.replaceState(null,'',`?tab=created`);}} className={`px-3 py-1.5 rounded-md ${tab==='created'?'bg-blue-600 text-white':'bg-gray-700/60 text-gray-200'}`}>Created</button>
						<button onClick={() => {setTab('liked'); history.replaceState(null,'',`?tab=liked`);}} className={`px-3 py-1.5 rounded-md ${tab==='liked'?'bg-blue-600 text-white':'bg-gray-700/60 text-gray-200'}`}>Liked</button>
						<button onClick={() => {setTab('owned'); history.replaceState(null,'',`?tab=owned`);}} className={`px-3 py-1.5 rounded-md ${tab==='owned'?'bg-blue-600 text-white':'bg-gray-700/60 text-gray-200'}`}>Owned</button>
					</div>
				</div>
				{loading ? (
					<div className="text-gray-300">Loading…</div>
				) : tab === 'created' ? (
					renderList(created, true, false)
				) : tab === 'liked' ? (
					renderList(liked, false, false)
				) : (
					renderList(owned, false, true)
				)}
			</div>
		</main>
	);
}
