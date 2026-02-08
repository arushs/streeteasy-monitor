import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { StatsCard } from "@/components/StatsCard";

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName || "there";

  // Mock data for now - will come from database later
  const stats = {
    newListings: 5,
    pendingReview: 2,
    newResponses: 1,
    totalContacted: 12,
  };

  const mockListings = [
    {
      id: "1",
      address: "123 E 4th St",
      unit: "#2B",
      price: 2800,
      bedrooms: 2,
      neighborhood: "East Village",
      noFee: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "new" as const,
      imageUrl: null,
    },
    {
      id: "2",
      address: "456 W 23rd St",
      unit: "#5F",
      price: 3200,
      bedrooms: 1,
      neighborhood: "Chelsea",
      noFee: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      status: "new" as const,
      imageUrl: null,
    },
    {
      id: "3",
      address: "789 Bedford Ave",
      unit: "#3R",
      price: 2650,
      bedrooms: 1,
      neighborhood: "Williamsburg",
      noFee: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "contacted" as const,
      imageUrl: null,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good evening, {firstName}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s what&apos;s happening with your apartment search.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon="🆕"
          label="New Listings"
          value={stats.newListings}
          href="/dashboard"
        />
        <StatsCard
          icon="✉️"
          label="Pending Review"
          value={stats.pendingReview}
          href="/dashboard/queue"
          highlight
        />
        <StatsCard
          icon="💬"
          label="New Responses"
          value={stats.newResponses}
          href="/dashboard/sent"
          highlight={stats.newResponses > 0}
        />
        <StatsCard
          icon="📊"
          label="Total Contacted"
          value={stats.totalContacted}
          href="/dashboard/sent"
        />
      </div>

      {/* Listings Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Today&apos;s Listings
          </h2>
          <div className="flex items-center gap-2">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>All Neighborhoods</option>
              <option>East Village</option>
              <option>Chelsea</option>
              <option>Williamsburg</option>
            </select>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Any Price</option>
              <option>Under $2,500</option>
              <option>$2,500 - $3,000</option>
              <option>$3,000+</option>
            </select>
          </div>
        </div>

        {/* Listings */}
        <div className="space-y-4">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {mockListings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Waiting for StreetEasy alerts...
            </h3>
            <p className="text-gray-600 mb-6">
              We&apos;ll process listings as soon as you forward your first email.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Check Forwarding Setup
            </Link>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <span className="text-xl">📈</span>
          <span>
            <strong>This Week:</strong> 12 new listings | 5 contacted | 2
            responses
          </span>
        </div>
      </div>
    </div>
  );
}
