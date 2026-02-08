export default function SavedPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
        <p className="text-gray-600 mt-1">
          Listings you&apos;ve saved for later.
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">💾</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No saved listings
        </h3>
        <p className="text-gray-600">
          Save listings from your feed to review them later.
        </p>
      </div>
    </div>
  );
}
