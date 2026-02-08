/**
 * StreetEasy Alert Email Parser
 *
 * Parses forwarded StreetEasy alert emails to extract listing information.
 * Handles variations in email format and extracts key listing data.
 */

import type {
  InboundEmailPayload,
  NormalizedEmail,
  ExtractedListing,
  ParseResult,
} from "./types";

/**
 * Normalize email payload from different providers (Mailgun, SendGrid, Postmark)
 */
export function normalizeEmailPayload(
  payload: InboundEmailPayload
): NormalizedEmail {
  // Determine recipient (forwarding address)
  const recipient =
    payload.recipient ||
    payload.to ||
    payload.To ||
    "";

  // Determine sender
  const sender =
    payload.sender ||
    payload.from ||
    payload.From ||
    "";

  // Determine subject
  const subject = payload.subject || payload.Subject || "";

  // Determine HTML body
  const htmlBody =
    payload["body-html"] ||
    payload["stripped-html"] ||
    payload.html ||
    payload.HtmlBody ||
    null;

  // Determine text body
  const textBody =
    payload["body-plain"] ||
    payload["stripped-text"] ||
    payload.text ||
    payload.TextBody ||
    null;

  // Parse headers
  let rawHeaders: Record<string, string> | null = null;
  if (payload["message-headers"]) {
    try {
      const headersArray = JSON.parse(payload["message-headers"]);
      rawHeaders = Object.fromEntries(
        headersArray.map((h: [string, string]) => [h[0], h[1]])
      );
    } catch {
      // Ignore parse errors
    }
  } else if (payload.headers) {
    try {
      rawHeaders = JSON.parse(payload.headers);
    } catch {
      // Ignore parse errors
    }
  }

  return {
    recipient: normalizeRecipient(recipient),
    sender,
    subject,
    htmlBody,
    textBody,
    rawHeaders,
  };
}

/**
 * Normalize recipient address - extract just the email, handle +alias format
 */
function normalizeRecipient(recipient: string): string {
  // Handle format like "Name <email@domain.com>" or just "email@domain.com"
  const emailMatch = recipient.match(/<([^>]+)>/) || recipient.match(/([^\s<>]+@[^\s<>]+)/);
  return emailMatch ? emailMatch[1].toLowerCase().trim() : recipient.toLowerCase().trim();
}

/**
 * Parse StreetEasy HTML email to extract listings
 */
export function parseStreetEasyEmail(email: NormalizedEmail): ParseResult {
  const errors: string[] = [];
  const listings: ExtractedListing[] = [];

  // Prefer HTML body for parsing
  const content = email.htmlBody || email.textBody;

  if (!content) {
    return { success: false, listings: [], errors: ["No email body content"] };
  }

  // Detect if this is actually a StreetEasy email
  if (
    !isStreetEasyEmail(email.sender, email.subject, content)
  ) {
    return {
      success: false,
      listings: [],
      errors: ["Email does not appear to be from StreetEasy"],
    };
  }

  // Extract listings from HTML
  if (email.htmlBody) {
    const htmlListings = extractListingsFromHtml(email.htmlBody);
    listings.push(...htmlListings);
  } else if (email.textBody) {
    // Fallback to text parsing
    const textListings = extractListingsFromText(email.textBody);
    listings.push(...textListings);
  }

  if (listings.length === 0) {
    errors.push("No listings found in email");
  }

  return {
    success: listings.length > 0,
    listings,
    errors,
  };
}

/**
 * Check if email is from StreetEasy
 */
function isStreetEasyEmail(
  sender: string,
  subject: string,
  content: string
): boolean {
  const senderCheck = sender.toLowerCase().includes("streeteasy");
  const subjectCheck =
    subject.toLowerCase().includes("new listing") ||
    subject.toLowerCase().includes("price drop") ||
    subject.toLowerCase().includes("new rental") ||
    subject.toLowerCase().includes("rental alert") ||
    subject.toLowerCase().includes("streeteasy");
  const contentCheck =
    content.toLowerCase().includes("streeteasy.com") ||
    content.toLowerCase().includes("streeteasy");

  return senderCheck || subjectCheck || contentCheck;
}

/**
 * Extract listings from HTML email body
 */
function extractListingsFromHtml(html: string): ExtractedListing[] {
  const listings: ExtractedListing[] = [];

  // Find all StreetEasy listing URLs
  const urlPattern = /https?:\/\/(?:www\.)?streeteasy\.com\/(?:building\/[^\/]+\/)?(?:rental\/\d+|sale\/\d+)/gi;
  const matches = html.match(urlPattern) || [];
  const uniqueUrls = Array.from(new Set(matches));

  for (const url of uniqueUrls) {
    const listing = extractListingFromContext(html, url);
    if (listing) {
      listings.push(listing);
    }
  }

  return listings;
}

/**
 * Extract a single listing using the URL and surrounding HTML context
 */
function extractListingFromContext(
  html: string,
  url: string
): ExtractedListing | null {
  // Find the section of HTML around this URL
  const urlIndex = html.indexOf(url);
  if (urlIndex === -1) return null;

  // Get context: 3000 chars before and after the URL
  const start = Math.max(0, urlIndex - 3000);
  const end = Math.min(html.length, urlIndex + 3000);
  const context = html.substring(start, end);

  // Extract data from context
  const address = extractAddress(context);
  const price = extractPrice(context);
  const bedrooms = extractBedrooms(context);
  const bathrooms = extractBathrooms(context);
  const neighborhood = extractNeighborhood(context);
  const noFee = extractNoFee(context);
  const imageUrl = extractImageUrl(context);
  const unit = extractUnit(context);

  // Must have at minimum: URL, address, price
  if (!address || price === null) {
    return null;
  }

  return {
    streetEasyUrl: url,
    address,
    unit,
    neighborhood: neighborhood || "Unknown",
    price,
    bedrooms: bedrooms ?? 0,
    bathrooms,
    noFee,
    brokerName: null,
    brokerEmail: null,
    brokerPhone: null,
    imageUrl,
  };
}

/**
 * Extract address from HTML context
 */
function extractAddress(context: string): string | null {
  // Common address patterns in StreetEasy emails
  const patterns = [
    // "123 East 4th Street" style
    /(\d{1,5}\s+(?:East|West|North|South|E\.|W\.|N\.|S\.)?\s*\d*(?:st|nd|rd|th)?\s+(?:Street|St\.?|Avenue|Ave\.?|Place|Pl\.?|Road|Rd\.?|Boulevard|Blvd\.?|Way|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?))/i,
    // "123 W 4 St" compact style
    /(\d{1,5}\s+[EWNS]\.?\s+\d{1,3}(?:st|nd|rd|th)?\s+(?:St|Ave|Pl|Blvd|Way)\.?)/i,
    // "123 Broadway" style
    /(\d{1,5}\s+(?:Broadway|Park\s+Avenue|Fifth\s+Avenue|Madison\s+Avenue|Lexington\s+Avenue|Amsterdam\s+Avenue|Columbus\s+Avenue|Central\s+Park\s+(?:West|South|North)|Riverside\s+Drive))/i,
    // Named streets without numbers at start
    /(\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St\.?|Avenue|Ave\.?|Place|Pl\.?))/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      return cleanAddress(match[1]);
    }
  }

  return null;
}

/**
 * Clean up extracted address
 */
function cleanAddress(address: string): string {
  return address
    .replace(/\s+/g, " ")
    .replace(/,\s*$/, "")
    .trim();
}

/**
 * Extract unit number from context
 */
function extractUnit(context: string): string | null {
  // Look for unit patterns
  const patterns = [
    /(?:apt\.?|apartment|unit|#)\s*([A-Za-z0-9-]+)/i,
    /,\s*#?([A-Z0-9]{1,4})\s*(?:,|$)/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Extract price from HTML context
 */
function extractPrice(context: string): number | null {
  // Price patterns: $X,XXX or $X,XXX/mo
  const patterns = [
    /\$\s*([\d,]+)(?:\s*\/\s*(?:mo|month|mon))?/i,
    /(?:asking|rent|price)[:\s]*\$?\s*([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ""), 10);
      // Sanity check: rent should be between $500 and $50,000
      if (price >= 500 && price <= 50000) {
        return price;
      }
    }
  }

  return null;
}

/**
 * Extract bedrooms from HTML context
 */
function extractBedrooms(context: string): number | null {
  const patterns = [
    /(\d+)\s*(?:bed|br|bedroom)/i,
    /(?:studio)/i,
    /(\d+)br/i,
    /(\d+)\s*bd/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      if (pattern.source.includes("studio")) {
        return 0;
      }
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract bathrooms from HTML context
 */
function extractBathrooms(context: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i,
    /(\d+(?:\.\d+)?)ba/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  return null;
}

/**
 * Extract neighborhood from HTML context
 */
function extractNeighborhood(context: string): string | null {
  // Common NYC neighborhoods
  const neighborhoods = [
    "East Village",
    "West Village",
    "Greenwich Village",
    "SoHo",
    "NoHo",
    "Tribeca",
    "Lower East Side",
    "LES",
    "Upper East Side",
    "UES",
    "Upper West Side",
    "UWS",
    "Midtown",
    "Midtown East",
    "Midtown West",
    "Hell's Kitchen",
    "Chelsea",
    "Flatiron",
    "Gramercy",
    "Murray Hill",
    "Kips Bay",
    "NoMad",
    "Financial District",
    "FiDi",
    "Battery Park City",
    "Harlem",
    "East Harlem",
    "Washington Heights",
    "Inwood",
    "Williamsburg",
    "Bushwick",
    "Greenpoint",
    "DUMBO",
    "Brooklyn Heights",
    "Park Slope",
    "Prospect Heights",
    "Crown Heights",
    "Bed-Stuy",
    "Bedford-Stuyvesant",
    "Fort Greene",
    "Clinton Hill",
    "Cobble Hill",
    "Carroll Gardens",
    "Boerum Hill",
    "Red Hook",
    "Gowanus",
    "Sunset Park",
    "Bay Ridge",
    "Astoria",
    "Long Island City",
    "LIC",
    "Sunnyside",
    "Woodside",
    "Jackson Heights",
    "Forest Hills",
    "Flushing",
    "Jersey City",
    "Hoboken",
  ];

  for (const hood of neighborhoods) {
    const pattern = new RegExp(`\\b${escapeRegex(hood)}\\b`, "i");
    if (pattern.test(context)) {
      return hood;
    }
  }

  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if listing is no-fee
 */
function extractNoFee(context: string): boolean {
  const noFeePatterns = [
    /no\s*fee/i,
    /no\s*broker\s*fee/i,
    /fee\s*free/i,
    /0%\s*fee/i,
    /owner\s*pays/i,
  ];

  return noFeePatterns.some((p) => p.test(context));
}

/**
 * Extract image URL from HTML context
 */
function extractImageUrl(context: string): string | null {
  // Look for StreetEasy image URLs
  const patterns = [
    /https?:\/\/[^"'\s]+streeteasy[^"'\s]+\.(?:jpg|jpeg|png|webp)/i,
    /https?:\/\/photos\.zillowstatic\.com[^"'\s]+/i,
    /https?:\/\/[^"'\s]+\.cloudfront\.net[^"'\s]+\.(?:jpg|jpeg|png|webp)/i,
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extract listings from plain text email (fallback)
 */
function extractListingsFromText(text: string): ExtractedListing[] {
  // For text emails, we still look for URLs and try to extract what we can
  const listings: ExtractedListing[] = [];

  const urlPattern = /https?:\/\/(?:www\.)?streeteasy\.com\/(?:building\/[^\/\s]+\/)?(?:rental\/\d+|sale\/\d+)/gi;
  const matches = text.match(urlPattern) || [];
  const uniqueUrls = Array.from(new Set(matches));

  for (const url of uniqueUrls) {
    const listing = extractListingFromContext(text, url);
    if (listing) {
      listings.push(listing);
    }
  }

  return listings;
}

/**
 * Validate that a listing has minimum required fields
 */
export function validateListing(listing: ExtractedListing): boolean {
  return !!(
    listing.streetEasyUrl &&
    listing.address &&
    listing.price > 0 &&
    listing.neighborhood
  );
}
