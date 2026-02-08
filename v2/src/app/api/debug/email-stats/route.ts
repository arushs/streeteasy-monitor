/**
 * Debug Endpoint: Email Processing Stats
 *
 * GET /api/debug/email-stats
 *
 * Returns statistics about processed emails.
 * Only available in development mode.
 */

import { NextResponse } from "next/server";
import { getEmailStats } from "@/lib/email";
import prisma from "@/lib/db";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Get stats for last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await getEmailStats(last24h);

    // Get recent emails
    const recentEmails = await prisma.inboundEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        recipient: true,
        sender: true,
        subject: true,
        processed: true,
        listingsExtracted: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      period: "last_24h",
      stats,
      recentEmails,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stats error" },
      { status: 500 }
    );
  }
}
