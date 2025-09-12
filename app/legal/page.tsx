import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Legal & Policies</h1>
        <p className="text-gray-300 text-sm mb-2">Centralized legal resources for creators and buyers on Simplet.</p>
        <ul className="list-disc pl-5 text-blue-300 text-sm">
          <li><Link href="/legal/code-standards" className="hover:underline">Code Standards & Verification Policy</Link></li>
        </ul>
        <p className="text-gray-400 text-xs mt-4">These pages help ensure quality and consistency across the marketplace.</p>
      </div>
    </main>
  );
}
