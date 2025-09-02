"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/models/slugify";
import { useSession } from "next-auth/react";

interface CreateThreadFormProps {
  categoryId: number;
}

const CreateThreadForm: React.FC<CreateThreadFormProps> = ({ categoryId }) => {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    // Wrap content in [code] tags so the viewer renders it as a snippet
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
      
  <div className="relative mb-4">
        {/* Clean IDE-like editor only */}
        <div className="rounded-md border border-gray-700 overflow-hidden snippet-ide-shadow">
          <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400">Editor</span>
          </div>
          <div className="bg-gray-900/80 grid grid-cols-[40px_1fr]">
            {/* Line numbers */}
            <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
              {Array.from({ length: Math.max(1, content.split('\n').length) }).map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <div className="p-3">
              <textarea
                id="content"
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full bg-transparent text-gray-100 font-mono text-sm leading-5 outline-none resize-y min-h-[200px]"
                rows={10}
                required
                spellCheck={false}
              />
            </div>
          </div>
        </div>
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
