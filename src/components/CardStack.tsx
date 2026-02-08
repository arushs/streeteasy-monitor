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

  // Empty state
  if (visibleCards.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-3xl bg-gray-50 p-8">
        <div className="mb-4 text-6xl">🎉</div>
        <h3 className="mb-2 text-xl font-bold text-gray-800">All caught up!</h3>
        <p className="mb-6 text-center text-gray-500">
          You've reviewed all the listings. Check back later for more!
        </p>
        {canUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 rounded-xl bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
          >
            <span>↩️</span>
            Undo last swipe
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-sm font-medium text-gray-500">
          {remainingCount} listing{remainingCount !== 1 ? "s" : ""} left
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${((currentIndex) / listings.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {currentIndex}/{listings.length}
          </span>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[520px] w-full">
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

      {/* Action Buttons (for accessibility / button users) */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => handleSwipe("left")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl transition-all hover:scale-110 hover:bg-red-200 active:scale-95"
          title="Skip"
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe("up")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl transition-all hover:scale-110 hover:bg-blue-200 active:scale-95"
          title="Save"
        >
          ⭐
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl transition-all hover:scale-110 hover:bg-emerald-200 active:scale-95"
          title="Contact"
        >
          💬
        </button>
      </div>

      {/* Undo Button */}
      <AnimatePresence>
        {canUndo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 flex justify-center"
          >
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200"
            >
              <span>↩️</span>
              Undo{" "}
              {lastAction?.direction === "left"
                ? "(skipped)"
                : lastAction?.direction === "right"
                ? "(contact)"
                : "(saved)"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CardStack;
