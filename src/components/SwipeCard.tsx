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
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  
  // Opacity for overlay indicators
  const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const saveOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const contactOpacity = useTransform(y, [0, -50, -100], [0, 0.5, 1]);
  
  // Scale for background cards
  const scale = isTop ? 1 : 0.95 - stackIndex * 0.02;
  const yOffset = isTop ? 0 : stackIndex * 12;
  
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
  
  // Exit animation variants with spring physics
  const exitVariants = {
    left: { x: -500, rotate: -20, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    right: { x: 500, rotate: 20, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    up: { y: -500, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  // Placeholder image gradient based on neighborhood
  const gradientColors: Record<string, string> = {
    "East Village": "from-orange-500 via-rose-500 to-pink-600",
    "West Village": "from-emerald-500 via-teal-500 to-cyan-600",
    "Chelsea": "from-purple-500 via-pink-500 to-rose-600",
    "Williamsburg": "from-blue-500 via-indigo-500 to-purple-600",
    "Brooklyn Heights": "from-cyan-500 via-blue-500 to-indigo-600",
    "SoHo": "from-amber-500 via-orange-500 to-red-600",
    "Lower East Side": "from-rose-500 via-pink-500 to-purple-600",
    "Tribeca": "from-slate-500 via-gray-500 to-zinc-600",
    "Upper West Side": "from-green-500 via-emerald-500 to-teal-600",
    "Upper East Side": "from-blue-500 via-sky-500 to-cyan-600",
    "default": "from-slate-600 via-gray-600 to-zinc-700",
  };
  
  const gradient = gradientColors[listing.neighborhood || ""] || gradientColors.default;

  return (
    <motion.div
      className="absolute inset-x-0 top-0 touch-none"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : yOffset,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? exitVariants[exitDirection] : undefined}
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      whileInView={{ opacity: 1, scale: isTop ? 1 : scale, y: isTop ? 0 : yOffset }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Full-screen card container */}
      <div 
        className="relative overflow-hidden rounded-3xl bg-black"
        style={{ height: "calc(90vh - 80px)" }} // Full viewport minus header/footer space
      >
        {/* Image / Placeholder - Takes 100% of card */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
          {listing.imageUrl ? (
            <img 
              src={listing.imageUrl} 
              alt={cleanAddress(listing.address)}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-8xl opacity-30">🏠</span>
            </div>
          )}
        </div>
        
        {/* Dark gradient overlay for text readability - bottom portion */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Swipe Indicators (overlays) */}
        {isTop && (
          <>
            {/* Skip (left) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-red-500/70"
              style={{ opacity: skipOpacity }}
            >
              <div className="rounded-2xl border-[6px] border-white px-8 py-4 -rotate-12">
                <span className="text-5xl font-black text-white tracking-wider">NOPE</span>
              </div>
            </motion.div>
            
            {/* Save (right) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/70"
              style={{ opacity: saveOpacity }}
            >
              <div className="rounded-2xl border-[6px] border-white px-8 py-4 rotate-12">
                <span className="text-5xl font-black text-white tracking-wider">LIKE</span>
              </div>
            </motion.div>
            
            {/* Contact (up) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-blue-500/70"
              style={{ opacity: contactOpacity }}
            >
              <div className="rounded-2xl border-[6px] border-white px-8 py-4">
                <span className="text-5xl font-black text-white tracking-wider">CONTACT</span>
              </div>
            </motion.div>
          </>
        )}
        
        {/* Top Badges */}
        <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-5">
          {/* Time Badge */}
          <div className="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            {timeAgo(listing.foundAt)}
          </div>
          
          {/* No Fee Badge */}
          {listing.noFee && (
            <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              NO FEE 🎉
            </div>
          )}
        </div>
        
        {/* Bottom Content - Overlaid on image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Price - Large and prominent */}
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white drop-shadow-lg">
              ${listing.price.toLocaleString()}
            </span>
            <span className="text-xl text-white/70">/mo</span>
          </div>
          
          {/* Address */}
          <h2 className="mb-3 text-xl font-semibold text-white drop-shadow-md">
            {cleanAddress(listing.address)}
          </h2>
          
          {/* Details Row - Pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {listing.bedrooms !== undefined && (
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
              </span>
            )}
            {listing.bathrooms !== undefined && (
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {listing.bathrooms} BA
              </span>
            )}
            {listing.sqft && (
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {listing.sqft.toLocaleString()} sqft
              </span>
            )}
            {listing.neighborhood && (
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                📍 {listing.neighborhood}
              </span>
            )}
          </div>
          
          {/* View Details Button */}
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="w-full rounded-2xl bg-white/20 py-3.5 text-center font-semibold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-[0.98]"
            >
              View on StreetEasy →
            </button>
          )}
        </div>
        
        {/* Swipe Hints - subtle at bottom */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-8 text-xs font-medium text-white/40">
          <span>← NOPE</span>
          <span>↑ CONTACT</span>
          <span>LIKE →</span>
        </div>
      </div>
    </motion.div>
  );
}

export default SwipeCard;
