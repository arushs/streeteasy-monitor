# Email Ingestion Setup Guide

## Overview

StreetEasy Monitor can automatically ingest listings from StreetEasy email alerts. This document explains how to set up inbound email processing.

## Architecture

```
User → Forwards StreetEasy emails → Email Provider → Webhook → Convex → Database
```

## Email Provider Options

### Option 1: SendGrid Inbound Parse (Recommended)

1. **Set up a receiving domain** (e.g., `inbound.yourapp.com`)
2. **Configure MX records** to point to SendGrid
3. **Set up Inbound Parse webhook**:
   - URL: `https://your-convex-deployment.convex.site/inbound-email`
   - Check "POST the raw, full MIME message"

### Option 2: Mailgun Routes

1. **Verify your domain** in Mailgun
2. **Create a route**:
   ```
   Match: catch_all()
   Action: forward("https://your-convex-deployment.convex.site/inbound-email")
   ```

### Option 3: Postmark Inbound

1. **Set up inbound domain** in Postmark
2. **Configure webhook URL**: `https://your-convex-deployment.convex.site/inbound-email`

## User Flow

### Method 1: Plus Addressing (Simpler)

Users forward emails to: `{userId}+se@inbound.yourapp.com`

The system extracts the userId from the email address.

### Method 2: Linked Email (More Flexible)

1. User registers their personal email in the app
2. User sets up email forwarding from their email provider
3. System looks up the sender email to find the user

## StreetEasy Alert Setup (User Instructions)

1. Go to [StreetEasy Saved Searches](https://streeteasy.com/for-rent)
2. Set up your search criteria
3. Click "Save Search" and enable email alerts
4. Set alerts to "Instant" for best results
5. Forward alerts to your unique ingestion address

## Webhook Endpoint

**URL:** `POST /inbound-email`

**Accepts:**
- `multipart/form-data` (SendGrid format)
- `application/json` (Generic JSON)
- `application/x-www-form-urlencoded`

**Expected Fields:**
| Field | Description |
|-------|-------------|
| `to` | Recipient email address |
| `from` | Sender email address |
| `subject` | Email subject |
| `html` | HTML body (preferred) |
| `text` | Plain text body (fallback) |

**Response:**
```json
{
  "success": true,
  "created": 3,
  "skipped": 1,
  "total": 4
}
```

## Parsing Logic

The system:

1. **Validates** the email is from StreetEasy
2. **Extracts** all StreetEasy URLs from the email
3. **Filters** to listing URLs only (not images/static)
4. **Parses** listing details from surrounding context:
   - Price (`$4,500/mo`)
   - Address
   - Bedrooms (`2 bed`, `studio`)
   - Neighborhood
   - No-fee status
   - Image URL

## Testing

### Health Check

```bash
curl https://your-deployment.convex.site/health
```

### Test Webhook

```bash
curl -X POST https://your-deployment.convex.site/inbound-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "testuser+se@inbound.yourapp.com",
    "from": "alerts@streeteasy.com",
    "subject": "New Listings in East Village",
    "html": "<a href=\"https://streeteasy.com/rental/123456\">$3,500 2br in East Village</a>"
  }'
```

## Security Considerations

1. **Webhook Authentication**: Consider adding webhook signature verification
2. **Rate Limiting**: The system deduplicates URLs per user
3. **Input Sanitization**: All extracted text is sanitized before storage
4. **Email Verification**: User emails should be verified before processing

## Troubleshooting

### No listings being created

1. Check if email is from StreetEasy (sender/subject validation)
2. Check if URLs are being extracted correctly
3. Verify user ID can be resolved (plus addressing or linked email)

### Duplicate listings

The system automatically skips listings that already exist for a user (by URL).

### Missing listing details

Details are parsed from email context. If StreetEasy changes their email format, parsing may need updates.

## Deployment

After setting up your email provider, deploy with:

```bash
npx convex deploy
```

Your webhook will be available at:
```
https://your-deployment.convex.site/inbound-email
```
