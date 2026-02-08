"use client";

import { formatDistanceToNow } from "@/lib/utils";

interface Listing {
  id: string;
  address: string;
  unit?: string | null;
  price: number;
  bedrooms: number;
  neighborhood: string;
  noFee: boolean;
  createdAt: Date;
  status: "new" | "saved" | "contacted" | "skipped";
  imageUrl?: string | null;
}

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const isNew = listing.status === "new";
  const isContacted = listing.status === "contacted";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Image placeholder */}
        <div className="hidden sm:block w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              🏠
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {isNew && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    🆕 NEW
                  </span>
                )}
                {isContacted && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    ⏳ Contacted
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mt-1">
                {listing.address}
                {listing.unit && `, ${listing.unit}`}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {listing.bedrooms}BR • {listing.neighborhood}
                {listing.noFee && (
                  <span className="text-green-600 font-medium"> • No Fee</span>
                )}
                {!listing.noFee && (
                  <span className="text-amber-600"> • Broker Fee</span>
                )}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-gray-900">
                ${listing.price.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(listing.createdAt)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {isNew && (
              <>
                <button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                  📧 Contact
                </button>
                <button className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                  💾 Save
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  ❌
                </button>
              </>
            )}
            {isContacted && (
              <span className="text-sm text-gray-500">
                Awaiting response...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
