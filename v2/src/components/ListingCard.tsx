"use client";

import { useState } from "react";
import { formatDistanceToNow } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
  onContact?: (id: string) => void;
  onSave?: (id: string) => void;
  onHide?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUndo?: (id: string, previousStatus: ListingStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ListingCard({
  listing,
  onContact,
  onSave,
  onHide,
  onArchive,
  showActions = true,
  compact = false,
}: ListingCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (
    action: string,
    handler?: (id: string) => void
  ) => {
    if (!handler) return;
    setIsLoading(action);
    try {
      await handler(listing.id);
    } finally {
      setIsLoading(null);
    }
  };

  const isNew = listing.status === "new";
  const isSaved = listing.status === "saved";
  const isContacted = listing.status === "contacted";
  const isSkipped = listing.status === "skipped";

  const daysOnMarket = Math.floor(
    (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-200 overflow-hidden
        hover:shadow-md transition-all duration-200
        ${isSkipped ? "opacity-60" : ""}
        ${compact ? "p-3" : "p-4 sm:p-5"}
      `}
    >
      <div className="flex gap-4">
        {/* Photo */}
        <div
          className={`
            flex-shrink-0 rounded-xl overflow-hidden bg-gray-100
            ${compact ? "w-20 h-20" : "w-24 h-24 sm:w-32 sm:h-32"}
          `}
        >
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <span className={compact ? "text-2xl" : "text-4xl"}>🏠</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header with badges and price */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {isNew && (
                  <span className="inline-flex items-center bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    🆕 NEW
                  </span>
                )}
                {isSaved && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    💾 Saved
                  </span>
                )}
                {isContacted && (
                  <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    ✅ Contacted
                  </span>
                )}
                {isSkipped && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Hidden
                  </span>
                )}
                {listing.noFee && (
                  <span className="inline-flex items-center bg-green-50 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    ✓ No Fee
                  </span>
                )}
              </div>

              {/* Address */}
              <h3
                className={`font-semibold text-gray-900 truncate ${compact ? "text-sm" : "text-base"}`}
              >
                {listing.address}
                {listing.unit && (
                  <span className="text-gray-500">, {listing.unit}</span>
                )}
              </h3>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <div
                className={`font-bold text-gray-900 ${compact ? "text-lg" : "text-xl"}`}
              >
                ${listing.price.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Details row */}
          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600 ${compact ? "text-xs mt-1" : "text-sm mt-2"}`}
          >
            <span className="inline-flex items-center gap-1">
              <span>🛏</span>
              <span>
                {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
              </span>
            </span>
            {listing.bathrooms && (
              <span className="inline-flex items-center gap-1">
                <span>🚿</span>
                <span>
                  {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
                </span>
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span>{listing.neighborhood}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              {daysOnMarket === 0
                ? "Listed today"
                : daysOnMarket === 1
                  ? "1 day on market"
                  : `${daysOnMarket} days on market`}
            </span>
          </div>

          {/* Time ago / Contacted status */}
          <div className={`text-gray-400 ${compact ? "text-xs mt-1" : "text-xs mt-2"}`}>
            {isContacted && listing.contactedAt ? (
              <span>
                Contacted {formatDistanceToNow(new Date(listing.contactedAt))}
              </span>
            ) : (
              <span>Found {formatDistanceToNow(new Date(listing.createdAt))}</span>
            )}
            {listing.brokerName && (
              <span> • Listed by {listing.brokerName}</span>
            )}
          </div>

          {/* Action buttons */}
          {showActions && !isContacted && !isSkipped && (
            <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-2" : "mt-3"}`}>
              <button
                onClick={() => handleAction("contact", onContact)}
                disabled={isLoading === "contact"}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                {isLoading === "contact" ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span>📧</span>
                    <span>Contact</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleAction("save", onSave)}
                disabled={isLoading === "save" || isSaved}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${
                    isSaved
                      ? "bg-blue-100 text-blue-700 cursor-default"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }
                `}
              >
                {isLoading === "save" ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span>💾</span>
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleAction("hide", onHide)}
                disabled={isLoading === "hide"}
                className="inline-flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Hide this listing"
              >
                {isLoading === "hide" ? <LoadingSpinner /> : <span>👁️‍🗨️</span>}
              </button>

              <button
                onClick={() => handleAction("archive", onArchive)}
                disabled={isLoading === "archive"}
                className="inline-flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Not interested"
              >
                {isLoading === "archive" ? <LoadingSpinner /> : <span>✕</span>}
              </button>
            </div>
          )}

          {/* Contacted status action */}
          {showActions && isContacted && (
            <div className={`${compact ? "mt-2" : "mt-3"}`}>
              <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                <span className="animate-pulse">⏳</span>
                Awaiting response...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* StreetEasy link */}
      {listing.streetEasyUrl && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a
            href={listing.streetEasyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View on StreetEasy
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
