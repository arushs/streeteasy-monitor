import { Id } from "../../convex/_generated/dataModel";

export interface Listing {
  _id: Id<"listings">;
  streetEasyUrl: string;
  price: number;
  status: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  neighborhood?: string;
  noFee?: boolean;
  foundAt: number;
  imageUrl?: string;
}

export type SwipeDirection = "left" | "right" | "up";

export interface SwipeAction {
  listing: Listing;
  direction: SwipeDirection;
  timestamp: number;
}
