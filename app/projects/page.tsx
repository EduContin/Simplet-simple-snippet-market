export default function ProjectsPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-gray-100">Projects</h1>
        <p className="text-gray-300 mb-4 text-sm">
          Companies can post their needs and project documents here. Developers can apply to participate and earn based on contribution.
        </p>
        <div className="rounded border border-gray-700 p-4 bg-gray-900/60 text-gray-200 text-sm">
          Coming soon: submit project briefs with budget, documents, and timelines; search and apply to projects; escrow-backed payments.
        </div>
      </div>
    </main>
  );
}
