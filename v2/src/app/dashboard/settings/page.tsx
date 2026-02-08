import { currentUser } from "@clerk/nextjs/server";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Email Forwarding Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📬 Email Forwarding
        </h2>
        <p className="text-gray-600 mb-4">
          Forward your StreetEasy alerts to this address:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-sm font-mono text-gray-800">
            {user?.id ? `${user.id.slice(0, 8).toLowerCase()}+se@listings.streetmonitor.app` : "Loading..."}
          </code>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
            📋 Copy
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Set up a filter in Gmail to auto-forward emails from streeteasy.com
        </p>
      </section>

      {/* Contact Profile Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          👤 Contact Profile
        </h2>
        <p className="text-gray-600 mb-4">
          This information is used when contacting listings on your behalf.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue={user?.fullName || ""}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reply-To Email
            </label>
            <input
              type="email"
              defaultValue={user?.emailAddresses[0]?.emailAddress || ""}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move-In Date
              </label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>ASAP</option>
                <option>1 Month</option>
                <option>2 Months</option>
                <option>Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease Term
              </label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>12 months</option>
                <option>6 months</option>
                <option>Flexible</option>
              </select>
            </div>
          </div>
        </div>
        
        <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Save Profile
        </button>
      </section>

      {/* Auto-Contact Settings */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Auto-Contact Mode
        </h2>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="autoContact" className="mt-1" defaultChecked />
            <div>
              <div className="font-medium text-gray-900">Review First</div>
              <div className="text-sm text-gray-600">Queue contacts for your approval before sending</div>
            </div>
          </label>
          
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="autoContact" className="mt-1" />
            <div>
              <div className="font-medium text-gray-900">Off</div>
              <div className="text-sm text-gray-600">I&apos;ll contact listings manually</div>
            </div>
          </label>
          
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="autoContact" className="mt-1" />
            <div>
              <div className="font-medium text-gray-900">Auto-Send</div>
              <div className="text-sm text-gray-600">Contact matching listings immediately (max 10/day)</div>
            </div>
          </label>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-700">Only no-fee listings</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-700">Skip studios</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Max price:</span>
            <input
              type="number"
              className="w-32 px-3 py-1 border border-gray-200 rounded-lg text-sm"
              placeholder="$3,500"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
