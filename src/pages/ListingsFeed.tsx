import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { ListingCard } from "../components/ListingCard";
import { StatusBadge } from "../components/StatusBadge";
import type { Listing } from "../types/listing";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "new" | "interested" | "reached_out" | "touring" | "applied" | "rejected";
type SortOption = "newest" | "price-asc" | "price-desc";

interface FilterState {
  status: StatusFilter;
  neighborhoods: string[];
  maxPrice: number | null;
  minBeds: number | null;
  noFeeOnly: boolean;
}

const STATUS_TABS: { value: StatusFilter; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "📋" },
  { value: "new", label: "New", emoji: "✨" },
  { value: "interested", label: "Saved", emoji: "💜" },
  { value: "reached_out", label: "Contacted", emoji: "📧" },
  { value: "touring", label: "Touring", emoji: "🏠" },
];

export function ListingsFeed() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.listings.updateStatus);
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    neighborhoods: [],
    maxPrice: null,
    minBeds: null,
    noFeeOnly: false,
  });

  // Get unique neighborhoods
  const neighborhoods = useMemo(() => {
    if (!listings) return [];
    return [...new Set(listings.map((l) => l.neighborhood).filter(Boolean))].sort() as string[];
  }, [listings]);

  // Get status counts
  const statusCounts = useMemo(() => {
    if (!listings) return {};
    const counts: Record<string, number> = { all: listings.length };
    listings.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return counts;
  }, [listings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    let result = [...listings];
    
    // Status filter
    if (filters.status !== "all") {
      result = result.filter((l) => l.status === filters.status);
    }
    
    // Other filters
    if (filters.neighborhoods.length > 0) {
      result = result.filter((l) => filters.neighborhoods.includes(l.neighborhood || ""));
    }
    if (filters.maxPrice) {
      result = result.filter((l) => l.price <= filters.maxPrice!);
    }
    if (filters.minBeds !== null) {
      result = result.filter((l) => (l.bedrooms ?? 0) >= filters.minBeds!);
    }
    if (filters.noFeeOnly) {
      result = result.filter((l) => l.noFee);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return b.foundAt - a.foundAt;
      }
    });
    
    return result;
  }, [listings, filters, sortBy]);

  const handleAction = useCallback(
    async (listing: Listing, action: "contact" | "save" | "skip" | "view") => {
      if (action === "view") {
        window.open(listing.streetEasyUrl, "_blank", "noopener,noreferrer");
        return;
      }
      
      const statusMap = {
        contact: "reached_out",
        save: "interested",
        skip: "rejected",
      };
      
      await updateStatus({ id: listing._id, status: statusMap[action] });
    },
    [updateStatus]
  );

  const clearFilters = () => {
    setFilters({
      status: "all",
      neighborhoods: [],
      maxPrice: null,
      minBeds: null,
      noFeeOnly: false,
    });
  };

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
        <div className="mx-auto max-w-6xl px-4">
          {/* Top Row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <h1 className="text-lg font-bold text-gray-900">StreetEasy Monitor</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === "grid" ? "bg-white shadow text-gray-900" : "text-gray-500"
                  }`}
                >
                  ▦ Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === "list" ? "bg-white shadow text-gray-900" : "text-gray-500"
                  }`}
                >
                  ☰ List
                </button>
              </div>
              
              {/* Filters Button */}
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
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
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
          
          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.value }))}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filters.status === tab.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {statusCounts[tab.value] !== undefined && (
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    filters.status === tab.value
                      ? "bg-white/20"
                      : "bg-gray-200"
                  }`}>
                    {statusCounts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
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
              <div className="mx-auto max-w-6xl space-y-4 p-4">
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
                
                {/* Other Filters */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
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
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredListings.length}</span> listings
          </p>
        </div>
        
        {/* Empty State */}
        {filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">No listings found</h3>
            <p className="mb-6 text-gray-500">
              {hasActiveFilters
                ? "Try adjusting your filters to see more listings."
                : "Check back later for new listings!"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-600 hover:bg-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {viewMode === "grid" ? (
              <motion.div
                layout
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing as Listing}
                    onAction={(action) => handleAction(listing as Listing, action)}
                    variant="full"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div layout className="space-y-3">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing as Listing}
                    onAction={(action) => handleAction(listing as Listing, action)}
                    variant="compact"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default ListingsFeed;
