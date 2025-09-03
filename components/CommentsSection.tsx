"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Post = { id: number; content: string; user_id: number; created_at: string; username?: string };

export default function CommentsSection({ threadId }: { threadId: number }) {
	const { data: session } = useSession();
	const [posts, setPosts] = useState<Post[]>([]);
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setError(null);
		try {
			const r = await fetch(`/api/v1/posts?threadId=${threadId}`, { cache: 'no-store' });
			if (r.ok) setPosts(await r.json());
		} catch (e: any) {
			setError(e?.message || 'Failed to load comments');
		}
	};

	useEffect(() => { load(); }, [threadId]);

	const submit = async () => {
		if (!session?.user?.id) { setError('Login to comment'); return; }
		if (!content.trim()) return;
		setSending(true);
		setError(null);
		try {
			const r = await fetch('/api/v1/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, userId: (session.user as any).id, threadId })
			});
			if (!r.ok) throw new Error('Failed to post');
			setContent('');
			await load();
		} catch (e: any) {
			setError(e?.message || 'Failed to post');
		} finally { setSending(false); }
	};

	return (
		<div className="mt-6 p-4 border border-gray-700 rounded bg-gray-900/50">
			<h3 className="text-lg font-semibold text-gray-100 mb-3">Discussion</h3>
			<div className="space-y-3 max-h-[360px] overflow-auto pr-2">
				{posts.slice(1).map((p) => (
					<div key={p.id} className="text-sm text-gray-200 border-b border-gray-700/60 pb-2">
						<div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</div>
						<div className="whitespace-pre-wrap break-words">{p.content}</div>
					</div>
				))}
				{posts.length <= 1 && <div className="text-gray-400 text-sm">No comments yet. Be the first to discuss.</div>}
			</div>
			<div className="mt-3 flex items-start gap-2">
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					rows={3}
					className="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
					placeholder="Write a comment"
				/>
				<button onClick={submit} disabled={sending} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Post</button>
			</div>
			{error && <div className="mt-2 text-xs text-red-400">{error}</div>}
		</div>
	);
}

