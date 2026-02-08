import { motion } from "framer-motion";
import type { Listing } from "../types/listing";
import { StatusBadge } from "./StatusBadge";

interface ListingCardProps {
  listing: Listing;
  onAction?: (action: "contact" | "save" | "skip" | "view") => void;
  variant?: "compact" | "full";
}

function cleanAddress(address?: string): string {
  if (!address) return "Address unavailable";
  return address
    .replace(/^\d+\s+homes?\s+(new to market|with changes)\s+/i, "")
    .replace(/^(Rental Unit|Condo|Co-op|Townhouse)\s+in\s+[\w\s]+\s+/i, "")
    .trim() || "Address unavailable";
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ListingCard({ listing, onAction, variant = "full" }: ListingCardProps) {
  const gradientColors: Record<string, string> = {
    "East Village": "from-orange-400 to-rose-500",
    "West Village": "from-emerald-400 to-teal-500",
    "Chelsea": "from-purple-400 to-pink-500",
    "Williamsburg": "from-blue-400 to-indigo-500",
    "Brooklyn Heights": "from-cyan-400 to-blue-500",
    "SoHo": "from-amber-400 to-orange-500",
    "default": "from-slate-400 to-slate-600",
  };
  
  const gradient = gradientColors[listing.neighborhood || ""] || gradientColors.default;

  if (variant === "compact") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Mini Image */}
        <div className={`h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-2xl opacity-50">🏠</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">${listing.price.toLocaleString()}</span>
            <StatusBadge status={listing.status} size="sm" />
            {listing.noFee && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                No Fee
              </span>
            )}
          </div>
          <p className="truncate text-sm text-gray-600">{cleanAddress(listing.address)}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span>{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}</span>
            {listing.neighborhood && (
              <>
                <span>•</span>
                <span>{listing.neighborhood}</span>
              </>
            )}
            <span>•</span>
            <span>{timeAgo(listing.foundAt)}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onAction?.("view")}
            className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
            title="View on StreetEasy"
          >
            ↗️
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        {listing.imageUrl ? (
          <img 
            src={listing.imageUrl} 
            alt={cleanAddress(listing.address)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl opacity-50">🏠</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusBadge status={listing.status} animated />
        </div>
        
        <div className="absolute right-3 top-3 flex gap-2">
          {listing.noFee && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
              No Fee
            </span>
          )}
        </div>
        
        {/* Time */}
        <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {timeAgo(listing.foundAt)}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            ${listing.price.toLocaleString()}
          </span>
          <span className="text-gray-400">/mo</span>
        </div>
        
        <h3 className="mb-2 font-semibold text-gray-800 leading-tight">
          {cleanAddress(listing.address)}
        </h3>
        
        <div className="mb-4 flex flex-wrap gap-1.5">
          {listing.bedrooms !== undefined && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {listing.bathrooms} BA
            </span>
          )}
          {listing.neighborhood && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              📍 {listing.neighborhood}
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {listing.status === "new" && (
            <>
              <button
                onClick={() => onAction?.("skip")}
                className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => onAction?.("save")}
                className="flex-1 rounded-lg bg-blue-100 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => onAction?.("contact")}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Contact
              </button>
            </>
          )}
          {listing.status !== "new" && (
            <a
              href={listing.streetEasyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-indigo-50 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              View on StreetEasy →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ListingCard;
