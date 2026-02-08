/**
 * Email Webhook Verification
 *
 * Verify incoming webhooks from email providers.
 */

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Mailgun webhook signature
 *
 * @see https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
 */
export function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean {
  try {
    const encodedToken = createHmac("sha256", signingKey)
      .update(timestamp + token)
      .digest("hex");

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(encodedToken)
    );
  } catch {
    return false;
  }
}

/**
 * Check if a request should bypass verification (for testing)
 */
export function shouldSkipVerification(): boolean {
  // Skip in development or if explicitly disabled
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SKIP_WEBHOOK_VERIFICATION === "true"
  );
}

/**
 * Verify SendGrid webhook (basic auth or API key header)
 * SendGrid Inbound Parse doesn't have built-in signature verification,
 * but you can configure basic auth or a custom header.
 */
export function verifySendGridAuth(
  authHeader: string | null,
  expectedAuth: string
): boolean {
  if (!authHeader || !expectedAuth) return false;

  try {
    // Basic auth format: "Basic base64(user:pass)"
    if (authHeader.startsWith("Basic ")) {
      const base64 = authHeader.slice(6);
      const decoded = Buffer.from(base64, "base64").toString("utf-8");
      return decoded === expectedAuth;
    }

    // Bearer token format
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      return timingSafeEqual(
        Buffer.from(token),
        Buffer.from(expectedAuth)
      );
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Verify Postmark webhook
 * Postmark uses a shared secret in the webhook URL or X-Postmark-* headers
 */
export function verifyPostmarkWebhook(
  token: string | null,
  expectedToken: string
): boolean {
  if (!token || !expectedToken) return false;

  try {
    return timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    );
  } catch {
    return false;
  }
}
