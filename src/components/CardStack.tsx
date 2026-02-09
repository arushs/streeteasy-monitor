import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { useSwipeHistory } from "../hooks/useSwipeHistory";
import type { Listing, SwipeDirection } from "../types/listing";

interface CardStackProps {
  listings: Listing[];
  onSwipe: (listing: Listing, direction: SwipeDirection) => void;
  onViewDetails?: (listing: Listing) => void;
}

// How many cards to show in the stack (for peek effect)
const VISIBLE_CARDS = 3;

export function CardStack({ listings, onSwipe, onViewDetails }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToHistory, undo, canUndo, lastAction } = useSwipeHistory();

  // Get visible cards for the stack
  const visibleCards = useMemo(() => {
    return listings.slice(currentIndex, currentIndex + VISIBLE_CARDS);
  }, [listings, currentIndex]);

  const currentListing = visibleCards[0];
  const remainingCount = listings.length - currentIndex;

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentListing) return;

      // Add to history for undo
      addToHistory(currentListing, direction);

      // Notify parent
      onSwipe(currentListing, direction);

      // Move to next card
      setCurrentIndex((prev) => prev + 1);
    },
    [currentListing, addToHistory, onSwipe]
  );

  const handleUndo = useCallback(() => {
    const undoneAction = undo();
    if (undoneAction) {
      // Move back one card
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [undo]);

  // Empty state - full screen Tinder style
  if (visibleCards.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-50 p-6"
        style={{ height: "calc(100vh - 60px)" }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-600 mb-6">No more listings to review right now.</p>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span>↩️</span>
              Undo last swipe
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-gray-100 overflow-hidden swipe-container"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", top: "60px" }}
    >
      {/* Counter badge - top right */}
      <div className="absolute top-4 right-4 z-50 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white">
        {remainingCount} left
      </div>

      {/* Card stack area */}
      <div className="absolute inset-4 bottom-32">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((listing, index) => (
            <SwipeCard
              key={listing._id}
              listing={listing}
              onSwipe={handleSwipe}
              onViewDetails={onViewDetails ? () => onViewDetails(listing) : undefined}
              isTop={index === 0}
              stackIndex={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom action buttons - Tinder style circular buttons */}
      <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-6 px-4">
        {/* Undo button - small */}
        <motion.button
          onClick={handleUndo}
          disabled={!canUndo}
          whileTap={{ scale: 0.9 }}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-lg
            transition-all duration-200
            ${canUndo
              ? "bg-white text-amber-500 hover:shadow-xl"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </motion.button>

        {/* Skip (X) button - red, large */}
        <motion.button
          onClick={() => handleSwipe("left")}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg text-red-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Contact (envelope) button - blue, medium */}
        <motion.button
          onClick={() => handleSwipe("up")}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg text-blue-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.button>

        {/* Save (heart) button - green, large */}
        <motion.button
          onClick={() => handleSwipe("right")}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg text-emerald-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.button>

        {/* Info button - small, for help */}
        <motion.button
          onClick={() => {
            if (currentListing && onViewDetails) {
              onViewDetails(currentListing);
            }
          }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg text-gray-500 hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>
      </div>

      {/* Undo toast notification */}
      <AnimatePresence>
        {canUndo && lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
            >
              <span>↩️</span>
              Undo{" "}
              {lastAction.direction === "left"
                ? "nope"
                : lastAction.direction === "right"
                ? "like"
                : "contact"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CardStack;
