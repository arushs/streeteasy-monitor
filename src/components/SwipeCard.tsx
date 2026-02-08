import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import type { Listing, SwipeDirection } from "../types/listing";
import { swipeHaptic } from "../utils/haptics";

interface SwipeCardProps {
  listing: Listing;
  onSwipe: (direction: SwipeDirection) => void;
  onViewDetails?: () => void;
  isTop?: boolean;
  stackIndex?: number;
}

// Threshold for triggering a swipe action
const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

// Clean address for display
function cleanAddress(address?: string): string {
  if (!address) return "Address unavailable";
  return address
    .replace(/^\d+\s+homes?\s+(new to market|with changes)\s+/i, "")
    .replace(/^(Rental Unit|Condo|Co-op|Townhouse)\s+in\s+[\w\s]+\s+/i, "")
    .trim() || "Address unavailable";
}

// Format time ago
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

export function SwipeCard({ 
  listing, 
  onSwipe, 
  onViewDetails,
  isTop = false,
  stackIndex = 0 
}: SwipeCardProps) {
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Rotation based on x position (cards tilt as you drag)
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  
  // Opacity for overlay indicators
  const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const contactOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const saveOpacity = useTransform(y, [0, -50, -100], [0, 0.5, 1]);
  
  // Scale for background cards
  const scale = isTop ? 1 : 0.95 - stackIndex * 0.03;
  const yOffset = isTop ? 0 : stackIndex * 8;
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Check for swipe up first (priority gesture)
    if (offset.y < -SWIPE_UP_THRESHOLD || (velocity.y < -500 && offset.y < -30)) {
      setExitDirection("up");
      swipeHaptic("up");
      onSwipe("up");
      return;
    }
    
    // Check for horizontal swipe
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      setExitDirection("left");
      swipeHaptic("left");
      onSwipe("left");
      return;
    }
    
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      setExitDirection("right");
      swipeHaptic("right");
      onSwipe("right");
      return;
    }
    
    // Snap back if not past threshold
    x.set(0);
    y.set(0);
  };
  
  // Exit animation variants
  const exitVariants = {
    left: { x: -400, opacity: 0, transition: { duration: 0.3 } },
    right: { x: 400, opacity: 0, transition: { duration: 0.3 } },
    up: { y: -400, opacity: 0, transition: { duration: 0.3 } },
  };

  // Placeholder image gradient based on neighborhood
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

  return (
    <motion.div
      className="absolute w-full touch-none"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : yOffset,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? exitVariants[exitDirection] : undefined}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      whileInView={{ opacity: 1, scale: isTop ? 1 : scale, y: isTop ? 0 : yOffset }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* Image / Placeholder */}
        <div className={`relative h-64 bg-gradient-to-br ${gradient}`}>
          {listing.imageUrl ? (
            <img 
              src={listing.imageUrl} 
              alt={cleanAddress(listing.address)}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl opacity-50">🏠</span>
            </div>
          )}
          
          {/* Swipe Indicators (overlays) */}
          {isTop && (
            <>
              {/* Skip (left) */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-red-500/80"
                style={{ opacity: skipOpacity }}
              >
                <div className="rounded-xl border-4 border-white px-6 py-3">
                  <span className="text-3xl font-bold text-white">SKIP</span>
                </div>
              </motion.div>
              
              {/* Contact (right) */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-emerald-500/80"
                style={{ opacity: contactOpacity }}
              >
                <div className="rounded-xl border-4 border-white px-6 py-3">
                  <span className="text-3xl font-bold text-white">CONTACT</span>
                </div>
              </motion.div>
              
              {/* Save (up) */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-blue-500/80"
                style={{ opacity: saveOpacity }}
              >
                <div className="rounded-xl border-4 border-white px-6 py-3">
                  <span className="text-3xl font-bold text-white">SAVE</span>
                </div>
              </motion.div>
            </>
          )}
          
          {/* No Fee Badge */}
          {listing.noFee && (
            <div className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
              No Fee
            </div>
          )}
          
          {/* Time Badge */}
          <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {timeAgo(listing.foundAt)}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Price */}
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </span>
            <span className="text-gray-400">/mo</span>
          </div>
          
          {/* Address */}
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            {cleanAddress(listing.address)}
          </h2>
          
          {/* Details Row */}
          <div className="mb-4 flex flex-wrap gap-2">
            {listing.bedrooms !== undefined && (
              <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
              </span>
            )}
            {listing.bathrooms !== undefined && (
              <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                {listing.bathrooms} BA
              </span>
            )}
            {listing.sqft && (
              <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                {listing.sqft.toLocaleString()} sqft
              </span>
            )}
          </div>
          
          {/* Neighborhood */}
          {listing.neighborhood && (
            <div className="flex items-center gap-1 text-gray-500">
              <span>📍</span>
              <span className="font-medium">{listing.neighborhood}</span>
            </div>
          )}
          
          {/* View Details Button */}
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="mt-4 w-full rounded-xl bg-gray-100 py-3 text-center font-semibold text-indigo-600 transition-colors hover:bg-gray-200"
            >
              View Details →
            </button>
          )}
        </div>
        
        {/* Swipe Hints (bottom) */}
        <div className="flex justify-center gap-8 border-t border-gray-100 py-4 text-sm text-gray-400">
          <span>← Skip</span>
          <span>↑ Save</span>
          <span>Contact →</span>
        </div>
      </div>
    </motion.div>
  );
}

export default SwipeCard;
