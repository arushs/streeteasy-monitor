/**
 * Debug Endpoint: Test Email Parser
 *
 * POST /api/debug/parse-email
 *
 * Send raw email HTML to test the parser without actually storing anything.
 * Only available in development mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseStreetEasyEmail, type NormalizedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { html, text, sender, subject } = body;

    if (!html && !text) {
      return NextResponse.json(
        { error: "Provide html or text in request body" },
        { status: 400 }
      );
    }

    const email: NormalizedEmail = {
      recipient: "test@test.com",
      sender: sender || "alerts@streeteasy.com",
      subject: subject || "New Rental Listing",
      htmlBody: html || null,
      textBody: text || null,
      rawHeaders: null,
    };

    const result = parseStreetEasyEmail(email);

    return NextResponse.json({
      success: result.success,
      listingsFound: result.listings.length,
      listings: result.listings,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse error" },
      { status: 500 }
    );
  }
}
