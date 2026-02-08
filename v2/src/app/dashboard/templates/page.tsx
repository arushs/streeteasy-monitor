export default function TemplatesPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Templates</h1>
          <p className="text-gray-600 mt-1">
            Customize your contact messages.
          </p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Template
        </button>
      </div>

      {/* Default Template */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Standard Inquiry</h3>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                Default
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Professional inquiry template for apartment listings
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            Edit
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-2">Subject: Inquiry: {"{{address}}"} - {"{{bedrooms}}"}BR</p>
          <p>Hi, I&apos;m interested in the {"{{bedrooms}}"}-bedroom apartment at {"{{address}}"} listed for {"{{price}}"}/month...</p>
        </div>
      </div>
    </div>
  );
}
