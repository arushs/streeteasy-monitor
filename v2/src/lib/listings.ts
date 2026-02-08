/**
 * Listings Service
 *
 * Handles listing storage with deduplication logic.
 * Links listings to users via their forwarding address.
 */

import prisma from "./db";
import type { ExtractedListing } from "./email/types";
import type { Listing } from "@prisma/client";

export interface SaveListingsResult {
  saved: number;
  duplicates: number;
  errors: string[];
  listings: Listing[];
}

/**
 * Find user by their forwarding address
 */
export async function findUserByForwardingAddress(
  forwardingAddress: string
): Promise<{ id: string; email: string } | null> {
  // Normalize the address - handle +alias format
  const normalizedAddress = forwardingAddress.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: {
      forwardingAddress: normalizedAddress,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return user;
}

/**
 * Save extracted listings for a user with deduplication
 *
 * Deduplication is based on the StreetEasy URL - if a user already has
 * a listing with the same URL, we skip it (don't overwrite).
 *
 * This handles the case where the same listing appears in multiple alerts.
 */
export async function saveListingsForUser(
  userId: string,
  listings: ExtractedListing[],
  sourceEmailId?: string
): Promise<SaveListingsResult> {
  const result: SaveListingsResult = {
    saved: 0,
    duplicates: 0,
    errors: [],
    listings: [],
  };

  if (listings.length === 0) {
    return result;
  }

  // Get existing listing URLs for this user
  const existingUrls = await getExistingListingUrls(
    userId,
    listings.map((l) => l.streetEasyUrl)
  );

  const existingUrlSet = new Set(existingUrls);

  // Filter out duplicates
  const newListings = listings.filter(
    (l) => !existingUrlSet.has(l.streetEasyUrl)
  );
  result.duplicates = listings.length - newListings.length;

  // Save new listings in a transaction
  if (newListings.length > 0) {
    try {
      const savedListings = await prisma.$transaction(
        newListings.map((listing) =>
          prisma.listing.create({
            data: {
              userId,
              streetEasyUrl: listing.streetEasyUrl,
              address: listing.address,
              unit: listing.unit,
              neighborhood: listing.neighborhood,
              price: listing.price,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              noFee: listing.noFee,
              brokerName: listing.brokerName,
              brokerEmail: listing.brokerEmail,
              brokerPhone: listing.brokerPhone,
              imageUrl: listing.imageUrl,
              status: "new",
              sourceEmailId,
              rawData: JSON.parse(JSON.stringify(listing)),
            },
          })
        )
      );

      result.saved = savedListings.length;
      result.listings = savedListings;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Failed to save listings: ${message}`);
    }
  }

  return result;
}

/**
 * Get existing listing URLs for a user
 */
async function getExistingListingUrls(
  userId: string,
  urls: string[]
): Promise<string[]> {
  const existing = await prisma.listing.findMany({
    where: {
      userId,
      streetEasyUrl: { in: urls },
    },
    select: {
      streetEasyUrl: true,
    },
  });

  return existing.map((l) => l.streetEasyUrl);
}

/**
 * Update listing with price change (for future use)
 */
export async function updateListingPrice(
  listingId: string,
  newPrice: number,
  previousPrice: number
): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      price: newPrice,
      rawData: {
        priceHistory: [
          {
            price: previousPrice,
            date: new Date().toISOString(),
          },
        ],
      },
    },
  });
}

/**
 * Mark listing with a new status
 */
export async function updateListingStatus(
  listingId: string,
  status: "new" | "saved" | "contacted" | "skipped"
): Promise<Listing> {
  return prisma.listing.update({
    where: { id: listingId },
    data: {
      status,
      contactedAt: status === "contacted" ? new Date() : undefined,
    },
  });
}

/**
 * Get listings for a user with optional filters
 */
export async function getListingsForUser(
  userId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
    orderBy?: "newest" | "price-asc" | "price-desc";
  }
): Promise<Listing[]> {
  const { status, limit = 50, offset = 0, orderBy = "newest" } = options || {};

  const orderByClause = {
    "newest": { createdAt: "desc" as const },
    "price-asc": { price: "asc" as const },
    "price-desc": { price: "desc" as const },
  }[orderBy];

  return prisma.listing.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    orderBy: orderByClause,
    take: limit,
    skip: offset,
  });
}

/**
 * Get listing counts by status for a user
 */
export async function getListingCounts(
  userId: string
): Promise<Record<string, number>> {
  const counts = await prisma.listing.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const result: Record<string, number> = {
    new: 0,
    saved: 0,
    contacted: 0,
    skipped: 0,
    total: 0,
  };

  for (const count of counts) {
    result[count.status] = count._count.status;
    result.total += count._count.status;
  }

  return result;
}
