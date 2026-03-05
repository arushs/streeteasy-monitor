# StreetEasy Monitor

A Tinder-like swipe UI for browsing StreetEasy rental listings. Built with React + Vite.

## Features

- **Swipe Interface** — Full-screen card-based browsing (swipe right to save, left to skip)
- **Kanban Board** — Organize listings by status (new, viewed, saved, rejected, applied)
- **Email Ingestion** — Auto-import listings from StreetEasy email alerts
- **Mobile-First** — Designed for mobile with gesture support

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Build:** Vite
- **Hosting:** Cloudflare Pages

## Development

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

## API Reference

### Listings

| Endpoint | Description |
|----------|-------------|
| `listings:list` | Get all listings (optional status filter) |
| `listings:get` | Get a single listing by ID |
| `listings:stats` | Get listing statistics |
| `listings:create` | Create a new listing |
| `listings:updateStatus` | Update listing status |
| `listings:update` | Update listing details |
| `listings:remove` | Delete a listing |

### Security

- All queries/mutations require authentication
- User-scoped data (listings belong to users)
- Input validation and HTML sanitization
- URL validation for StreetEasy links

## Schema

```typescript
listings: {
  streetEasyUrl: string,
  price: number,
  source: string,       // "manual" | "email" | "test"
  status: string,       // "new" | "viewed" | "saved" | "rejected" | "applied"
  foundAt: number,
  address?: string,
  bedrooms?: number,
  neighborhood?: string,
  noFee?: boolean,
  emailMessageId?: string,
  userId?: string,
}
```
