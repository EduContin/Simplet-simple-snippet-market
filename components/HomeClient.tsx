"use client";

import React, { useEffect, useMemo, useState } from "react";
import ThreadList from "@/components/ThreadList";

type Thread = {
  id: number;
  title: string;
  username: string;
  category_name: string;
  post_count: number;
  last_post_at: string;
  announcements: boolean;
  file_count?: number;
  files_preview?: Array<{ id: number; filename: string; language: string | null; is_entry: boolean; content: string }>;
  meta_tags?: string[];
  meta_license?: string | null;
  meta_price_label?: string;
  meta_price_cents?: number;
};

async function fetchThreads(page = 1, pageSize = 24): Promise<Thread[]> {
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

export default function HomeClient() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All");
  const [problem, setProblem] = useState("All");
  const [previews, setPreviews] = useState<Record<number, { contentSnippet: string; title?: string; language?: string; metaTags?: string[]; metaLicense?: string | null; metaPriceLabel?: string }>>({});
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
          // Build previews: prefer entry file content if present; fallback to first post content
          const map: Record<number, { contentSnippet: string; title?: string; language?: string; metaTags?: string[]; metaLicense?: string | null; metaPriceLabel?: string }> = {};
          for (const t of data as Thread[]) {
            const files = Array.isArray(t.files_preview) ? t.files_preview : [];
            const entry = files.find((f) => f.is_entry) || files[0];
            if (entry && entry.content) {
              // Multi-file intro + primary document preview
              const fileCount = (t.file_count ?? files.length) || 1;
              const introParts = [
                `Name: ${t.title}`,
                `Tags: ${Array.isArray(t.meta_tags) && t.meta_tags.length ? t.meta_tags.join(', ') : '—'}`,
                `License: ${t.meta_license || '—'}`,
                `Price: ${t.meta_price_label || '—'}`,
                `Files: ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`,
              ];
              const intro = introParts.join('\n');
              const combined = `${intro}\n\n${entry.content || ''}`;
              const snippet = combined.slice(0, 380);
              let title: string | undefined;
              const firstLine = snippet.split("\n").find((l) => l.trim().length > 0) || "";
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
              map[t.id] = { contentSnippet: snippet + ((combined.length > 380) ? "..." : ""), title, language: entry.language || undefined };
              continue;
            }
            // Fallback: fetch first post's content
            const content = await fetchFirstPost(t.id);
            if (content) {
              // Remove BBCode and emojis
              const raw = content
                .replace(/\[\/?(b|i|u|s|quote|code|img|url|hidden|spoiler|align|size|color)(=[^\]]+)?\]/g, "")
                .replace(/:\w+?:/g, "");
              // Extract meta lines if present
              const lines = raw.split(/\r?\n/);
              let tagsLine: string | undefined;
              let licenseLine: string | undefined;
              let priceLine: string | undefined;
              const rest: string[] = [];
              for (const ln of lines) {
                const l = ln.trim();
                if (/^Tags\s*:/.test(l)) { tagsLine = l; continue; }
                if (/^License\s*:/.test(l)) { licenseLine = l; continue; }
                if (/^Price\s*:/.test(l)) { priceLine = l; continue; }
                rest.push(ln);
              }
              // Build preview meta
              const metaTags = tagsLine ? tagsLine.replace(/^Tags\s*:\s*/, "").split(',').map(s => s.trim()).filter(Boolean) : undefined;
              const metaLicense = licenseLine ? licenseLine.replace(/^License\s*:\s*/, "").trim() : undefined;
              const metaPriceLabel = priceLine ? priceLine.replace(/^Price\s*:\s*/, "").trim() : undefined;

              // Clean up leftover leading blank lines
              let cleaned = rest.join("\n").replace(/^\s+/, "");
              // Build intro and prepend
              const introParts = [
                `Name: ${t.title}`,
                `Tags: ${(metaTags && metaTags.length) ? metaTags.join(', ') : '—'}`,
                `License: ${metaLicense || '—'}`,
                `Price: ${metaPriceLabel || '—'}`,
                `Files: 1 file`,
              ];
              const intro = introParts.join('\n');
              const combined = `${intro}\n\n${cleaned}`;
              const plain = combined.slice(0, 380);
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
              map[t.id] = {
                contentSnippet: plain + (combined.length > 380 ? "..." : ""),
                title,
                metaTags,
                metaLicense: metaLicense ?? null,
                metaPriceLabel,
              };
            }
          }
          if (!mounted) return;
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
      const inLang =
        language === "All" ||
        t.category_name.toLowerCase().includes(language.toLowerCase()) ||
        t.title.toLowerCase().includes(language.toLowerCase());
      const inProblem =
        problem === "All" ||
        t.category_name.toLowerCase().includes(problem.toLowerCase()) ||
        t.title.toLowerCase().includes(problem.toLowerCase());
      return inQuery && inLang && inProblem;
    });
  }, [threads, query, language, problem]);

  return (
    <main className="container mx-auto px-4 py-8">
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
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="px-3 py-2 rounded-md bg-gray-700/60 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {problemTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2 shadow-lg text-gray-300">Loading snippets…</div>
      ) : threads.length > 0 ? (
        <ThreadList
          threads={filtered}
          view="cards"
          previews={previews}
          linkResolver={(t) => `/thread/${t.id}`}
          onDismiss={(id) => {
            console.debug("Dismissed", id);
          }}
        />
      ) : (
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-10 mb-2 shadow-lg text-center text-gray-300">
          <div className="text-lg mb-2">No snippets yet.</div>
          <a href="/snippet/new" className="inline-block mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
            Create your first snippet
          </a>
        </div>
      )}
    </main>
  );
}
