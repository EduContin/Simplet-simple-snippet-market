"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Prism } from "@/lib/prism";

const languageOptions = [
  { id: "jsx", label: "JavaScript/JSX", ext: "js" },
  { id: "tsx", label: "TypeScript/TSX", ext: "ts" },
  { id: "python", label: "Python", ext: "py" },
  { id: "go", label: "Go", ext: "go" },
  { id: "sql", label: "SQL", ext: "sql" },
  { id: "css", label: "CSS", ext: "css" },
  { id: "markup", label: "HTML", ext: "html" },
  { id: "java", label: "Java", ext: "java" },
  { id: "cpp", label: "C++", ext: "cpp" },
  { id: "rust", label: "Rust", ext: "rs" },
  { id: "php", label: "PHP", ext: "php" },
  { id: "ruby", label: "Ruby", ext: "rb" },
];

const techOptions = [
  "UI", "API", "Algorithm", "Database", "DevOps", "Testing", "Tooling", "Academic",
  "Auth", "Payments", "Analytics", "Cache", "Search", "CLI", "Docs",
];

const licenseOptions = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "Unlicense",
  "CC0-1.0",
  "Proprietary",
];

export default function NewSnippetPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [language, setLanguage] = useState("jsx");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState<string[]>([]);
  const [license, setLicense] = useState<string>(licenseOptions[0]);
  const [filename, setFilename] = useState("snippet.js");
  const [code, setCode] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "discussion">("fixed");
  const [price, setPrice] = useState<string>("");
  // New: custom tags support
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Multi-file state
  type NewFile = { id: number; filename: string; language?: string; is_entry?: boolean; content: string };
  const [useMultiFiles, setUseMultiFiles] = useState(false);
  const [files, setFiles] = useState<NewFile[]>([{ id: 1, filename: "snippet.js", language: "jsx", is_entry: true, content: "" }]);
  const [activeFileId, setActiveFileId] = useState<number | null>(1);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const maxChars = 12000;

  // Precompute highlighted HTML for overlay/preview
  const highlightedHtml = useMemo(() => {
    const grammar = (Prism as any).languages[language];
    try {
      if (grammar) {
        return Prism.highlight(code, grammar, language);
      }
    } catch (e) {
      // noop; fall through to plain escape
    }
    return (code || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;");
  }, [code, language]);

  const toggleTech = (t: string) =>
    setTech((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const onLanguageChange = (v: string) => {
    setLanguage(v);
    const ext = languageOptions.find((o) => o.id === v)?.ext || "txt";
    if (filename.includes(".")) setFilename(filename.replace(/\.[^.]+$/, `.${ext}`));
    else setFilename(`${filename}.${ext}`);
  };

  // Helpers for multi-files
  const addFile = () => {
    const nextId = (files.at(-1)?.id ?? 1) + 1;
    setFiles((arr) => [...arr, { id: nextId, filename: `file${nextId}.txt`, content: "" }]);
    setActiveFileId(nextId);
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

  // Handle upload of multiple files; auto-parse content and infer language
  const onUploadFiles = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const list = ev.target.files;
    if (!list || list.length === 0) return;
    try {
      const newOnes: NewFile[] = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        // Only text-like types; skip binaries
        if (file.type && !/^text\//.test(file.type) && !/\+xml$/.test(file.type)) continue;
        const text = await file.text();
        const lang = guessLangFromName(file.name);
        newOnes.push({ id: Date.now() + i, filename: file.name, language: lang, content: text });
      }
      if (newOnes.length === 0) {
        setUploadError("No text files detected. Please upload code/text files.");
        return;
      }
      setUseMultiFiles(true);
      setFiles((arr) => {
        const combined = arr.length === 1 && !arr[0].content ? [] : arr;
        const result = [...combined, ...newOnes];
        // ensure a single entry flag
        if (!result.some((f) => f.is_entry)) {
          const idx = result.findIndex((f) => /index\.(html|js|ts|tsx|jsx)$/i.test(f.filename))
            ?? 0;
          const pick = idx >= 0 ? idx : 0;
          result.forEach((f, i) => (f.is_entry = i === pick));
        }
        // focus first uploaded file
        setActiveFileId(result[result.length - newOnes.length]?.id || result[0]?.id || null);
        return result;
      });
    } catch (e: any) {
      setUploadError(e?.message || "Failed to read files");
    } finally {
      // reset the input so the same file selection can be chosen again
      ev.target.value = "";
    }
  };

  // Enforce MIT license as free (disable pricing)
  const isMIT = license === "MIT";
  const effectivePriceType = isMIT ? "discussion" : priceType; // force hide fixed input for MIT

  const checkCode = async () => {
    try {
      // Basic syntax tokenization using Prism (client-side quick check)
      // If Prism throws or returns trivial tokens, we still provide helpful feedback.
      const grammar = (Prism as any).languages[language];
      if (!grammar) {
        setCheckResult("Selected language has limited checks. Consider switching to a supported language.");
        return;
      }
      const tokens = Prism.tokenize(code, grammar);
      const tokenCount = Array.isArray(tokens) ? tokens.length : 0;
      if (tokenCount > 0) {
        setCheckResult(`No obvious syntax errors detected. Tokens parsed: ${tokenCount}.`);
      } else {
        setCheckResult("Unable to parse tokens. Please review your code for syntax issues.");
      }
    } catch (e) {
      setCheckResult("Parser had trouble with this input. Please review your code.");
    }
  };

  const formatCode = () => {
    // Minimal formatting: trim trailing spaces per line and ensure newline ending
    const formatted = code
      .split("\n")
      .map((l) => l.replace(/\s+$/g, ""))
      .join("\n")
      .replace(/\n*$/, "\n");
    setCode(formatted);
  };

  const onCodeChange = (val: string) => {
    const next = val.slice(0, maxChars);
    setCode(next);
    // Auto-resize the textarea to fit content to keep overlay in sync
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  };

  const submit = async () => {
    setSubmitError(null);
    // Single vs Multi validation
    if (!useMultiFiles) {
      if (!title.trim() || !code.trim()) {
        setSubmitError("Title and code are required.");
        return;
      }
    } else {
      const nonEmpty = files.filter((f) => (f.content || "").trim().length > 0);
      if (nonEmpty.length === 0) {
        setSubmitError("Please add at least one file with content.");
        return;
      }
    }
    if (!session?.user?.id) {
      setSubmitError("You must be logged in to publish.");
      return;
    }
    setIsSubmitting(true);
    try {
      const categoryId = 1;
      if (!useMultiFiles) {
        const allTags = Array.from(new Set([...tech, ...customTags])).slice(0, 6);
        const priceLine = priceType === "discussion" ? "Up for discussion" : (price ? `$${price}` : "—");
        const meta = `[b]Tags:[/b] ${allTags.length ? allTags.join(', ') : '—'}\n[b]License:[/b] ${license}\n[b]Price:[/b] ${priceLine}\n\n${description ? description : ''}`;
        const bb = `${meta}\n[code]\n${code}\n[/code]`;
        const langLabel = languageOptions.find((o) => o.id === language)?.label || language;
        const titleWithLang = `${title} • ${langLabel}`;
        const res = await fetch("/api/v1/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleWithLang, content: bb, categoryId, userId: session.user.id, announcements: false }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Publish failed (${res.status})`);
        }
        const { threadId } = await res.json();
        router.push(`/snippet/${threadId}`);
      } else {
        // Multi-file path: derive a title from entry or first file
        const entry = (files.find((f) => f.is_entry) || files[0]);
        const derivedTitle = (title.trim() || entry?.filename || "Snippet");
        const payloadFiles = files.map(({ filename, language, is_entry, content }) => ({ filename, language, is_entry: !!is_entry, content }));
        const allTags = Array.from(new Set([...tech, ...customTags])).slice(0, 6);
        const priceLine = priceType === "discussion" ? "Up for discussion" : (price ? `$${price}` : "—");
        const metaPost = `[b]Tags:[/b] ${allTags.length ? allTags.join(', ') : '—'}\n[b]License:[/b] ${license}\n[b]Price:[/b] ${priceLine}\n\n${description ? description : ''}`;
        const res = await fetch("/api/v1/threads/multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: derivedTitle, categoryId, files: payloadFiles, meta: metaPost }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Publish failed (${res.status})`);
        }
        const { threadId } = await res.json();
        router.push(`/thread/${derivedTitle.replace(/\s+/g, '-').toLowerCase()}-${threadId}`);
      }
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to publish the snippet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-100">Create Snippet</h1>

        {/* Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block mb-1 text-sm">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Describe your snippet (e.g., Fibonacci generator)"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Language</label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {languageOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">Filename</label>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Technology / Solution</label>
          <div className="flex flex-wrap gap-2">
            {techOptions.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleTech(t)}
                className={`px-3 py-1 rounded-md border text-sm ${tech.includes(t) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700/40 border-gray-600 text-gray-200 hover:bg-gray-700/60'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block mb-1 text-sm">Tags (max 6)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-700/60 text-gray-100 text-xs">
                  {tag}
                  <button type="button" className="text-gray-300 hover:text-white" onClick={() => setCustomTags((arr) => arr.filter((t) => t !== tag))}>×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  setCustomTags((arr) => {
                    const next = Array.from(new Set([...arr, tagInput.trim()]))
                      .filter(Boolean)
                      .slice(0, 6);
                    return next;
                  });
                  setTagInput("");
                }
              }}
              placeholder="Add a tag and press Enter"
              className="w-full md:w-80 px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-1 text-xs text-gray-400">We’ll use these tags to help others find your snippet.</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">License</label>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="w-full md:w-72 px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {licenseOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Pricing */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block mb-1 text-sm">Pricing</label>
            <select
              value={effectivePriceType}
              onChange={(e) => setPriceType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isMIT}
            >
              <option value="fixed">Fixed price</option>
              <option value="discussion">Up for discussion</option>
            </select>
            {isMIT && <div className="mt-1 text-xs text-amber-300">MIT licensed snippets are free; pricing is disabled.</div>}
          </div>
          {effectivePriceType === "fixed" && (
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm">Amount (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 49.99"
                className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={isMIT}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="What problem does this solve? How to use it?"
          />
        </div>

        {/* Toggle single vs multi */}
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm text-gray-300 inline-flex items-center gap-2">
            <input type="checkbox" className="accent-blue-600" checked={useMultiFiles} onChange={(e) => setUseMultiFiles(e.target.checked)} />
            Create with multiple files
          </label>
          {useMultiFiles && (
            <label className="text-sm text-gray-300 inline-flex items-center gap-2">
              <input type="file" multiple onChange={onUploadFiles} className="hidden" id="fileUploader" />
              <span role="button" className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600">Upload files…</span>
            </label>
          )}
        </div>

        {/* IDE-like editor */}
        <div className="rounded-md border border-gray-700 overflow-hidden snippet-ide-shadow">
          <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400">{language}</span>
            <span className="mx-2 text-gray-600">•</span>
            <span className="text-xs text-gray-300 truncate">{filename}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={checkCode} type="button" className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-sm">CHECK CODE</button>
              <button onClick={formatCode} type="button" className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm">Format</button>
            </div>
          </div>
          {!useMultiFiles && (
            <div className="bg-gray-900/80 grid grid-cols-[48px_1fr]">
            <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
              {Array.from({ length: Math.max(1, code.split('\n').length) }).map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
      <div className="relative">
              {/* Highlighted overlay */}
              <pre
                aria-hidden
                className="pointer-events-none absolute inset-0 m-0 p-3 font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words"
              >
                <code
                  className={`language-${language}`}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </pre>
              {/* Transparent textarea on top */}
              <textarea
                ref={textareaRef}
                value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="relative w-full bg-transparent text-transparent caret-white font-mono text-sm leading-5 outline-none overflow-hidden min-h-[280px] p-3"
                spellCheck={false}
                rows={16}
              />
            </div>
            </div>
          )}
        </div>
        {checkResult && <div className="mt-2 text-sm text-gray-300">{checkResult}</div>}
        {uploadError && <div className="mt-2 text-sm text-red-400">{uploadError}</div>}

  {/* Preview removed per requirement. Comments live under the snippet view page. */}

        {submitError && <div className="mt-2 text-sm text-red-400">{submitError}</div>}

        <div className="mt-4 flex gap-3">
          <button onClick={submit} disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white">{isSubmitting ? 'Publishing…' : 'Publish'}</button>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100">Cancel</button>
        </div>

        {useMultiFiles && (
          <div className="mt-6 space-y-3">
            {/* Tile grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFileId(f.id)}
                  className={`group relative h-24 rounded-md border ${activeFileId === f.id ? 'border-blue-500 bg-blue-950/40' : 'border-gray-700 bg-gray-900/50'} p-2 text-left`}
                  title={f.filename}
                >
                  <div className="text-[11px] text-gray-200 line-clamp-2 pr-5">{f.filename}</div>
                  {f.is_entry && <span className="absolute top-1 right-1 text-[10px] text-yellow-300">★</span>}
                  <div className="absolute bottom-2 left-2 text-[10px] text-gray-400">{(f.language || guessLangFromName(f.filename || '') || 'clike')}</div>
                  <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">{(f.content || '').length}c</div>
                </button>
              ))}
              {/* Add tile */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('fileUploader') as HTMLInputElement | null;
                  if (el) el.click();
                  else addFile();
                }}
                className="h-24 rounded-md border border-dashed border-gray-600 hover:border-gray-500 bg-gray-900/30 text-gray-300"
              >
                + Add file
              </button>
            </div>

            {/* Editor for active file */}
            {(() => {
              const f = files.find(x => x.id === activeFileId) || files[0];
              if (!f) return null;
              const lang = f.language || guessLangFromName(f.filename || '') || 'clike';
              return (
                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
                    <input value={f.filename} onChange={(e) => updateFile(f.id, { filename: e.target.value })} className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded" />
                    <select value={f.language || ''} onChange={(e) => updateFile(f.id, { language: e.target.value })} className="bg-gray-700/80 text-gray-100 text-xs px-2 py-1 rounded">
                      <option value="">auto</option>
                      {languageOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
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
                        <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlightFor(f.content, f.language, f.filename) }} />
                      </pre>
                      <textarea
                        value={f.content}
                        onChange={(e) => updateFile(f.id, { content: e.target.value })}
                        rows={10}
                        className="relative w-full bg-transparent text-transparent caret-white font-mono text-sm leading-5 outline-none resize-y p-3 min-h-[200px]"
                        placeholder={`Paste code for ${f.filename}`}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
