import React from "react";
import SnippetCode from "@/components/SnippetCode";
import { mapCategoryToLanguage } from "@/lib/language";

const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getThread(threadId: string) {
  const res = await fetch(`${apiUrl}/api/v1/threads?threadId=${threadId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch thread");
  const list = await res.json();
  return list[0];
}

async function getFirstPost(threadId: string) {
  const res = await fetch(`${apiUrl}/api/v1/posts?threadId=${threadId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  const posts = await res.json();
  return posts?.[0];
}

function extractCodeFromBBCode(content: string): string {
  const m = content.match(/\[code\]([\s\S]*?)\[\/code\]/i);
  return (m?.[1] || content || "").trim();
}

export default async function SnippetPage({ params }: { params: { id: string } }) {
  const thread = await getThread(params.id);
  const firstPost = await getFirstPost(params.id);
  const code = extractCodeFromBBCode(firstPost?.content || "");
  const language = mapCategoryToLanguage(thread?.category_name || thread?.title || "");

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-100">{thread?.title || "Snippet"}</h1>
        <SnippetCode code={code} language={language} />
      </div>
    </main>
  );
}
