export default function QueuePage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contact Queue</h1>
        <p className="text-gray-600 mt-1">
          Review and approve contacts before they&apos;re sent.
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No contacts pending
        </h3>
        <p className="text-gray-600 mb-6">
          When you have listings to contact, they&apos;ll appear here for review.
        </p>
      </div>
    </div>
  );
}
