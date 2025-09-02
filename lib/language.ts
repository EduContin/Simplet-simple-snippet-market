// Server-safe language helper (no "use client")
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
