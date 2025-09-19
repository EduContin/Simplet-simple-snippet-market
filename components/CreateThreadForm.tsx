"use client";

import React, { useState, useRef, useCallback } from "react";
import { Prism } from "@/lib/prism";
import { useRouter } from "next/navigation";
import { slugify } from "@/models/slugify";
import { useSession } from "next-auth/react";

interface CreateThreadFormProps {
  categoryId: number;
}

const CreateThreadForm: React.FC<CreateThreadFormProps> = ({ categoryId }) => {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  type NewFile = { id: number; filename: string; language?: string; is_entry?: boolean; content: string };
  const [useMultiFiles, setUseMultiFiles] = useState(false);
  const [files, setFiles] = useState<NewFile[]>([{ id: 1, filename: "main.py", language: "python", is_entry: true, content: "" }]);
  const [singleFilename, setSingleFilename] = useState("main.py");
  const [singleLanguage, setSingleLanguage] = useState<string | undefined>("python");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Editor-only view (no separate title/fields)

  const MAX_CHARACTERS = 5000; // Set the maximum character limit
  const CHARACTERS_PER_LINE = 1000; // Set the number of characters per line

  const updateContent = useCallback(
    (newContent: string) => {
      if (newContent.length <= MAX_CHARACTERS) {
        // Apply auto line break
        const lines = newContent.split("\n");
        const formattedLines = lines.map((line) => {
          if (line.length > CHARACTERS_PER_LINE) {
            const chunks = [];
            for (let i = 0; i < line.length; i += CHARACTERS_PER_LINE) {
              chunks.push(line.slice(i, i + CHARACTERS_PER_LINE));
            }
            return chunks.join("\n");
          }
          return line;
        });
        const formattedContent = formattedLines.join("\n");

        setContent(formattedContent);
      }
    },
    [],
  );

  const addFile = () => {
    const nextId = (files.at(-1)?.id ?? 1) + 1;
    setFiles((f) => [...f, { id: nextId, filename: `file${nextId}.txt`, content: "" }]);
  };

  const updateFile = (id: number, patch: Partial<NewFile>) => {
    setFiles((arr) => arr.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeFile = (id: number) => {
    setFiles((arr) => arr.filter((f) => f.id !== id));
  };
  const guessLangFromName = (name: string): string | undefined => {
    const ext = (name.split(".").pop() || "").toLowerCase();
    const map: Record<string, string> = {
      js: "jsx", jsx: "jsx", ts: "tsx", tsx: "tsx",
      py: "python", go: "go", rs: "rust", rb: "ruby", php: "php",
      java: "java", cpp: "cpp", cc: "cpp", cxx: "cpp", c: "clike",
      css: "css", html: "markup", htm: "markup", json: "json", sh: "bash", bash: "bash", sql: "sql", yml: "yaml", yaml: "yaml",
    };
    return map[ext];
  };
  const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const highlightFor = (content: string, lang?: string, filename?: string) => {
    const chosen = lang || guessLangFromName(filename || "") || "clike";
    try {
      const grammar = (Prism as any).languages[chosen];
      if (grammar) return Prism.highlight(content || "", grammar, chosen);
    } catch {}
    return escapeHtml(content || "");
  };
  // Derive a human-friendly title from code (first comment/def/func/class)
  const deriveTitleFromCode = (code: string): string => {
    const lines = code.split("\n");
    const firstNonEmpty = lines.find((l) => l.trim().length > 0) || "";
    const comment = firstNonEmpty.replace(/^\s*(\/\/|#|--|\/\*|\*)\s*/, "");
    if (comment !== firstNonEmpty) return comment.slice(0, 70);
    let m = firstNonEmpty.match(/function\s+([a-zA-Z0-9_]+)/);
    if (m) return `${m[1]}()`;
    m = firstNonEmpty.match(/def\s+([a-zA-Z0-9_]+)/);
    if (m) return `${m[1]}()`;
    m = firstNonEmpty.match(/class\s+([a-zA-Z0-9_]+)/);
    if (m) return `${m[1]} class`;
    return `Snippet`;
  };

  const onFilesChosen = async (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const arr = Array.from(fl);
    if (arr.length === 1) {
      const f = arr[0];
      const text = await f.text();
      const lang = guessLangFromName(f.name);
      setSingleFilename(f.name);
      setSingleLanguage(lang);
      updateContent(text);
      return;
    }
    // Multiple files selected while in single-file mode -> switch to multi and populate
    const fileObjs: NewFile[] = await Promise.all(
      arr.map(async (f, idx) => ({
        id: idx + 1,
        filename: f.name,
        language: guessLangFromName(f.name),
        is_entry: idx === 0,
        content: await f.text(),
      })),
    );
    setFiles(fileObjs);
    setUseMultiFiles(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    if (useMultiFiles) {
      // Multi-file creation: create thread and files in one call
      const entry = files.find((f) => f.is_entry) || files[0];
      const derivedTitle = deriveTitleFromCode(entry?.content || "") || "Snippet";
      const response = await fetch("/api/v1/threads/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: derivedTitle,
          categoryId,
          userId: session?.user.id,
          files: files.map(({ filename, language, is_entry, content }) => ({ filename, language, is_entry: !!is_entry, content })),
        }),
      });
      if (!response.ok) throw new Error("Failed to create thread");
      const { threadId } = await response.json();
      const slug = slugify(derivedTitle);
      router.push(`/thread/${slug}-${threadId}`);
      return;
    }
    // Single-file path
    const bbCodeContent = `[code]\n${content}\n[/code]`;
    const derivedTitle = deriveTitleFromCode(content) || "Snippet";
    const response = await fetch("/api/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
      title: derivedTitle,
      content: bbCodeContent,
          categoryId,
          userId: session?.user.id,
        }),
      });

      if (response.ok) {
        const { threadId } = await response.json();
        const slug = slugify(derivedTitle);
        router.push(`/thread/${slug}-${threadId}`);
      } else {
        console.error("Failed to create thread");
      }
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  return (
  <form onSubmit={handleSubmit} className="bg-transparent p-0">
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-300 inline-flex items-center gap-2">
          <input type="checkbox" className="accent-blue-600" checked={useMultiFiles} onChange={(e) => setUseMultiFiles(e.target.checked)} />
          Create with multiple files
        </label>
        <div className="mb-2 flex items-center gap-2">
          {/* Upload always visible */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => onFilesChosen(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-100 rounded hover:bg-gray-600"
          >
            Upload file(s)
          </button>
          {!useMultiFiles && (
            <>
              <input
                value={singleFilename}
                onChange={(e) => {
                  setSingleFilename(e.target.value);
                  const g = guessLangFromName(e.target.value);
                  if (g) setSingleLanguage(g);
                }}
                className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded"
              />
              <select
                value={singleLanguage || ''}
                onChange={(e) => setSingleLanguage(e.target.value || undefined)}
                className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded"
              >
                <option value="">auto</option>
                <option value="python">python</option>
                <option value="javascript">javascript</option>
                <option value="typescript">typescript</option>
                <option value="html">html</option>
                <option value="css">css</option>
                <option value="json">json</option>
                <option value="bash">bash</option>
              </select>
            </>
          )}
        </div>
      </div>
  <div className="relative mb-4">
        {/* Single-file editor OR multi-file list */}
        {!useMultiFiles && (
          <div className="rounded-md border border-gray-700 overflow-hidden snippet-ide-shadow">
          <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400">{singleFilename || 'Editor'}</span>
          </div>
          <div className="bg-gray-900/80 grid grid-cols-[40px_1fr]">
            {/* Line numbers */}
            <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
              {Array.from({ length: Math.max(1, content.split('\n').length) }).map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            {/* Editor with overlay highlight */}
            <div className="relative">
              <pre aria-hidden className="pointer-events-none absolute inset-0 m-0 p-3 font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words">
                <code className={`language-${singleLanguage || guessLangFromName(singleFilename || '') || 'clike'}`}
                     dangerouslySetInnerHTML={{ __html: highlightFor(content, singleLanguage || undefined, singleFilename) }} />
              </pre>
              <textarea
                id="content"
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="relative w-full bg-transparent text-transparent caret-white font-mono text-sm leading-5 outline-none resize-y min-h-[200px] p-3"
                rows={10}
                required
                spellCheck={false}
                placeholder={`Paste code for ${singleFilename}`}
              />
            </div>
          </div>
          </div>
        )}
        {useMultiFiles && (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="rounded-md border border-gray-700 overflow-hidden">
                <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
                  <input value={f.filename} onChange={(e) => updateFile(f.id, { filename: e.target.value })} className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded" />
                  <select value={f.language || ''} onChange={(e) => updateFile(f.id, { language: e.target.value })} className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded">
                    <option value="">auto</option>
                    <option value="python">python</option>
                    <option value="javascript">javascript</option>
                    <option value="typescript">typescript</option>
                    <option value="html">html</option>
                    <option value="css">css</option>
                    <option value="json">json</option>
                    <option value="bash">bash</option>
                  </select>
                  <label className="text-xs text-gray-300 inline-flex items-center gap-1">
                    <input type="radio" name="entry" checked={!!f.is_entry} onChange={() => setFiles((arr) => arr.map((x) => ({ ...x, is_entry: x.id === f.id })))} />
                    entry
                  </label>
                  <button type="button" onClick={() => removeFile(f.id)} className="ml-auto text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
                <div className="bg-gray-900/80 grid grid-cols-[48px_1fr]">
                  <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
                    {Array.from({ length: Math.max(1, (f.content || '').split('\n').length) }).map((_, i) => (
                      <div key={i} className="leading-5">{i + 1}</div>
                    ))}
                  </div>
                  <div className="relative">
                    <pre aria-hidden className="pointer-events-none absolute inset-0 m-0 p-3 font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words">
                      <code className={`language-${f.language || guessLangFromName(f.filename || '') || 'clike'}`}
                           dangerouslySetInnerHTML={{ __html: highlightFor(f.content, f.language, f.filename) }} />
                    </pre>
                    <textarea
                      value={f.content}
                      onChange={(e) => updateFile(f.id, { content: e.target.value })}
                      rows={8}
                      className="relative w-full bg-transparent text-transparent caret-white font-mono text-sm leading-5 outline-none resize-y p-3 min-h-[160px]"
                      placeholder={`Paste code for ${f.filename}`}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={addFile} className="px-3 py-1 text-xs bg-gray-700 text-gray-100 rounded hover:bg-gray-600">+ Add file</button>
            </div>
          </div>
        )}
  {/* no counters or extra UI */}
      </div>
      <button
        type="submit"
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Publish Snippet
      </button>
    </form>
  );
};

export default CreateThreadForm;
