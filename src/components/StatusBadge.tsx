import { motion } from "framer-motion";

type ListingStatus = 
  | "new" 
  | "interested" 
  | "reached_out" 
  | "touring" 
  | "applied" 
  | "rejected";

interface StatusConfig {
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

const STATUS_CONFIG: Record<ListingStatus, StatusConfig> = {
  new: {
    label: "New",
    emoji: "✨",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  interested: {
    label: "Saved",
    emoji: "💜",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  reached_out: {
    label: "Contacted",
    emoji: "📧",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
  touring: {
    label: "Touring",
    emoji: "🏠",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
  },
  applied: {
    label: "Applied",
    emoji: "📝",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  rejected: {
    label: "Passed",
    emoji: "👋",
    bgColor: "bg-gray-100",
    textColor: "text-gray-500",
  },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showEmoji?: boolean;
  animated?: boolean;
}

export function StatusBadge({ 
  status, 
  size = "md", 
  showEmoji = true,
  animated = false 
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ListingStatus] || STATUS_CONFIG.new;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const content = (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {showEmoji && <span>{config.emoji}</span>}
      <span>{config.label}</span>
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

export default StatusBadge;
