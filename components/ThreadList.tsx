"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { slugify } from "@/models/slugify";
import { FaComments, FaUser, FaFolder, FaClock, FaHeart, FaPlus } from "react-icons/fa";
import { Prism, mapCategoryToLanguage } from "@/lib/prism";
import { useSession } from "next-auth/react";


interface Thread {
  id: number;
  title: string;
  username: string;
  category_name: string;
  post_count: number;
  last_post_at: string;
  first_post_likes?: number;
  first_post_id?: number;
  announcements: boolean;
  file_count?: number;
  meta_tags?: string[];
  meta_license?: string | null;
  meta_price_label?: string;
  meta_price_cents?: number;
}

interface ThreadListProps {
  threads: Thread[];
  // Optional alternative rendering style for a more card-based layout
  view?: "table" | "cards";
  // Optional previews map when using cards view: threadId -> content preview
  previews?: Record<number, { contentSnippet: string; title?: string; language?: string } | undefined>;
  // Optional custom link resolver (return null or '#' to disable navigation)
  linkResolver?: (thread: Thread) => string | null;
  // Optional handler when user dismisses a snippet (red button)
  onDismiss?: (threadId: number) => void;
}

const limitTitle = (title: string, maxLength: number = 70): string => {
  if (title.length > maxLength) {
    return title.slice(0, maxLength - 3) + "...";
  }
  return title;
};

const timeSinceLastActivity = (lastActivity: string): string => {
  const now = new Date();
  const lastActivityTime = new Date(lastActivity);
  const delta = now.getTime() - lastActivityTime.getTime();

  const minutes = Math.floor(delta / 60000);
  const hours = Math.floor(delta / 3600000);
  const days = Math.floor(delta / 86400000);
  const months = Math.floor(days / 30);

  if (months >= 1) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours >= 1) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes >= 1) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "just now";
  }
};

const ThreadList: React.FC<ThreadListProps> = ({ threads, view = "table", previews, linkResolver, onDismiss }) => {
  const { data: session } = useSession();
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.announcements === b.announcements) {
      return new Date(b.last_post_at).getTime() - new Date(a.last_post_at).getTime();
    }
    return a.announcements ? -1 : 1;
  });

  // Local UI state for expanded and dismissed snippets in cards view
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});

  // hydrate dismissed from localStorage and persist on change
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dismissedSnippets");
      if (raw) setDismissed(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dismissedSnippets", JSON.stringify(dismissed));
    } catch {}
  }, [dismissed]);

  const visibleThreads = useMemo(
    () => sortedThreads.filter((t) => !dismissed[t.id]),
    [sortedThreads, dismissed]
  );

  // Fetch counts and per-user liked state for visible first posts
  const visibleIdsKey = useMemo(() => visibleThreads.map(t => t.id).join(','), [visibleThreads]);
  useEffect(() => {
    const pids = visibleThreads.map((t) => (t as any).first_post_id).filter(Boolean);
    if (pids.length === 0) return;
    const qs = encodeURIComponent(pids.join(","));
    fetch(`/api/v1/likes?postIds=${qs}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const newLikes: Record<number, number> = {};
        const newLiked: Record<number, boolean> = {};
        for (const t of visibleThreads) {
          const pid = (t as any).first_post_id;
          if (!pid) continue;
          const entry = data[pid] || { count: (t as any).first_post_likes ?? 0, liked: false };
          newLikes[t.id] = entry.count;
          newLiked[t.id] = !!entry.liked;
        }
        setLikes(newLikes);
        setLikedMap(newLiked);
      })
      .catch(() => {});
  }, [visibleIdsKey]);

  // Re-run syntax highlighting when visible content changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (view !== "cards") return;
    // Defer to next tick to ensure DOM is updated
    const id = window.setTimeout(() => {
      try {
        Prism.highlightAll();
      } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [view, visibleThreads, previews, expanded]);

  const toggleLike = async (thread: Thread) => {
    try {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      // prefer server-provided first_post_id
      const firstPostId = (thread as any).first_post_id;
      let postId = firstPostId;
      if (!postId) {
        const pr = await fetch(`/api/v1/posts?threadId=${thread.id}`, { cache: 'no-store' });
        if (!pr.ok) return;
        const posts = await pr.json();
        postId = posts?.[0]?.id;
        if (!postId) return;
      }
      const lr = await fetch('/api/v1/likes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId })
      });
      if (!lr.ok) return;
      const data = await lr.json();
      setLikes((m) => ({ ...m, [thread.id]: data.likes_count }));
      setLikedMap((m) => ({ ...m, [thread.id]: data.is_liked_by_user }));
      // Notify other parts of the app optionally
      try { window.dispatchEvent(new CustomEvent('likes:changed')); } catch {}
    } catch {}
  };

    if (!sortedThreads || sortedThreads.length === 0) {
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Snippets</h2>
        <p className="text-gray-300">No snippets available at the moment.</p>
      </div>
    );
  }

  if (view === "cards") {
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Snippets</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleThreads.map((thread) => {
            const preview = previews?.[thread.id]?.contentSnippet;
            const previewLang = previews?.[thread.id]?.language;
            const defaultHref = `/thread/${thread.id}`;
            const resolvedHref = linkResolver ? (linkResolver(thread) || "#") : defaultHref;
            const titleOverride = previews?.[thread.id]?.title;
            // Try to derive a descriptive title from the first meaningful line of code if no override provided
            const derivedFromCode = (() => {
              if (!preview) return undefined;
              const firstLine = preview.split("\n").find((l) => l.trim().length > 0) || "";
              if (/^\s*(\/\/|#|--|\/\*|\*)/.test(firstLine)) {
                return firstLine.replace(/^\s*(\/\/|#|--|\/\*|\*)\s*/, "").slice(0, 60);
              }
              if (/function\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
                const m = firstLine.match(/function\s+([a-zA-Z0-9_]+)/);
                return m ? `${m[1]}()` : undefined;
              }
              if (/class\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
                const m = firstLine.match(/class\s+([a-zA-Z0-9_]+)/);
                return m ? `${m[1]} class` : undefined;
              }
              if (/def\s+([a-zA-Z0-9_]+)/.test(firstLine)) {
                const m = firstLine.match(/def\s+([a-zA-Z0-9_]+)/);
                return m ? `${m[1]}()` : undefined;
              }
              return undefined;
            })();
            const titleToShow = limitTitle(titleOverride || derivedFromCode || thread.title, 60);
            const isExpanded = !!expanded[thread.id];
            return (
              <Link
                key={thread.id}
                href={resolvedHref}
                className="group block rounded-lg border border-gray-600/40 bg-gray-700/40 hover:bg-gray-700/60 transition-colors duration-200 overflow-hidden snippet-ide-shadow"
              >
                {/* IDE Header */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {/* Red: dismiss */}
                    <button
                      type="button"
                      aria-label="Dismiss snippet"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDismissed((d) => ({ ...d, [thread.id]: true }));
                        onDismiss?.(thread.id);
                      }}
                      className="h-3 w-3 rounded-full bg-red-500 hover:opacity-80"
                    />
                    {/* Green: expand */}
                    <button
                      type="button"
                      aria-label="Expand snippet"
                      aria-expanded={!!expanded[thread.id]}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpanded((ex) => ({ ...ex, [thread.id]: !ex[thread.id] }));
                      }}
                      className="h-3 w-3 rounded-full bg-green-500 hover:opacity-80"
                    />
                    <span className="ml-2 uppercase tracking-wider">{thread.category_name}</span>
                    <span className="mx-2 text-gray-600">•</span>
                                                <h3 className="text-sm font-semibold text-blue-300 group-hover:text-blue-200 truncate flex items-center gap-2" title={titleToShow}>
                                                    {titleToShow}
                                                    {(thread as any).is_verified && (
                                                      <span className="inline-flex items-center text-xs text-green-400 border border-green-500/50 rounded px-1 py-0.5">Verified</span>
                                                    )}
                                                    {((thread as any).file_count ?? 0) > 1 && (
                                                      <span className="inline-flex items-center text-[10px] text-gray-300 border border-gray-500/40 rounded px-1 py-0.5">
                                                        { (thread as any).file_count } files
                                                      </span>
                                                    )}
                                                </h3>
                  </div>
                </div>
                {/* Code area with line numbers */}
                <div className="px-4">
                  <div className="rounded-md bg-gray-900/80 border border-gray-700 overflow-hidden">
                    <div className="bg-gray-900/80 grid grid-cols-[36px_1fr]">
                      <div className={`select-none text-right pr-2 py-3 text-gray-500 text-[11px] bg-gray-900/80 border-r border-gray-800 overflow-hidden ${isExpanded ? 'max-h-80' : 'max-h-40'} transition-[max-height] duration-500 ease-in-out`}>
                        {Array.from({ length: Math.min(isExpanded ? 28 : 14, Math.max(1, (preview || "").split('\n').length)) }).map((_, i) => (
                          <div key={i} className="leading-5">{i + 1}</div>
                        ))}
                      </div>
                      <div className={`p-3 overflow-hidden ${isExpanded ? 'max-h-80' : 'max-h-40'} transition-[max-height] duration-500 ease-in-out`}>
                        {preview ? (
                          <pre className={`font-mono text-[12px] leading-5 text-gray-200 whitespace-pre-wrap break-words ${isExpanded ? 'max-h-72' : 'max-h-32'} overflow-hidden transition-[max-height] duration-500 ease-in-out`}>
                            <code className={`language-${previewLang || mapCategoryToLanguage(thread.category_name)}`}>
                              {preview}
                            </code>
                          </pre>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No preview available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer meta */}
                <div className="px-4 pb-4 mt-3 flex items-center justify-between text-gray-300 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><FaComments /> <span>{Math.max(0, thread.post_count - 1)}</span></div>
                    <button
                      type="button"
                      aria-label="Like snippet"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(thread); }}
                      className={`flex items-center gap-1 ${likedMap[thread.id] ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}
                    >
                      <FaHeart /> <span>{likes[thread.id] ?? (thread as any).first_post_likes ?? 0}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tags */}
                    {Array.isArray(thread.meta_tags) && thread.meta_tags.length > 0 && (
                      <div className="hidden md:flex items-center gap-1">
                        {thread.meta_tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] border border-gray-600/60 rounded px-1 py-0.5 text-gray-300">{t}</span>
                        ))}
                      </div>
                    )}
                    {/* License and Price */}
                    {thread.meta_license && (
                      <span className="text-[11px] text-amber-300 border border-amber-500/40 rounded px-1 py-0.5">
                        {thread.meta_license}
                      </span>
                    )}
                    {typeof thread.meta_price_label === 'string' && (
                      <span className="text-[11px] text-emerald-300 border border-emerald-500/40 rounded px-1 py-0.5">
                        {thread.meta_price_label}
                      </span>
                    )}
                    {/* Author and time */}
                    <span className="mx-1 text-gray-500">•</span>
                    <FaUser className="text-gray-400" />
                    <a href={`/users/${thread.username}`} className="hover:text-gray-200">{thread.username}</a>
                    <span className="mx-1 text-gray-500">•</span>
                    <div className="flex items-center gap-1"><FaClock className="text-gray-400" /><span>{timeSinceLastActivity(thread.last_post_at)}</span></div>
                  </div>
                </div>
              </Link>
            );
          })}
          {/* Add Snippet card at the end */}
          <Link
            href="/snippet/new"
            className="group flex items-center justify-center rounded-lg border border-dashed border-gray-600/60 bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200 min-h-[260px] snippet-ide-shadow"
            aria-label="Add new snippet"
          >
            <div className="flex flex-col items-center text-gray-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-800 border border-gray-600 group-hover:border-gray-500">
                <FaPlus className="text-2xl text-blue-300 group-hover:text-blue-200" />
              </div>
              <span className="mt-3 text-sm font-semibold text-gray-200">Add Snippet</span>
              <span className="mt-1 text-xs text-gray-400">Create your own reusable code</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2 shadow-lg">
  <h2 className="text-2xl font-bold mb-4 text-gray-100">Snippets</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-300">
              <th className="py-3 px-4 bg-gray-700/80 rounded-tl-md">Title</th>
              <th className="py-3 px-4 bg-gray-700/80">Author</th>
              <th className="py-3 px-4 bg-gray-700/80">Category</th>
              <th className="py-3 px-4 bg-gray-700/80">Replies</th>
              <th className="py-3 px-4 bg-gray-700/80">Likes</th>
              <th className="py-3 px-4 bg-gray-700/80 rounded-tr-md">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sortedThreads.map((thread) => (
              <tr
                key={thread.id}
                className="hover:bg-gray-700/50 transition-colors duration-200"
              >
                <td className="py-3 px-4 border-b border-gray-600/50">
                  <Link
                    href={`/thread/${slugify(thread.title)}-${thread.id}`}
                    className="text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <FaComments className="mr-2 flex-shrink-0" />
                    <span className="truncate" title={thread.title}>
                      {limitTitle(thread.title)}
                    </span>
                  </Link>
                </td>
                <td className="py-3 px-4 border-b border-gray-600/50 text-gray-300">
                  <div className="flex items-center hover:text-gray-200">
                    <FaUser className="mr-2 text-gray-400 flex-shrink-0" />
                    <a href={`/users/${thread.username}`}>{thread.username}</a>
                  </div>
                </td>
                <td className="py-3 px-4 border-b border-gray-600/50 text-gray-300">
                  <div className="flex items-center">
                    <FaFolder className="mr-2 text-gray-400 flex-shrink-0" />
                    {thread.category_name}
                  </div>
                </td>
                <td className="py-3 px-4 border-b border-gray-600/50 text-gray-300">
                  {thread.post_count - 1}
                </td>
                <td className="py-3 px-4 border-b border-gray-600/50 text-gray-300">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(thread); }}
                    className={`flex items-center ${likedMap[thread.id] ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}
                    aria-label="Like snippet"
                  >
                    <FaHeart className="mr-2 flex-shrink-0" />
                    {likes[thread.id] ?? (thread as any).first_post_likes ?? 0}
                  </button>
                </td>
                <td className="py-3 px-4 border-b border-gray-600/50 text-gray-300">
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-gray-400 flex-shrink-0" />
                    {timeSinceLastActivity(thread.last_post_at)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThreadList;