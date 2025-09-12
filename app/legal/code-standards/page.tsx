export default function CodeStandardsPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Code Standards & Verification Policy</h1>
        <p className="text-gray-400 text-xs mb-4">Version: 1.0.0 • Effective: 2025-09-10</p>
        <div className="text-gray-200 whitespace-pre-wrap text-sm space-y-4">
          <section>
            <h2 className="text-lg font-semibold text-gray-100">Purpose</h2>
            <p>These standards define the required format and quality bar for snippets published on Simplet. Following them increases trust and allows Admins to award a verification badge that boosts visibility.</p>
          </section>
          <section>
            <h3 className="text-base font-semibold text-gray-100">Required Structure</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Top-level description: what the snippet does and when to use it.</li>
              <li>Installation block: dependencies and setup steps.</li>
              <li>Usage section with minimal runnable example.</li>
              <li>Configuration notes and environment variables (if any).</li>
              <li>Security considerations and limitations.</li>
              <li>License and attribution (if applicable).</li>
              <li>Changelog notes for non-breaking vs. breaking changes.</li>
            </ul>
          </section>
          <section>
            <h3 className="text-base font-semibold text-gray-100">Code Rules</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Readable, idiomatic code with clear naming; no obfuscation.</li>
              <li>No hardcoded secrets; use environment variables or parameters.</li>
              <li>Include input validation and error handling where relevant.</li>
              <li>Prefer dependency pinning and minimal footprint.</li>
              <li>Provide license-compatible third-party code and cite sources.</li>
            </ul>
          </section>
          <section>
            <h3 className="text-base font-semibold text-gray-100">Verification Badge Criteria</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Meets all Required Structure and Code Rules.</li>
              <li>Runs as documented (manual spot-checks may apply).</li>
              <li>Contains a working example and passes basic security review.</li>
              <li>Has clear licensing and author attribution.</li>
            </ul>
            <p className="text-gray-400 text-sm mt-2">Awarding the badge is at Admin discretion. Badges may be revoked if the snippet stops complying.</p>
          </section>
          <section>
            <h3 className="text-base font-semibold text-gray-100">Versioning</h3>
            <p>Updates to these standards will bump the version above and be listed here with effective dates. Authors should align snippets with the latest version to remain eligible.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
