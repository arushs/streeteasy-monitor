"use client";

import { useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar } from "@/components/FilterBar";
import type { Listing, ListingFilters } from "@/types/listing";

// Mock saved listings
const mockSavedListings: Listing[] = [
  {
    id: "s1",
    address: "245 E 13th St",
    unit: "#4B",
    price: 2950,
    bedrooms: 2,
    bathrooms: 1,
    neighborhood: "East Village",
    noFee: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: "saved",
    imageUrl: null,
    streetEasyUrl: "https://streeteasy.com/building/245-east-13-street",
    brokerName: "Jane Smith",
  },
  {
    id: "s2",
    address: "88 Greenwich St",
    unit: "#12F",
    price: 3400,
    bedrooms: 1,
    bathrooms: 1,
    neighborhood: "FiDi",
    noFee: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "saved",
    imageUrl: null,
    streetEasyUrl: "https://streeteasy.com/building/88-greenwich-street",
  },
  {
    id: "s3",
    address: "155 Rivington St",
    unit: "#3A",
    price: 2600,
    bedrooms: 1,
    bathrooms: 1,
    neighborhood: "Lower East Side",
    noFee: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "saved",
    imageUrl: null,
    brokerName: "Michael Chen",
  },
];

const NEIGHBORHOODS = [
  "East Village",
  "West Village",
  "Chelsea",
  "FiDi",
  "Lower East Side",
  "Williamsburg",
  "NoHo",
  "SoHo",
];

export default function SavedPage() {
  const [listings, setListings] = useState<Listing[]>(mockSavedListings);
  const [filters, setFilters] = useState<ListingFilters>({});

  const handleContact = (id: string) => {
    // In reality, this would open a contact modal or add to queue
    console.log("Contact listing:", id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "contacted", contactedAt: new Date() } : l))
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

  const activeSavedListings = filteredListings.filter(
    (l) => l.status === "saved"
  );
  const contactedListings = filteredListings.filter(
    (l) => l.status === "contacted"
  );

  const hasListings = listings.length > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
        <p className="text-gray-600 mt-1">
          Listings you&apos;ve saved for later.
        </p>
      </div>

      {hasListings ? (
        <>
          {/* Filter bar */}
          <div className="mb-6">
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              neighborhoods={NEIGHBORHOODS}
              totalCount={listings.length}
              filteredCount={filteredListings.length}
            />
          </div>

          {/* Active saved listings */}
          {activeSavedListings.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Saved ({activeSavedListings.length})
                </h2>
              </div>
              <div className="space-y-4">
                {activeSavedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onContact={handleContact}
                    onHide={handleHide}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contacted listings */}
          {contactedListings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-500">
                  Contacted ({contactedListings.length})
                </h2>
              </div>
              <div className="space-y-4">
                {contactedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    showActions={true}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results after filtering */}
          {filteredListings.length === 0 && (
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
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">💾</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No saved listings
          </h3>
          <p className="text-gray-600 mb-6">
            Save listings from your feed to review them later.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Browse Listings →
          </a>
        </div>
      )}
    </div>
  );
}
