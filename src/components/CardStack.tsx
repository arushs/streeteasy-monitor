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

  // Empty state - full screen
  if (visibleCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8" style={{ height: "calc(90vh - 80px)" }}>
        <div className="mb-6 text-8xl">🎉</div>
        <h3 className="mb-3 text-2xl font-bold text-white">All caught up!</h3>
        <p className="mb-8 text-center text-lg text-gray-400">
          You've reviewed all the listings.
          <br />Check back later for more!
        </p>
        {canUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-3 rounded-2xl bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
          >
            <span className="text-xl">↩️</span>
            Undo last swipe
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
      {/* Progress indicator - minimal, top */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-gray-600">
          {remainingCount} left
        </span>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${((currentIndex) / listings.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-400">
            {currentIndex + 1}/{listings.length}
          </span>
        </div>
      </div>

      {/* Card Stack - Full viewport */}
      <div className="relative flex-1 px-3">
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

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pb-6 pt-8">
        <div className="flex justify-center gap-5">
          <button
            onClick={() => handleSwipe("left")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-lg ring-1 ring-gray-100 transition-all hover:scale-110 hover:bg-red-50 hover:ring-red-200 active:scale-95"
            title="Skip"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe("up")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl text-white shadow-xl transition-all hover:scale-110 hover:shadow-blue-300/50 active:scale-95"
            title="Contact"
          >
            📧
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-lg ring-1 ring-gray-100 transition-all hover:scale-110 hover:bg-emerald-50 hover:ring-emerald-200 active:scale-95"
            title="Save"
          >
            💚
          </button>
        </div>
        
        {/* Undo Button */}
        <AnimatePresence>
          {canUndo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 flex justify-center"
            >
              <button
                onClick={handleUndo}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200 active:scale-95"
              >
                <span>↩️</span>
                Undo{" "}
                {lastAction?.direction === "left"
                  ? "(skipped)"
                  : lastAction?.direction === "right"
                  ? "(liked)"
                  : "(contacted)"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CardStack;
