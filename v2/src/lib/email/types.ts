/**
 * Types for email ingestion and parsing
 */

export interface InboundEmailPayload {
  // Mailgun format
  recipient?: string;
  sender?: string;
  from?: string;
  subject?: string;
  "body-html"?: string;
  "body-plain"?: string;
  "stripped-html"?: string;
  "stripped-text"?: string;
  timestamp?: string;
  token?: string;
  signature?: string;
  "message-headers"?: string;

  // SendGrid format (Inbound Parse)
  to?: string;
  html?: string;
  text?: string;
  headers?: string;

  // Postmark format
  To?: string;
  From?: string;
  Subject?: string;
  HtmlBody?: string;
  TextBody?: string;
}

export interface NormalizedEmail {
  recipient: string;
  sender: string;
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  rawHeaders: Record<string, string> | null;
}

export interface ExtractedListing {
  streetEasyUrl: string;
  address: string;
  unit: string | null;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms: number | null;
  noFee: boolean;
  brokerName: string | null;
  brokerEmail: string | null;
  brokerPhone: string | null;
  imageUrl: string | null;
}

export interface ParseResult {
  success: boolean;
  listings: ExtractedListing[];
  errors: string[];
}
