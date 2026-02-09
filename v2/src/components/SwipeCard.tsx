"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Listing } from "@/types/listing";

type ExitDirection = "left" | "right" | "up" | null;

interface SwipeCardProps {
  listing: Listing;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  isTop?: boolean;
  zIndex?: number;
  exitDirection?: ExitDirection;
}

// Neighborhood color gradients for placeholder images
const neighborhoodGradients: Record<string, string> = {
  "East Village": "from-orange-400 via-pink-500 to-purple-600",
  "West Village": "from-emerald-400 via-teal-500 to-cyan-600",
  "Chelsea": "from-blue-400 via-indigo-500 to-purple-600",
  "Williamsburg": "from-yellow-400 via-orange-500 to-red-500",
  "NoLita": "from-rose-400 via-pink-500 to-fuchsia-600",
  "Lower East Side": "from-amber-400 via-orange-500 to-red-600",
  "FiDi": "from-slate-400 via-gray-500 to-zinc-600",
  "NoHo": "from-violet-400 via-purple-500 to-indigo-600",
  "SoHo": "from-pink-400 via-rose-500 to-red-600",
  "default": "from-indigo-400 via-purple-500 to-pink-600",
};

// Exit animation variants with spring physics
const exitVariants = {
  left: { 
    x: -500, 
    rotate: -20, 
    opacity: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 25 }
  },
  right: { 
    x: 500, 
    rotate: 20, 
    opacity: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 25 }
  },
  up: { 
    y: -500, 
    opacity: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 25 }
  },
};

export function SwipeCard({
  listing,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  isTop = false,
  zIndex = 0,
  exitDirection,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotation based on horizontal drag
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);

  // Overlay opacity based on drag
  const skipOpacity = useTransform(x, [-150, 0], [1, 0]);
  const saveOpacity = useTransform(x, [0, 150], [0, 1]);
  const contactOpacity = useTransform(y, [-150, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    // Swipe up (contact)
    if (info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold) {
      onSwipeUp();
      return;
    }
    // Swipe left (skip)
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      onSwipeLeft();
      return;
    }
    // Swipe right (save)
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onSwipeRight();
      return;
    }
  };

  const gradient = neighborhoodGradients[listing.neighborhood] || neighborhoodGradients.default;

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{ x, y, rotate, zIndex }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={exitDirection ? exitVariants[exitDirection] : { opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.8 }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
      >
        {/* Image (full bleed) */}
        <div className="absolute inset-0">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.address}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-[120px] opacity-30">🏠</span>
            </div>
          )}
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Time badge - glassmorphic */}
          <div className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white shadow-lg backdrop-blur-md border border-white/30">
            {getTimeAgo(listing.createdAt)}
          </div>

          {/* No Fee badge - glassmorphic */}
          {listing.noFee && (
            <div className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white shadow-lg backdrop-blur-md border border-white/30">
              ✓ No Fee
            </div>
          )}
        </div>

        {/* SKIP overlay (swipe left) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-red-500/60"
          style={{ opacity: skipOpacity }}
          initial={{ opacity: 0 }}
        >
          <div className="rounded-lg border-4 border-white px-6 py-2 -rotate-12">
            <span className="text-4xl font-black text-white tracking-wider">SKIP</span>
          </div>
        </motion.div>

        {/* SAVE overlay (swipe right) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-emerald-500/60"
          style={{ opacity: saveOpacity }}
          initial={{ opacity: 0 }}
        >
          <div className="rounded-lg border-4 border-white px-6 py-2 rotate-12">
            <span className="text-4xl font-black text-white tracking-wider">SAVE</span>
          </div>
        </motion.div>

        {/* CONTACT overlay (swipe up) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-blue-500/60"
          style={{ opacity: contactOpacity }}
          initial={{ opacity: 0 }}
        >
          <div className="rounded-lg border-4 border-white px-6 py-2">
            <span className="text-4xl font-black text-white tracking-wider">CONTACT</span>
          </div>
        </motion.div>

        {/* Bottom info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          {/* Price */}
          <div
            className="text-4xl font-bold mb-2"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            ${listing.price.toLocaleString()}/mo
          </div>

          {/* Address */}
          <div
            className="text-xl font-semibold mb-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            {listing.address}
            {listing.unit && <span className="text-white/80">, {listing.unit}</span>}
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 text-base text-white/90">
            <span>
              {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
            </span>
            {listing.bathrooms && (
              <>
                <span className="text-white/50">•</span>
                <span>{listing.bathrooms} BA</span>
              </>
            )}
            <span className="text-white/50">•</span>
            <span>{listing.neighborhood}</span>
          </div>

          {/* Swipe hints */}
          <div className="flex items-center justify-center gap-8 mt-6 text-sm text-white/60">
            <span>← Skip</span>
            <span>↑ Contact</span>
            <span>Save →</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
