# StreetEasy Monitor

Backend functions for the StreetEasy Monitor app, powered by Cloudflare Workers and D1.

## Deployment

See `DEPLOY.md` for deployment instructions (Cloudflare Workers + D1).

## Security Features

### Authentication
All queries and mutations require authentication via session tokens. Unauthenticated requests receive a clear error message.

### User Scoping
- All listings have a `userId` field
- Queries only return listings belonging to the authenticated user
- Mutations validate that the user owns the listing before modifying/deleting

### Input Validation
- `streetEasyUrl`: Must match `https://streeteasy.com/*` pattern, no script injection
- `price`: Must be a positive number (max $1,000,000/month)
- `status`: Must be one of: "new", "viewed", "saved", "rejected", "applied"
- `source`: Must be one of: "manual", "email", "test"
- String fields are sanitized to remove HTML tags

## API Reference

### Queries

#### `GET /api/listings`
Get all listings for the authenticated user.
- Query params: `status` (optional) - Filter by status
- Returns: Array of listings

#### `GET /api/listings/:id`
Get a single listing by ID.
- Returns: Listing object

#### `GET /api/listings/stats`
Get listing statistics for the authenticated user.
- Returns: `{ total, byStatus, bySource }`

### Mutations

#### `POST /api/listings`
Create a new listing.
- Body: `{ streetEasyUrl, price, source?, status?, address?, bedrooms?, neighborhood?, noFee?, emailMessageId? }`
- Returns: New listing ID

#### `PATCH /api/listings/:id/status`
Update listing status.
- Body: `{ status }`
- Returns: `{ success: true }`

#### `PATCH /api/listings/:id`
Update listing details.
- Body: `{ streetEasyUrl?, price?, status?, address?, bedrooms?, neighborhood?, noFee? }`
- Returns: `{ success: true }`

#### `DELETE /api/listings/:id`
Delete a listing.
- Returns: `{ success: true, deletedId }`

### Admin Functions

#### `GET /api/admin/audit`
Audit existing data for issues (XSS, invalid URLs, orphaned listings).
- Requires authentication
- Returns audit report

#### `POST /api/admin/sanitize` (internal)
Remove problematic data. Run from admin dashboard.

## Schema (D1)

```sql
CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streetEasyUrl TEXT NOT NULL,
  price REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'new',
  foundAt INTEGER NOT NULL,
  address TEXT,
  bedrooms INTEGER,
  neighborhood TEXT,
  noFee INTEGER DEFAULT 0,
  emailMessageId TEXT,
  userId TEXT
);
```

## Backward Compatibility

Existing listings without `userId` are preserved but "orphaned" — they won't appear in user queries. New listings always have `userId` set.
