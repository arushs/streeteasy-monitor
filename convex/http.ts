import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// ============================================================================
// EMAIL INGESTION WEBHOOK
// Receives inbound emails from SendGrid/Mailgun and processes StreetEasy alerts
// ============================================================================

/**
 * Inbound email webhook endpoint
 * 
 * Email addresses format: {userId}+se@listings.yourapp.com
 * 
 * SendGrid Inbound Parse format (multipart/form-data):
 * - to: recipient email
 * - from: sender email  
 * - subject: email subject
 * - text: plain text body
 * - html: HTML body
 * - envelope: JSON with routing info
 * 
 * Mailgun format is similar but uses different field names
 */
http.route({
  path: "/inbound-email",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse the incoming email data
      const contentType = request.headers.get("content-type") || "";
      
      let emailData: any;
      
      if (contentType.includes("multipart/form-data")) {
        // SendGrid format
        const formData = await request.formData();
        emailData = Object.fromEntries(formData.entries());
      } else if (contentType.includes("application/json")) {
        // JSON format (Mailgun or custom)
        emailData = await request.json();
      } else {
        // Try URL encoded
        const text = await request.text();
        emailData = Object.fromEntries(new URLSearchParams(text));
      }
      
      // Extract recipient - determines which user this goes to
      const to = emailData.to || emailData.recipient || "";
      const from = emailData.from || emailData.sender || "";
      const subject = emailData.subject || "";
      const htmlBody = emailData.html || emailData["body-html"] || "";
      const textBody = emailData.text || emailData["body-plain"] || "";
      
      // Parse user ID from email address
      // Format: {userId}+se@domain.com OR just use linked email lookup
      const userId = await resolveUserId(ctx, to, from);
      
      if (!userId) {
        console.log("Could not determine user for email:", { to, from });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Unknown recipient" 
        }), { status: 200 }); // Return 200 to prevent retries
      }
      
      // Check if this is a StreetEasy alert
      if (!isStreetEasyEmail(from, subject)) {
        console.log("Not a StreetEasy email, ignoring:", { from, subject });
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Ignored: not a StreetEasy alert" 
        }), { status: 200 });
      }
      
      // Parse StreetEasy listings from email
      const listings = parseStreetEasyEmail(htmlBody || textBody, subject);
      
      if (listings.length === 0) {
        console.log("No listings found in email");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "No listings found" 
        }), { status: 200 });
      }
      
      // Store each listing
      let created = 0;
      let skipped = 0;
      
      for (const listing of listings) {
        try {
          await ctx.runMutation(internal.emailIngestion.createListing, {
            userId,
            streetEasyUrl: listing.url,
            price: listing.price,
            address: listing.address,
            bedrooms: listing.bedrooms,
            neighborhood: listing.neighborhood,
            noFee: listing.noFee,
            imageUrl: listing.imageUrl,
          });
          created++;
        } catch (e: any) {
          if (e.message?.includes("already have a listing")) {
            skipped++;
          } else {
            console.error("Error creating listing:", e);
          }
        }
      }
      
      console.log(`Processed ${listings.length} listings: ${created} created, ${skipped} skipped`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        created,
        skipped,
        total: listings.length 
      }), { status: 200 });
      
    } catch (error: any) {
      console.error("Email ingestion error:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), { status: 200 }); // Return 200 to prevent endless retries
    }
  }),
});

/**
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ 
      status: "ok",
      service: "streeteasy-monitor",
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Resolve which user this email belongs to
 */
async function resolveUserId(
  ctx: any, 
  to: string, 
  from: string
): Promise<string | null> {
  // Method 1: Parse from "to" address (userId+se@domain.com)
  const plusMatch = to.match(/^([a-zA-Z0-9]+)\+se@/);
  if (plusMatch) {
    return plusMatch[1];
  }
  
  // Method 2: Look up by sender email (user forwarded from their personal email)
  const userEmail = await ctx.runQuery(api.userEmails.getByEmail, { 
    email: from.replace(/<|>/g, "").trim().toLowerCase()
  });
  
  if (userEmail) {
    return userEmail.userId;
  }
  
  return null;
}

/**
 * Check if this email is from StreetEasy
 */
function isStreetEasyEmail(from: string, subject: string): boolean {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();
  
  return (
    fromLower.includes("streeteasy") ||
    fromLower.includes("@streeteasy.com") ||
    subjectLower.includes("streeteasy") ||
    subjectLower.includes("new listing") ||
    subjectLower.includes("rental alert") ||
    subjectLower.includes("new apartments")
  );
}

/**
 * Parse StreetEasy alert email to extract listings
 */
function parseStreetEasyEmail(body: string, subject: string): ParsedListing[] {
  const listings: ParsedListing[] = [];
  
  // Extract StreetEasy URLs
  const urlRegex = /https?:\/\/streeteasy\.com\/[^\s"'<>]+/gi;
  const urls = [...new Set(body.match(urlRegex) || [])];
  
  // Filter to listing URLs only (not images, static resources, etc.)
  const listingUrls = urls.filter(url => 
    url.includes("/rental/") || 
    url.includes("/building/") ||
    url.includes("/for-rent/")
  );
  
  // Try to extract listing details from HTML
  for (const url of listingUrls) {
    const listing: ParsedListing = {
      url: cleanUrl(url),
      price: 0,
    };
    
    // Try to find price near this URL in the HTML
    const urlIndex = body.indexOf(url);
    if (urlIndex !== -1) {
      // Look for price pattern ($X,XXX) within 500 chars of the URL
      const context = body.substring(Math.max(0, urlIndex - 300), urlIndex + 500);
      
      // Price patterns: $4,500, $4500, $4,500/mo
      const priceMatch = context.match(/\$([0-9,]+)(?:\/mo)?/i);
      if (priceMatch) {
        listing.price = parseInt(priceMatch[1].replace(/,/g, ""));
      }
      
      // Address patterns
      const addressMatch = context.match(/(\d+[^<>\n]{10,50}(?:Street|St|Avenue|Ave|Road|Rd|Place|Pl|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way)[^<>\n]{0,30})/i);
      if (addressMatch) {
        listing.address = cleanText(addressMatch[1]);
      }
      
      // Bedrooms: "2 bed", "2br", "2 bedroom", "studio"
      const bedroomMatch = context.match(/(\d+)\s*(?:bed|br|bedroom)/i);
      if (bedroomMatch) {
        listing.bedrooms = parseInt(bedroomMatch[1]);
      } else if (context.toLowerCase().includes("studio")) {
        listing.bedrooms = 0;
      }
      
      // Neighborhood
      const neighborhoodPatterns = [
        /in\s+([A-Z][a-zA-Z\s]+?)(?:,|\.|<|$)/,
        /([A-Z][a-zA-Z\s]+?)(?:\s+rental|\s+apartment)/,
      ];
      for (const pattern of neighborhoodPatterns) {
        const match = context.match(pattern);
        if (match) {
          listing.neighborhood = cleanText(match[1]);
          break;
        }
      }
      
      // No fee
      listing.noFee = /no\s*fee|no\s*broker/i.test(context);
      
      // Image URL
      const imgMatch = context.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i);
      if (imgMatch) {
        listing.imageUrl = imgMatch[0];
      }
    }
    
    listings.push(listing);
  }
  
  return listings;
}

/**
 * Clean a URL (remove tracking params, etc.)
 */
function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common tracking parameters
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("ref");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedListing {
  url: string;
  price: number;
  address?: string;
  bedrooms?: number;
  neighborhood?: string;
  noFee?: boolean;
  imageUrl?: string;
}

export default http;
