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

function FilterChip({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-colors
        ${active
          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
        }
      `}
    >
      {label}
    </button>
  );
}

export function SwipeFeed() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.admin.updateListingStatus);
  
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
        up: "reached_out", // Opens StreetEasy to contact
      };
      
      const newStatus = statusMap[direction];
      
      // If swiped up (contact), open StreetEasy listing
      if (direction === "up") {
        window.open(listing.streetEasyUrl, "_blank", "noopener,noreferrer");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
          <span className="text-sm font-medium text-gray-500">Finding apartments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Translucent Header - Fixed at top */}
      <header className="fixed left-0 right-0 top-0 z-[200]">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <h1 className="text-lg font-bold text-gray-900">StreetYeet</h1>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                hasActiveFilters
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                  : "bg-gray-100/80 text-gray-700 hover:bg-gray-200/80"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
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
        </div>
        
        {/* Filter Panel - Slide down with glassmorphic style */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg"
            >
              <div className="space-y-5 p-5">
                {/* Close button */}
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Neighborhoods */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Neighborhoods
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {neighborhoods.map((hood) => (
                      <FilterChip
                        key={hood}
                        label={hood}
                        active={filters.neighborhoods.includes(hood)}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            neighborhoods: prev.neighborhoods.includes(hood)
                              ? prev.neighborhoods.filter((h) => h !== hood)
                              : [...prev.neighborhoods, hood],
                          }));
                        }}
                      />
                    ))}
                    {neighborhoods.length === 0 && (
                      <span className="text-sm text-gray-400">No neighborhoods yet</span>
                    )}
                  </div>
                </div>
                
                {/* Price & Beds Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Any price</option>
                      <option value="2000">$2,000</option>
                      <option value="2500">$2,500</option>
                      <option value="3000">$3,000</option>
                      <option value="3500">$3,500</option>
                      <option value="4000">$4,000</option>
                      <option value="5000">$5,000</option>
                      <option value="6000">$6,000</option>
                      <option value="8000">$8,000</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Bedrooms
                    </label>
                    <select
                      value={filters.minBeds ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minBeds: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters.noFeeOnly}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, noFeeOnly: e.target.checked }))
                      }
                      className="peer sr-only"
                    />
                    <div className="h-7 w-12 rounded-full bg-gray-200 peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">No Fee Only</span>
                </label>
                
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content - CardStack handles full-screen */}
      <main>
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
            className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => setContactModal(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                  <span className="text-3xl">📧</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Contact Landlord</h2>
                <p className="text-gray-500">
                  Ready to reach out about this listing?
                </p>
              </div>
              
              <div className="mb-6 rounded-2xl bg-gray-50 p-5">
                <p className="text-2xl font-bold text-gray-900">
                  ${contactModal.price.toLocaleString()}/mo
                </p>
                <p className="text-lg font-medium text-gray-700">{contactModal.address}</p>
                <p className="text-sm text-gray-400">
                  {contactModal.bedrooms === 0 ? "Studio" : `${contactModal.bedrooms} BR`}
                  {contactModal.neighborhood && ` • ${contactModal.neighborhood}`}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setContactModal(null)}
                  className="flex-1 rounded-2xl bg-gray-100 py-4 font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <a
                  href={contactModal.streetEasyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-center font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-300/50"
                  onClick={() => setContactModal(null)}
                >
                  Open StreetEasy
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
