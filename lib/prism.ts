"use client";

// Centralized PrismJS setup and helpers
import Prism from "prismjs";
// Load common languages
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-go";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-css";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";

export function mapCategoryToLanguage(categoryOrHint?: string): string {
  const key = (categoryOrHint || "").toLowerCase();
  if (/typescript|ts/.test(key)) return "tsx"; // prefer tsx for better coverage
  if (/javascript|node|js/.test(key)) return "jsx";
  if (/python|py/.test(key)) return "python";
  if (/go\b/.test(key)) return "go";
  if (/sql/.test(key)) return "sql";
  if (/html|markup/.test(key)) return "markup";
  if (/css|tailwind/.test(key)) return "css";
  if (/java\b/.test(key)) return "java";
  if (/c\+\+|cpp/.test(key)) return "cpp";
  if (/c#|csharp/.test(key)) return "c"; // Prism C# requires plugin not included; fallback
  if (/rust/.test(key)) return "rust";
  if (/php/.test(key)) return "php";
  if (/ruby|rb/.test(key)) return "ruby";
  return "jsx";
}

export { Prism };
