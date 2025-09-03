"use client";

import React, { useEffect, useMemo, useState } from "react";
import ThreadList from "@/components/ThreadList";
import { slugify } from "@/models/slugify";
import { mapCategoryToLanguage } from "@/lib/prism";

type Thread = {
	id: number;
	title: string;
	username: string;
	category_name: string;
	post_count: number;
	last_post_at: string;
	announcements: boolean;
};

async function fetchThreads(page = 1, pageSize = 24): Promise<Thread[]> {
	// Use relative URL to avoid misconfigured NEXT_PUBLIC_APP_URL breaking client fetches
	const url = `/api/v1/threads?page=${page}&pageSize=${pageSize}`;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch threads");
	return res.json();
}

async function fetchFirstPost(threadId: number): Promise<string | undefined> {
	try {
		const url = `/api/v1/posts?threadId=${threadId}`;
		const res = await fetch(url, { cache: "no-store" });
		if (!res.ok) return undefined;
		const posts = await res.json();
		const first = posts?.[0]?.content as string | undefined;
		return first;
	} catch {
		return undefined;
	}
}

const languages = [
	"All",
	"JavaScript",
	"TypeScript",
	"Python",
	"Java",
	"C#",
	"C++",
	"Go",
	"Rust",
	"PHP",
	"Ruby",
	"SQL",
];

const problemTypes = [
	"All",
	"UI",
	"API",
	"Algorithm",
	"Database",
	"DevOps",
	"Testing",
	"Tooling",
];

export default function HomePage() {
	const [threads, setThreads] = useState<Thread[]>([]);
	const [query, setQuery] = useState("");
	const [language, setLanguage] = useState("All");
	const [problem, setProblem] = useState("All");
	const [previews, setPreviews] = useState<Record<number, { contentSnippet: string }>>({});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
			(async () => {
			try {
				setIsLoading(true);
					let data: Thread[] = [];
					try {
						data = await fetchThreads(1, 60);
					} catch {
						data = [];
					}
					if (!mounted) return;

					if (data && data.length > 0) {
						setThreads(data);
						// Load previews for card view (first post snippet)
						const ids = data.map((t) => t.id);
						const results = await Promise.all(
							ids.map(async (id) => ({ id, content: await fetchFirstPost(id) }))
						);
						if (!mounted) return;
    						const map: Record<number, { contentSnippet: string; title?: string }> = {};
    						results.forEach(({ id, content }) => {
							if (content) {
								// Strip basic BBCode and limit length
								const plain = content
									.replace(/\[\/?(b|i|u|s|quote|code|img|url|hidden|spoiler|align|size|color)(=[^\]]+)?\]/g, "")
									.replace(/:\w+?:/g, "")
									.slice(0, 280);
    								// Try to derive a descriptive title from comments or first function/class/def
    								let title: string | undefined;
    								const firstLine = plain.split("\n").find((l) => l.trim().length > 0) || "";
    								if (/^\s*(\/\/|#|--|\/\*|\*)/.test(firstLine)) {
    								  title = firstLine.replace(/^\s*(\/\/|#|--|\/\*|\*)\s*/, "").slice(0, 60);
    								} else if (/function\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
    								  const m = firstLine.match(/function\s+([a-zA-Z0-9_]+)/);
    								  title = m ? `${m[1]}()` : undefined;
    								} else if (/class\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
    								  const m = firstLine.match(/class\s+([a-zA-Z0-9_]+)/);
    								  title = m ? `${m[1]} class` : undefined;
    								} else if (/def\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
    								  const m = firstLine.match(/def\s+([a-zA-Z0-9_]+)/);
    								  title = m ? `${m[1]}()` : undefined;
    								}
    								map[id] = { contentSnippet: plain + (content.length > 280 ? "..." : ""), title };
							}
						});
						setPreviews(map);
					} else {
						setThreads([]);
						setPreviews({});
					}
			} finally {
				if (mounted) setIsLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return threads.filter((t) => {
			const inQuery = !q || t.title.toLowerCase().includes(q) || t.username.toLowerCase().includes(q) || t.category_name.toLowerCase().includes(q);
			const inLang = language === "All" || t.category_name.toLowerCase().includes(language.toLowerCase()) || t.title.toLowerCase().includes(language.toLowerCase());
			const inProblem = problem === "All" || t.category_name.toLowerCase().includes(problem.toLowerCase()) || t.title.toLowerCase().includes(problem.toLowerCase());
			return inQuery && inLang && inProblem;
		});
	}, [threads, query, language, problem]);

	return (
		<main className="container mx-auto px-4 py-8">
			{/* Hero + Search/Filters */}
			<div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-4 shadow-lg">
				<div className="mb-4">
					<h1 className="text-3xl font-bold text-gray-100">Discover modular code snippets</h1>
					<p className="text-gray-300">Search and filter snippets by language and problem type.</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search snippets, users, categories..."
						className="md:col-span-2 px-3 py-2 rounded-md bg-gray-700/60 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
					<select
						value={language}
						onChange={(e) => setLanguage(e.target.value)}
						className="px-3 py-2 rounded-md bg-gray-700/60 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						{languages.map((l) => (
							<option key={l} value={l}>{l}</option>
						))}
					</select>
					<select
						value={problem}
						onChange={(e) => setProblem(e.target.value)}
						className="px-3 py-2 rounded-md bg-gray-700/60 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						{problemTypes.map((p) => (
							<option key={p} value={p}>{p}</option>
						))}
					</select>
				</div>
			</div>

					{/* Feed as Cards using ThreadList */}
			{isLoading ? (
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2 shadow-lg text-gray-300">Loading snippets…</div>
			) : threads.length > 0 ? (
								<ThreadList
							threads={filtered}
							view="cards"
							previews={previews}
									// Disable navigation for mock items (ids >= 900000)
									  linkResolver={(t) => `/snippet/${t.id}`}
									  onDismiss={(id) => {
										// Optional: could sync to backend later. For now, localStorage is handled inside ThreadList
										console.debug("Dismissed", id);
									  }}
						/>
			) : (
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-10 mb-2 shadow-lg text-center text-gray-300">
					<div className="text-lg mb-2">No snippets yet.</div>
					<a href="/snippet/new" className="inline-block mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Create your first snippet</a>
				</div>
			)}
		</main>
	);
}

