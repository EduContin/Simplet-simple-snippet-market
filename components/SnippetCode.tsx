"use client";

import React, { useEffect } from "react";
import { Prism } from "@/lib/prism";

type Props = {
  code: string;
  language?: string; // prism language id, e.g., 'jsx', 'tsx', 'python'
  title?: string;
};

export default function SnippetCode({ code, language = "jsx", title }: Props) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        Prism.highlightAll();
      } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [code, language]);

  const lines = Math.max(1, code.split("\n").length);

  return (
    <div className="rounded-md border border-gray-700 overflow-hidden snippet-ide-shadow">
      <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        {title ? (
          <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400 truncate">{title}</span>
        ) : null}
        <span className="ml-auto text-[11px] uppercase tracking-wider text-gray-400">{language}</span>
      </div>
      <div className="bg-gray-900/80 grid grid-cols-[48px_1fr]">
        <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="p-3 overflow-auto">
          <pre className="font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
