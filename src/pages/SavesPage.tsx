import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Listing {
  _id: Id<"listings">;
  streetEasyUrl: string;
  price: number;
  status: string;
  address?: string;
  bedrooms?: number;
  neighborhood?: string;
  noFee?: boolean;
  foundAt: number;
  imageUrl?: string;
}

export function SavesPage() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.listings.updateStatus);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Filter to only show "interested" (saved) listings
  const savedListings = useMemo(() => {
    if (!listings) return [];
    return listings
      .filter((l) => l.status === "interested")
      .sort((a, b) => b.foundAt - a.foundAt);
  }, [listings]);

  const handleRemove = async (id: Id<"listings">) => {
    setRemovingId(id);
    try {
      await updateStatus({ id, status: "rejected" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleContact = (listing: Listing) => {
    window.open(listing.streetEasyUrl, "_blank", "noopener,noreferrer");
  };

  if (!listings) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16 pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-rose-500" />
          <span className="text-sm font-medium text-gray-500">Loading saves...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <h1 className="text-lg font-bold text-gray-900">Saved Listings</h1>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {savedListings.length} {savedListings.length === 1 ? "place" : "places"}
          </span>
        </div>
      </header>

      {/* Content */}
      {savedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-32 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-4xl">💔</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">No saves yet</h2>
          <p className="text-gray-500 max-w-[260px]">
            Swipe right on listings you like to save them here for later
          </p>
        </div>
      ) : (
        <div className="px-4 sm:px-6 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
          <AnimatePresence mode="popLayout">
            {savedListings.map((listing) => (
              <motion.div
                key={listing._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={`
                  bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden
                  ${removingId === listing._id ? "opacity-50" : ""}
                `}
              >
                {/* Card Content */}
                <div className="p-4 sm:p-5">
                  {/* Header: Address & Price */}
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="font-semibold text-gray-900 text-[15px] sm:text-base leading-tight line-clamp-2">
                        {listing.address || "Address not available"}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">
                          ${listing.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        {listing.neighborhood || "NYC"}
                      </p>
                      <p className="text-xs text-gray-400">/month</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
                    </span>
                    {listing.noFee && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        No Fee
                      </span>
                    )}
                  </div>

                  {/* Actions - larger tap targets for mobile */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRemove(listing._id)}
                      disabled={removingId === listing._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-gray-100 text-gray-700 font-medium text-sm active:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                    <button
                      onClick={() => handleContact(listing)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium text-sm shadow-sm active:opacity-90 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default SavesPage;
