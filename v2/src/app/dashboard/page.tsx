"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ListingCard } from "@/components/ListingCard";
import { StatsCard } from "@/components/StatsCard";
import { FilterBar } from "@/components/FilterBar";
import type { Listing, ListingFilters } from "@/types/listing";

// Mock data for now - will come from database later
const mockListings: Listing[] = [
  {
    id: "1",
    address: "123 E 4th St",
    unit: "#2B",
    price: 2800,
    bedrooms: 2,
    bathrooms: 1,
    neighborhood: "East Village",
    noFee: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "new",
    imageUrl: null,
    streetEasyUrl: "https://streeteasy.com/building/123-east-4-street-new-york",
    brokerName: "Jane Smith",
    brokerEmail: "jane@realty.com",
  },
  {
    id: "2",
    address: "456 W 23rd St",
    unit: "#5F",
    price: 3200,
    bedrooms: 1,
    bathrooms: 1,
    neighborhood: "Chelsea",
    noFee: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: "new",
    imageUrl: null,
    streetEasyUrl: "https://streeteasy.com/building/456-west-23-street",
  },
  {
    id: "3",
    address: "789 Bedford Ave",
    unit: "#3R",
    price: 2650,
    bedrooms: 1,
    bathrooms: 1,
    neighborhood: "Williamsburg",
    noFee: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    contactedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "contacted",
    imageUrl: null,
    brokerName: "Michael Chen",
  },
  {
    id: "4",
    address: "321 Mott St",
    unit: "#6A",
    price: 2400,
    bedrooms: 0,
    bathrooms: 1,
    neighborhood: "NoLita",
    noFee: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: "new",
    imageUrl: null,
  },
  {
    id: "5",
    address: "555 Grand St",
    unit: "#2C",
    price: 3800,
    bedrooms: 2,
    bathrooms: 2,
    neighborhood: "Lower East Side",
    noFee: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: "saved",
    imageUrl: null,
    brokerName: "Sarah Johnson",
  },
];

const NEIGHBORHOODS = [
  "East Village",
  "West Village",
  "Chelsea",
  "Williamsburg",
  "NoLita",
  "Lower East Side",
  "FiDi",
  "NoHo",
  "SoHo",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [filters, setFilters] = useState<ListingFilters>({});

  // Stats calculated from listings
  const stats = {
    newListings: listings.filter((l) => l.status === "new").length,
    pendingReview: 2, // Would come from contact queue
    newResponses: 1, // Would come from contacts with responses
    totalContacted: listings.filter((l) => l.status === "contacted").length,
  };

  const handleContact = (id: string) => {
    // In reality, this would open a contact modal or add to queue
    console.log("Contact listing:", id);
    setListings((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "contacted", contactedAt: new Date() } : l
      )
    );
  };

  const handleSave = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "saved" } : l))
    );
  };

  const handleHide = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "skipped" } : l))
    );
  };

  const handleArchive = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  // Apply filters
  const filteredListings = listings.filter((listing) => {
    // Don't show skipped listings in main feed
    if (listing.status === "skipped") return false;

    if (filters.neighborhood && listing.neighborhood !== filters.neighborhood) {
      return false;
    }
    if (filters.minPrice && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && listing.price > filters.maxPrice) {
      return false;
    }
    if (filters.bedrooms !== null && filters.bedrooms !== undefined) {
      if (filters.bedrooms === 4) {
        if (listing.bedrooms < 4) return false;
      } else if (listing.bedrooms !== filters.bedrooms) {
        return false;
      }
    }
    if (filters.noFeeOnly && !listing.noFee) {
      return false;
    }
    return true;
  });

  // Sort: new listings first, then by date
  const sortedListings = [...filteredListings].sort((a, b) => {
    // New listings come first
    if (a.status === "new" && b.status !== "new") return -1;
    if (a.status !== "new" && b.status === "new") return 1;
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const newListings = sortedListings.filter((l) => l.status === "new");
  const otherListings = sortedListings.filter((l) => l.status !== "new");

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName}
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

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          neighborhoods={NEIGHBORHOODS}
          totalCount={listings.filter((l) => l.status !== "skipped").length}
          filteredCount={filteredListings.length}
        />
      </div>

      {/* Listings Section */}
      {sortedListings.length > 0 ? (
        <div className="space-y-8">
          {/* New Listings */}
          {newListings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                New Listings ({newListings.length})
              </h2>
              <div className="space-y-4">
                {newListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onContact={handleContact}
                    onSave={handleSave}
                    onHide={handleHide}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Listings (Saved, Contacted) */}
          {otherListings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">
                Previous ({otherListings.length})
              </h2>
              <div className="space-y-4">
                {otherListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onContact={handleContact}
                    onSave={handleSave}
                    onHide={handleHide}
                    onArchive={handleArchive}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : filteredListings.length === 0 && listings.length > 0 ? (
        /* No results after filtering */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No listings match your filters
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filter criteria.
          </p>
          <button
            onClick={() => setFilters({})}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Empty State - No listings at all */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Waiting for StreetEasy alerts...
          </h3>
          <p className="text-gray-600 mb-6">
            We&apos;ll process listings as soon as you forward your first email.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Check Forwarding Setup
          </a>
        </div>
      )}

      {/* Weekly Summary */}
      {listings.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <span className="text-xl">📈</span>
            <span>
              <strong>This Week:</strong> {listings.length} listings found |{" "}
              {stats.totalContacted} contacted | {stats.newResponses} response
              {stats.newResponses !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
