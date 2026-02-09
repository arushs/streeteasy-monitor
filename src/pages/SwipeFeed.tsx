import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { CardStack } from "../components/CardStack";
import type { Listing, SwipeDirection } from "../types/listing";

type FilterState = {
  neighborhoods: string[];
  maxPrice: number | null;
  minBeds: number | null;
  noFeeOnly: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  neighborhoods: [],
  maxPrice: null,
  minBeds: null,
  noFeeOnly: false,
};

export function SwipeFeed() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.listings.updateStatus);
  
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [contactModal, setContactModal] = useState<Listing | null>(null);

  // Get unique neighborhoods for filter
  const neighborhoods = useMemo(() => {
    if (!listings) return [];
    return [...new Set(listings.map((l) => l.neighborhood).filter(Boolean))].sort() as string[];
  }, [listings]);

  // Filter listings to only show "new" status and apply filters
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    return listings.filter((listing) => {
      // Only show new listings in swipe mode
      if (listing.status !== "new") return false;
      
      // Apply filters
      if (filters.neighborhoods.length > 0 && !filters.neighborhoods.includes(listing.neighborhood || "")) {
        return false;
      }
      if (filters.maxPrice && listing.price > filters.maxPrice) {
        return false;
      }
      if (filters.minBeds !== null && (listing.bedrooms ?? 0) < filters.minBeds) {
        return false;
      }
      if (filters.noFeeOnly && !listing.noFee) {
        return false;
      }
      
      return true;
    }).sort((a, b) => b.foundAt - a.foundAt); // Newest first
  }, [listings, filters]);

  const handleSwipe = useCallback(
    async (listing: Listing, direction: SwipeDirection) => {
      const statusMap: Record<SwipeDirection, string> = {
        left: "rejected",
        right: "interested", // Saved
        up: "reached_out", // Will trigger contact flow
      };
      
      const newStatus = statusMap[direction];
      
      // If swiped up (contact), show contact modal
      if (direction === "up") {
        setContactModal(listing);
      }
      
      // Update status in database
      await updateStatus({ id: listing._id, status: newStatus });
    },
    [updateStatus]
  );

  const handleViewDetails = useCallback((listing: Listing) => {
    window.open(listing.streetEasyUrl, "_blank", "noopener,noreferrer");
  }, []);

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.neighborhoods.length > 0 ||
    filters.maxPrice !== null ||
    filters.minBeds !== null ||
    filters.noFeeOnly;

  if (!listings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <h1 className="text-lg font-bold text-gray-900">StreetEasy</h1>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>⚙️</span>
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {[
                  filters.neighborhoods.length > 0,
                  filters.maxPrice !== null,
                  filters.minBeds !== null,
                  filters.noFeeOnly,
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
        
        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 bg-white"
            >
              <div className="mx-auto max-w-lg space-y-4 p-4">
                {/* Neighborhoods */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Neighborhoods
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {neighborhoods.map((hood) => (
                      <button
                        key={hood}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            neighborhoods: prev.neighborhoods.includes(hood)
                              ? prev.neighborhoods.filter((h) => h !== hood)
                              : [...prev.neighborhoods, hood],
                          }));
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          filters.neighborhoods.includes(hood)
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {hood}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price & Beds Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Max Price
                    </label>
                    <select
                      value={filters.maxPrice ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxPrice: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Any</option>
                      <option value="2000">$2,000</option>
                      <option value="2500">$2,500</option>
                      <option value="3000">$3,000</option>
                      <option value="3500">$3,500</option>
                      <option value="4000">$4,000</option>
                      <option value="5000">$5,000</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Min Bedrooms
                    </label>
                    <select
                      value={filters.minBeds ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minBeds: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Any</option>
                      <option value="0">Studio+</option>
                      <option value="1">1 BR+</option>
                      <option value="2">2 BR+</option>
                      <option value="3">3 BR+</option>
                    </select>
                  </div>
                </div>
                
                {/* No Fee Toggle */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.noFeeOnly}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, noFeeOnly: e.target.checked }))
                    }
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">No Fee Only</span>
                </label>
                
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        <CardStack
          listings={filteredListings as Listing[]}
          onSwipe={handleSwipe}
          onViewDetails={handleViewDetails}
        />
      </main>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={() => setContactModal(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-3xl">📧</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Contact Landlord</h2>
                <p className="text-gray-500">
                  Ready to reach out about this listing?
                </p>
              </div>
              
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">
                  ${contactModal.price.toLocaleString()}/mo
                </p>
                <p className="text-gray-600">{contactModal.address}</p>
                <p className="text-sm text-gray-400">
                  {contactModal.bedrooms === 0 ? "Studio" : `${contactModal.bedrooms} BR`}
                  {contactModal.neighborhood && ` • ${contactModal.neighborhood}`}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setContactModal(null)}
                  className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <a
                  href={contactModal.streetEasyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-center font-semibold text-white transition-colors hover:bg-indigo-700"
                  onClick={() => setContactModal(null)}
                >
                  Open on StreetEasy
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SwipeFeed;
