/**
 * Email Storage Service
 *
 * Stores raw inbound emails for audit trail and reprocessing.
 */

import { Prisma } from "@prisma/client";
import prisma from "../db";
import type { NormalizedEmail } from "./types";

/**
 * Store a raw inbound email
 */
export async function storeInboundEmail(email: NormalizedEmail): Promise<string> {
  const record = await prisma.inboundEmail.create({
    data: {
      recipient: email.recipient,
      sender: email.sender,
      subject: email.subject,
      htmlBody: email.htmlBody,
      textBody: email.textBody,
      rawHeaders: email.rawHeaders ?? Prisma.JsonNull,
      processed: false,
    },
  });

  return record.id;
}

/**
 * Mark an inbound email as processed
 */
export async function markEmailProcessed(
  emailId: string,
  listingsExtracted: number
): Promise<void> {
  await prisma.inboundEmail.update({
    where: { id: emailId },
    data: {
      processed: true,
      processedAt: new Date(),
      listingsExtracted,
    },
  });
}

/**
 * Get unprocessed inbound emails (for retry logic)
 */
export async function getUnprocessedEmails(limit = 10) {
  return prisma.inboundEmail.findMany({
    where: {
      processed: false,
      createdAt: {
        // Only retry emails from last 24 hours
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Get email processing stats
 */
export async function getEmailStats(since?: Date) {
  const whereClause = since ? { createdAt: { gte: since } } : {};

  const [total, processed, failed] = await Promise.all([
    prisma.inboundEmail.count({ where: whereClause }),
    prisma.inboundEmail.count({ where: { ...whereClause, processed: true } }),
    prisma.inboundEmail.count({
      where: { ...whereClause, processed: false, listingsExtracted: 0 },
    }),
  ]);

  const listings = await prisma.inboundEmail.aggregate({
    where: { ...whereClause, processed: true },
    _sum: { listingsExtracted: true },
  });

  return {
    total,
    processed,
    failed,
    listingsExtracted: listings._sum.listingsExtracted || 0,
  };
}
