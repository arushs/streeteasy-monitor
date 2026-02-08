export default function SentPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contact History</h1>
        <p className="text-gray-600 mt-1">
          Track your sent contacts and responses.
        </p>
      </div>

      {/* Stats bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            <strong className="text-gray-900">0</strong> contacts sent
          </span>
          <span className="text-gray-600">
            Response rate: <strong className="text-gray-900">--</strong>
          </span>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">📨</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No contacts sent yet
        </h3>
        <p className="text-gray-600">
          Contact a listing from your feed to start tracking responses.
        </p>
      </div>
    </div>
  );
}
