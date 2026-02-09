import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import SwipeFeed from "./pages/SwipeFeed";

// View type for toggle
type ViewMode = "swipe" | "kanban";

// Status column configuration
const COLUMNS = [
  { id: "new", label: "New", emoji: "📥", color: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-800" },
  { id: "interested", label: "Interested", emoji: "👀", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800" },
  { id: "reached_out", label: "Reached Out", emoji: "📧", color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800" },
  { id: "touring", label: "Touring", emoji: "🚶", color: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-800" },
  { id: "applied", label: "Applied", emoji: "📝", color: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-100 text-indigo-800" },
  { id: "rejected", label: "Rejected", emoji: "❌", color: "bg-gray-50 border-gray-200", badge: "bg-gray-100 text-gray-600" },
] as const;

type StatusType = typeof COLUMNS[number]["id"];

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
}

interface ListingCardProps {
  listing: Listing;
  onStatusChange: (id: Id<"listings">, newStatus: StatusType) => void;
  isUpdating: boolean;
}

function ListingCard({ listing, onStatusChange, isUpdating }: ListingCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-3 mb-2 transition-all hover:shadow-md ${isUpdating ? 'opacity-50' : ''}`}>
      {/* Address */}
      <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
        {listing.address || "Address not available"}
      </div>
      
      {/* Price & Beds */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold text-green-600">
          ${listing.price.toLocaleString()}
        </span>
        {listing.bedrooms !== undefined && (
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
          </span>
        )}
        {listing.noFee && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
            No Fee
          </span>
        )}
      </div>
      
      {/* Neighborhood */}
      {listing.neighborhood && (
        <div className="text-xs text-gray-500 mb-2">
          📍 {listing.neighborhood}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <a
          href={listing.streetEasyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View on StreetEasy →
        </a>
        
        {/* Status Change Button */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            disabled={isUpdating}
          >
            Move ▾
          </button>
          
          {showStatusMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[140px]">
                {COLUMNS.filter(col => col.id !== listing.status).map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onStatusChange(listing._id, col.id);
                      setShowStatusMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>{col.emoji}</span>
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof COLUMNS[number];
  listings: Listing[];
  onStatusChange: (id: Id<"listings">, newStatus: StatusType) => void;
  updatingIds: Set<string>;
}

function KanbanColumn({ column, listings, onStatusChange, updatingIds }: KanbanColumnProps) {
  return (
    <div className={`flex-shrink-0 w-72 md:w-80 rounded-lg border ${column.color}`}>
      {/* Column Header */}
      <div className="p-3 border-b border-inherit">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>{column.emoji}</span>
            <span>{column.label}</span>
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${column.badge}`}>
            {listings.length}
          </span>
        </div>
      </div>
      
      {/* Cards */}
      <div className="p-2 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[200px]">
        {listings.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No listings
          </div>
        ) : (
          listings.map(listing => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onStatusChange={onStatusChange}
              isUpdating={updatingIds.has(listing._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type SortOption = "price-asc" | "price-desc" | "date-desc" | "date-asc";

function KanbanBoard() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.listings.updateStatus);
  
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Get unique neighborhoods for filter dropdown
  const neighborhoods = useMemo(() => {
    if (!listings) return [];
    const hoods = new Set<string>();
    listings.forEach(l => {
      if (l.neighborhood) hoods.add(l.neighborhood);
    });
    return Array.from(hoods).sort();
  }, [listings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    let filtered = [...listings];
    
    // Apply neighborhood filter
    if (filterNeighborhood) {
      filtered = filtered.filter(l => l.neighborhood === filterNeighborhood);
    }
    
    // Apply max price filter
    if (filterMaxPrice) {
      const maxPrice = parseInt(filterMaxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(l => l.price <= maxPrice);
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "date-asc":
          return a.foundAt - b.foundAt;
        case "date-desc":
        default:
          return b.foundAt - a.foundAt;
      }
    });
    
    return filtered;
  }, [listings, filterNeighborhood, filterMaxPrice, sortBy]);

  // Group listings by status
  const listingsByStatus = useMemo(() => {
    const grouped: Record<string, Listing[]> = {};
    COLUMNS.forEach(col => {
      grouped[col.id] = [];
    });
    
    filteredListings.forEach(listing => {
      // Map old statuses to new ones
      let status = listing.status;
      if (status === "viewed" || status === "saved") {
        status = "interested"; // Map old statuses to interested
      }
      if (grouped[status]) {
        grouped[status].push(listing);
      } else {
        grouped["new"].push(listing); // Default to new for unknown statuses
      }
    });
    
    return grouped;
  }, [filteredListings]);

  const handleStatusChange = async (id: Id<"listings">, newStatus: StatusType) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await updateStatus({ id, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (listings === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Neighborhood:</label>
          <select
            value={filterNeighborhood}
            onChange={(e) => setFilterNeighborhood(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All</option>
            {neighborhoods.map(hood => (
              <option key={hood} value={hood}>{hood}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Max Price:</label>
          <input
            type="number"
            placeholder="e.g. 4000"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 w-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        
        <div className="flex-1"></div>
        
        <div className="text-sm text-gray-500">
          {filteredListings.length} of {listings.length} listings
        </div>
      </div>
      
      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-1">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              listings={listingsByStatus[column.id] || []}
              onStatusChange={handleStatusChange}
              updatingIds={updatingIds}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// View Toggle Component
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("swipe")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "swipe"
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span>👆</span>
        <span className="hidden sm:inline">Swipe</span>
      </button>
      <button
        onClick={() => onChange("kanban")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "kanban"
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span>📋</span>
        <span className="hidden sm:inline">Board</span>
      </button>
    </div>
  );
}

export default function App() {
  // Default to swipe view, persist preference
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("se-view-mode");
    return (saved === "kanban" || saved === "swipe") ? saved : "swipe";
  });

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    localStorage.setItem("se-view-mode", newView);
  };

  // SwipeFeed has its own header, so we render it full-screen
  if (view === "swipe") {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Floating toggle button for swipe view */}
        <div className="fixed top-3 right-3 z-50">
          <ViewToggle view={view} onChange={handleViewChange} />
        </div>
        <SwipeFeed />
      </div>
    );
  }

  // Kanban view with shared header
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🏠 StreetEasy Monitor
              </h1>
            </div>
            <div className="flex items-center">
              <ViewToggle view={view} onChange={handleViewChange} />
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 h-[calc(100vh-56px)]">
        <KanbanBoard />
      </main>
    </div>
  );
}
/* deployed Mon Feb  9 15:48:34 EST 2026 */
