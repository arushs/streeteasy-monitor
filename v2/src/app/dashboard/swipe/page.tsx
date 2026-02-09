"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "@/components/SwipeCard";
import type { Listing } from "@/types/listing";

// Mock listings with real-ish images
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
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
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
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
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
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: "new",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
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
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
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
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "new",
    imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
  },
];

type SwipeAction = "skip" | "save" | "contact";
type ExitDirection = "left" | "right" | "up" | null;

interface HistoryEntry {
  listing: Listing;
  action: SwipeAction;
}

export default function SwipePage() {
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null);

  const currentListing = listings[0];

  const handleSwipe = useCallback((action: SwipeAction) => {
    if (!currentListing) return;

    // Set exit direction for animation
    const direction: ExitDirection = action === "skip" ? "left" : action === "save" ? "right" : "up";
    setExitDirection(direction);

    // Add to history for undo
    setHistory((prev) => [...prev, { listing: currentListing, action }]);

    // Remove from deck after a short delay for exit animation
    setTimeout(() => {
      setListings((prev) => prev.slice(1));
      setExitDirection(null);
    }, 50);

    // In real app: call API to update listing status
    console.log(`${action.toUpperCase()}: ${currentListing.address}`);
  }, [currentListing]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastEntry = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setListings((prev) => [lastEntry.listing, ...prev]);
  }, [history]);

  const handleSwipeLeft = useCallback(() => handleSwipe("skip"), [handleSwipe]);
  const handleSwipeRight = useCallback(() => handleSwipe("save"), [handleSwipe]);
  const handleSwipeUp = useCallback(() => handleSwipe("contact"), [handleSwipe]);

  // No more listings
  if (listings.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all caught up!</h2>
          <p className="text-gray-600 mb-6">No more listings to review right now.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {history.length > 0 && (
              <button
                onClick={() => {
                  setListings(history.map((h) => h.listing).reverse());
                  setHistory([]);
                }}
                className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Review Again
              </button>
            )}
            <a
              href="/dashboard/saved"
              className="px-6 py-3 bg-indigo-600 rounded-xl font-medium text-white hover:bg-indigo-700 transition-colors text-center"
            >
              View Saved →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-gray-100 overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Minimal top bar - only shows when filters open */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip label="East Village" active />
              <FilterChip label="Chelsea" />
              <FilterChip label="Williamsburg" />
              <FilterChip label="No Fee Only" active />
              <FilterChip label="Under $3k" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card stack area */}
      <div className="absolute inset-4 bottom-32">
        <AnimatePresence mode="popLayout">
          {listings.slice(0, 3).map((listing, index) => (
            <SwipeCard
              key={listing.id}
              listing={listing}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
              isTop={index === 0}
              zIndex={listings.length - index}
              exitDirection={index === 0 ? exitDirection : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom action buttons - Tinder style */}
      <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-6 px-4">
        {/* Undo button */}
        <motion.button
          onClick={handleUndo}
          disabled={history.length === 0}
          whileTap={{ scale: 0.9 }}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-lg
            transition-all duration-200
            ${history.length > 0
              ? "bg-white text-amber-500 hover:shadow-xl"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </motion.button>

        {/* Skip (X) button - red */}
        <motion.button
          onClick={handleSwipeLeft}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg text-red-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Contact (envelope) button - blue */}
        <motion.button
          onClick={handleSwipeUp}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg text-blue-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.button>

        {/* Save (heart) button - green */}
        <motion.button
          onClick={handleSwipeRight}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg text-emerald-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.button>

        {/* Filter button */}
        <motion.button
          onClick={() => setShowFilters(true)}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg text-gray-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </motion.button>
      </div>

      {/* Counter badge */}
      <div className="absolute top-4 right-4 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white">
        {listings.length} left
      </div>

      {/* Back to dashboard link */}
      <a
        href="/dashboard"
        className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white hover:bg-black/60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </a>
    </div>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
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
