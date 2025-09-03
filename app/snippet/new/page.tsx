"use client";

import React, { useMemo, useRef, useState } from "react";
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
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!title.trim() || !code.trim()) {
      setSubmitError("Title and code are required.");
      return;
    }
    if (!session?.user?.id) {
      setSubmitError("You must be logged in to publish.");
      return;
    }
    setIsSubmitting(true);
    try {
  const priceLine = priceType === "discussion" ? "Up for discussion" : (price ? `$${price}` : "—");
  const meta = `[b]Tags:[/b] ${tech.length ? tech.join(', ') : '—'}\n[b]License:[/b] ${license}\n[b]Price:[/b] ${priceLine}\n\n${description ? description : ''}`;
      const bb = `${meta}\n[code]\n${code}\n[/code]`;
      const categoryId = 1; // fallback: map language/tech to categories later
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
        </div>
        {checkResult && <div className="mt-2 text-sm text-gray-300">{checkResult}</div>}

  {/* Preview removed per requirement. Comments live under the snippet view page. */}

        {submitError && <div className="mt-2 text-sm text-red-400">{submitError}</div>}

        <div className="mt-4 flex gap-3">
          <button onClick={submit} disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white">{isSubmitting ? 'Publishing…' : 'Publish'}</button>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100">Cancel</button>
        </div>
      </div>
    </main>
  );
}
