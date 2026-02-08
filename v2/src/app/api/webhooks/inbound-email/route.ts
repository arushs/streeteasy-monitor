/**
 * Inbound Email Webhook Handler
 *
 * Receives forwarded StreetEasy alert emails from Mailgun, SendGrid, or Postmark.
 * Parses the email, extracts listings, and stores them for the user.
 *
 * Endpoint: POST /api/webhooks/inbound-email
 *
 * Setup:
 * - Mailgun: Configure Inbound Routes to POST to this URL
 * - SendGrid: Configure Inbound Parse to POST to this URL
 * - Postmark: Configure Inbound webhook to POST to this URL
 */

import { NextRequest, NextResponse } from "next/server";
import {
  normalizeEmailPayload,
  parseStreetEasyEmail,
  type InboundEmailPayload,
} from "@/lib/email";
import { storeInboundEmail, markEmailProcessed } from "@/lib/email/storage";
import {
  verifyMailgunSignature,
  shouldSkipVerification,
} from "@/lib/email/verify";
import { findUserByForwardingAddress, saveListingsForUser } from "@/lib/listings";

/**
 * Health check for the webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "inbound-email",
    message: "Webhook is ready to receive emails",
  });
}

/**
 * Handle inbound email from email provider
 */
export async function POST(request: NextRequest) {
  let payload: InboundEmailPayload;

  try {
    // Parse the request body
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();

    // Verify webhook signature (if configured)
    if (!shouldSkipVerification() && process.env.MAILGUN_SIGNING_KEY) {
      // Re-parse as form data for Mailgun verification
      const params = new URLSearchParams(rawBody);
      const timestamp = params.get("timestamp") || "";
      const token = params.get("token") || "";
      const signature = params.get("signature") || "";

      if (!verifyMailgunSignature(process.env.MAILGUN_SIGNING_KEY, timestamp, token, signature)) {
        console.error("[Inbound Email] Invalid Mailgun signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (contentType.includes("application/json")) {
      payload = JSON.parse(rawBody);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      payload = parseFormUrlEncoded(rawBody);
    } else {
      // Try JSON first, fallback to form-urlencoded
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = parseFormUrlEncoded(rawBody);
      }
    }
  } catch (error) {
    console.error("[Inbound Email] Failed to parse request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Normalize the email payload
  const email = normalizeEmailPayload(payload);

  console.log("[Inbound Email] Received:", {
    recipient: email.recipient,
    sender: email.sender,
    subject: email.subject,
    hasHtml: !!email.htmlBody,
    hasText: !!email.textBody,
  });

  // Validate we have a recipient
  if (!email.recipient) {
    console.error("[Inbound Email] No recipient address");
    return NextResponse.json(
      { error: "Missing recipient address" },
      { status: 400 }
    );
  }

  // Store the raw email first (for audit trail)
  let emailId: string;
  try {
    emailId = await storeInboundEmail(email);
    console.log("[Inbound Email] Stored email:", emailId);
  } catch (error) {
    console.error("[Inbound Email] Failed to store email:", error);
    return NextResponse.json(
      { error: "Failed to store email" },
      { status: 500 }
    );
  }

  // Find the user by forwarding address
  const user = await findUserByForwardingAddress(email.recipient);

  if (!user) {
    console.warn("[Inbound Email] No user found for:", email.recipient);
    // Still return 200 to prevent email provider retries
    // The email is stored for debugging
    await markEmailProcessed(emailId, 0);
    return NextResponse.json({
      status: "ignored",
      reason: "No user found for forwarding address",
      emailId,
    });
  }

  console.log("[Inbound Email] Found user:", user.email);

  // Parse the StreetEasy email
  const parseResult = parseStreetEasyEmail(email);

  if (!parseResult.success) {
    console.warn("[Inbound Email] Parse failed:", parseResult.errors);
    await markEmailProcessed(emailId, 0);
    return NextResponse.json({
      status: "processed",
      success: false,
      errors: parseResult.errors,
      emailId,
    });
  }

  console.log("[Inbound Email] Parsed listings:", parseResult.listings.length);

  // Save listings for the user (with deduplication)
  const saveResult = await saveListingsForUser(
    user.id,
    parseResult.listings,
    emailId
  );

  // Mark email as processed
  await markEmailProcessed(emailId, saveResult.saved);

  console.log("[Inbound Email] Save result:", {
    saved: saveResult.saved,
    duplicates: saveResult.duplicates,
  });

  return NextResponse.json({
    status: "processed",
    success: true,
    emailId,
    user: user.email,
    listings: {
      extracted: parseResult.listings.length,
      saved: saveResult.saved,
      duplicates: saveResult.duplicates,
    },
    errors: [...parseResult.errors, ...saveResult.errors],
  });
}

/**
 * Parse application/x-www-form-urlencoded body
 */
function parseFormUrlEncoded(body: string): InboundEmailPayload {
  const params = new URLSearchParams(body);
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj as unknown as InboundEmailPayload;
}
