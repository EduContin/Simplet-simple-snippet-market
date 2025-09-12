"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Prism } from "@/lib/prism";

export type SnippetFileMeta = {
  id: number;
  filename: string;
  language: string | null;
  is_entry: boolean;
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
};

export default function SnippetFilesViewer({ files }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

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
        setContent(data?.content || "");
        // highlight
        const id = window.setTimeout(() => {
          try { Prism.highlightAll(); } catch {}
        }, 0);
        return () => window.clearTimeout(id);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeId]);

  const activeLang = useMemo(() => {
    const meta = sorted.find((f) => f.id === activeId);
    return meta?.language || (meta ? guessLanguageFromExt(meta.filename) : "clike");
  }, [sorted, activeId]);

  return (
    <div className="rounded-lg border border-gray-600/40 bg-gray-700/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600/40 bg-gray-800/60">
        <span className="text-xs text-gray-300">Files</span>
        <button className="text-xs text-gray-300 hover:text-white" onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "Show"}</button>
      </div>
      <div className="grid grid-cols-12">
        {open && (
          <div className="col-span-3 bg-gray-900/70 border-r border-gray-700 max-h-[420px] overflow-auto">
            <ul className="text-xs">
              {sorted.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setActiveId(f.id)}
                    className={`w-full text-left px-2 py-1 hover:bg-gray-800 ${activeId === f.id ? "bg-blue-900/60 text-white" : "text-gray-200"}`}
                  >
                    <span className="truncate inline-block max-w-[95%] align-middle">{f.filename}</span>
                    {f.is_entry && <span className="ml-1 text-[10px] text-yellow-300 align-middle">★</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={open ? "col-span-9" : "col-span-12"}>
          <div className="p-3 overflow-auto">
            {loading ? (
              <div className="text-xs text-gray-400 italic">Loading…</div>
            ) : content ? (
              <pre className="text-xs">
                <code className={`language-${activeLang}`}>{content}</code>
              </pre>
            ) : (
              <div className="text-xs text-gray-400 italic">Select a file</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
