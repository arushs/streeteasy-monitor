# StreetEasy Monitor

A Tinder-like swipe UI for browsing StreetEasy rental listings. Built with React + Vite + Convex.

## Features

- **Swipe Interface** — Full-screen card-based browsing (swipe right to save, left to skip)
- **Real-time Updates** — Convex powers live data sync across tabs/devices
- **Kanban Board** — Organize listings by status (new, viewed, saved, rejected, applied)
- **Email Ingestion** — Auto-import listings from StreetEasy email alerts
- **Mobile-First** — Designed for mobile with gesture support

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** [Convex](https://convex.dev) (real-time database + serverless functions)
- **Email Worker:** Cloudflare Worker (parses StreetEasy alert emails → Convex)
- **Build:** Vite
- **Hosting:** Cloudflare Pages

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project (or link to an existing one)
- Generate the `_generated/` types
- Start the dev server with hot reload
- Write `VITE_CONVEX_URL` to `.env.local`

### 3. Start the frontend

```bash
npm run dev
```

App runs at http://localhost:5173

### 4. (Optional) Email ingestion Worker

The Worker at `worker/` parses StreetEasy alert emails and POSTs listings to Convex via the HTTP action.

```bash
cd worker
npm install
npx wrangler dev
```

Point the Worker's ingest URL to your Convex HTTP endpoint:
```
POST https://<your-deployment>.convex.site/ingest
Authorization: Bearer <CONVEX_INGEST_SECRET>
Content-Type: application/json

{ "listings": [{ "streetEasyUrl": "...", "price": 3000, ... }] }
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

## API Reference

### Convex Queries (real-time)

| Function | Description |
|----------|-------------|
| `listings.list` | Get listings (optional `status` / `userId` filter) |
| `listings.get` | Get a single listing by ID |
| `listings.stats` | Get listing counts by status |
| `changes.list` | Get listing changes (price drops, etc.) |
| `changes.summary` | Get change summary + unread count |
| `contacts.list` | Get contacts |
| `settings.list` | Get settings |

### Convex Mutations

| Function | Description |
|----------|-------------|
| `listings.create` | Create a listing (deduplicates by URL) |
| `listings.updateStatus` | Update listing status |
| `listings.update` | Update listing details |
| `listings.remove` | Delete a listing |
| `changes.create` | Record a listing change |
| `changes.markRead` | Mark changes as read |
| `contacts.create` | Create a contact |
| `settings.upsert` | Create or update a setting |

### HTTP Actions

| Endpoint | Description |
|----------|-------------|
| `POST /ingest` | Bulk-ingest listings from email parser |
| `GET /health` | Health check |

## Schema

```typescript
listings: {
  streetEasyUrl: string,
  price: number,
  source: "manual" | "email" | "test",
  status: "new" | "viewed" | "interested" | "rejected" | "reached_out" | "applied" | "rented" | "delisted" | "removed",
  foundAt: number,
  address?: string,
  bedrooms?: number,
  bathrooms?: number,
  sqft?: number,
  neighborhood?: string,
  noFee?: boolean,
  imageUrl?: string,
  images?: string[],
  emailMessageId?: string,
  userId?: string,
}

listing_changes: {
  listingId: Id<"listings">,
  changeType: "price_drop" | "price_increase" | "rented" | "delisted" | "removed" | "became_no_fee" | "lost_no_fee",
  oldValue?: string,
  newValue?: string,
  detectedAt: number,
  readAt?: number,
}

contacts: {
  name: string,
  email?: string,
  phone?: string,
  role?: string,
  notes?: string,
  listingId?: Id<"listings">,
  userId?: string,
}

settings: {
  key: string,
  value: string,
  userId?: string,
}
```
