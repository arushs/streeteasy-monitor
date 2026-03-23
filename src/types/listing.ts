import type { Id } from "../../convex/_generated/dataModel";

export interface Listing {
  _id: Id<"listings">;
  _creationTime: number;
  streetEasyUrl: string;
  price: number;
  source: "manual" | "email" | "test";
  status: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  neighborhood?: string;
  noFee?: boolean;
  foundAt: number;
  imageUrl?: string;
  images?: string[];
  emailMessageId?: string;
  userId?: string;
  previousPrice?: number;
  lastCheckedAt?: number;
}

export type SwipeDirection = "left" | "right" | "up";

export interface SwipeAction {
  listing: Listing;
  direction: SwipeDirection;
  timestamp: number;
}
