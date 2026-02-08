// Listing types for StreetEasy Monitor V2

export type ListingStatus = "new" | "saved" | "contacted" | "skipped" | "archived";

export interface Listing {
  id: string;
  address: string;
  unit?: string | null;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms?: number | null;
  noFee: boolean;
  brokerName?: string | null;
  brokerEmail?: string | null;
  brokerPhone?: string | null;
  imageUrl?: string | null;
  streetEasyUrl?: string | null;
  status: ListingStatus;
  createdAt: Date;
  contactedAt?: Date | null;
}

export interface ListingFilters {
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number | null; // null = any
  noFeeOnly?: boolean;
  status?: ListingStatus[];
}

export interface ContactQueueItem {
  id: string;
  listing: Listing;
  templateId?: string;
  message: string;
  subject: string;
  overBudget?: boolean;
  reason?: string;
}

export interface ContactStats {
  sentToday: number;
  dailyLimit: number;
}
