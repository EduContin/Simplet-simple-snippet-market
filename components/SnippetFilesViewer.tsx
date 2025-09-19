"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Prism } from "@/lib/prism";
import AddToCartClient from "@/components/AddToCartClient";

export type SnippetFileMeta = {
  id: number;
  filename: string;
  language: string | null;
  is_entry: boolean;
  size?: number;
};

function guessLanguageFromExt(name: string): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "jsx";
    case "ts":
    case "tsx":
      return "tsx";
    case "py":
      return "python";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "rb":
      return "ruby";
    case "php":
      return "php";
    case "java":
      return "java";
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";
    case "c":
      return "clike";
    case "css":
      return "css";
    case "html":
    case "htm":
      return "markup";
    case "json":
      return "json";
    case "sh":
    case "bash":
      return "bash";
    case "sql":
      return "sql";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return "clike";
  }
}

type Props = {
  files: SnippetFileMeta[];
  threadId?: number;
};

export default function SnippetFilesViewer({ files, threadId }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [contentFull, setContentFull] = useState<string>("");
  const [contentShown, setContentShown] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState<number>(260); // px
  const dragRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => {
    return [...files].sort((a, b) => Number(b.is_entry) - Number(a.is_entry) || a.filename.localeCompare(b.filename));
  }, [files]);

  useEffect(() => {
    const entry = sorted.find((f) => f.is_entry) || sorted[0];
    if (entry) setActiveId(entry.id);
  }, [sorted]);

  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/snippet-files/${activeId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const text = data?.content || "";
        setContentFull(text);
        // Decide whether to animate: only for reasonably sized files
        const shouldAnimate = text.length > 0 && text.length <= 12000; // skip very large
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (shouldAnimate) {
          setContentShown("");
          const start = performance.now();
          const durationMs = Math.min(1600 + text.length * 0.6, 4000); // 1.6s..4s
          const step = (t: number) => {
            const elapsed = t - start;
            const p = Math.min(1, elapsed / durationMs);
            const chars = Math.max(1, Math.floor(text.length * p));
            setContentShown(text.slice(0, chars));
            if (p < 1 && mountedRef.current) {
              animRef.current = requestAnimationFrame(step);
            } else {
              // Finalize and highlight once
              setContentShown(text);
              try { Prism.highlightAll(); } catch {}
            }
          };
          animRef.current = requestAnimationFrame(step);
        } else {
          setContentShown(text);
          // highlight immediately
          const id = window.setTimeout(() => {
            try { Prism.highlightAll(); } catch {}
          }, 0);
          return () => window.clearTimeout(id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const activeLang = useMemo(() => {
    const meta = sorted.find((f) => f.id === activeId);
    return meta?.language || (meta ? guessLanguageFromExt(meta.filename) : "clike");
  }, [sorted, activeId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((f) => f.filename.toLowerCase().includes(q));
  }, [sorted, filter]);

  // Resizer events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      if ((dragRef.current as any)._dragging) {
        const newW = Math.min(480, Math.max(180, e.clientX - (dragRef.current.getBoundingClientRect().left - sidebarWidth)));
        setSidebarWidth(newW);
      }
    };
    const handleMouseUp = () => {
      if (dragRef.current) (dragRef.current as any)._dragging = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sidebarWidth]);

  const activeMeta = useMemo(() => sorted.find(f => f.id === activeId), [sorted, activeId]);

  return (
    <div className="rounded-lg border border-gray-600/40 bg-gray-700/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600/40 bg-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">Files</span>
          {open && (
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter files…"
              className="text-xs px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          {typeof threadId === 'number' && threadId > 0 && (
            <div className="hidden sm:block"><AddToCartClient threadId={threadId} /></div>
          )}
          <button className="text-xs text-gray-300 hover:text-white" onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "Show"}</button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="grid"
        style={{ gridTemplateColumns: open ? `${sidebarWidth}px 1fr` : "1fr" }}
      >
        {open && (
          <div className="bg-gray-900/70 border-r border-gray-700 max-h-[420px] overflow-auto relative">
            <ul className="text-xs">
              {filtered.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setActiveId(f.id)}
                    className={`w-full text-left px-2 py-1 hover:bg-gray-800 ${activeId === f.id ? "bg-blue-900/60 text-white" : "text-gray-200"}`}
                    title={f.filename}
                  >
                    <span className="truncate inline-block max-w-[95%] align-middle">{f.filename}</span>
                    {f.is_entry && <span className="ml-1 text-[10px] text-yellow-300 align-middle">★</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div
              ref={dragRef}
              onMouseDown={() => { if (dragRef.current) (dragRef.current as any)._dragging = true; }}
              className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-500/30"
              title="Drag to resize"
            />
          </div>
        )}
        <div>
          {/* IDE-like header */}
          <div className="px-3 py-2 bg-gray-800 flex items-center gap-2 border-b border-gray-700">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400 truncate" title={activeMeta?.filename || ''}>{activeMeta?.filename || 'Editor'}</span>
            <span className="ml-auto text-[10px] text-gray-300 border border-gray-600 rounded px-2 py-0.5">{activeLang}</span>
            {typeof threadId === 'number' && threadId > 0 && (
              <div className="sm:hidden ml-2"><AddToCartClient threadId={threadId} /></div>
            )}
          </div>
          {/* Code area with line numbers */}
          <div className="bg-gray-900/80 grid grid-cols-[40px_1fr]">
            <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
              {Array.from({ length: Math.max(1, (contentShown || "").split('\n').length) }).map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            <div className="p-3 overflow-auto">
              {loading ? (
                <div className="text-xs text-gray-400 italic">Loading…</div>
              ) : contentShown ? (
                <pre className="font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words">
                  <code className={`language-${activeLang}`}>
                    {contentShown}
                  </code>
                  {contentShown !== contentFull && (
                    <span className="inline-block w-2 h-4 align-text-bottom bg-gray-200 ml-0.5 blink-caret" />
                  )}
                </pre>
              ) : (
                <div className="text-xs text-gray-400 italic">Select a file</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
