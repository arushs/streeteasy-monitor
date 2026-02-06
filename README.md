# StreetEasy Monitor - Convex Backend

Backend functions for the StreetEasy Monitor app.

## Deployment

- **Project**: quixotic-ram-346
- **URL**: https://quixotic-ram-346.convex.cloud

## Security Features

### Authentication
All queries and mutations require authentication via `ctx.auth.getUserIdentity()`. Unauthenticated requests receive a clear error message.

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

#### `listings:list`
Get all listings for the authenticated user.
- Args: `{ status?: string }` - Optional filter by status
- Returns: Array of listings

#### `listings:get`
Get a single listing by ID.
- Args: `{ id: Id<"listings"> }`
- Returns: Listing object

#### `listings:stats`
Get listing statistics for the authenticated user.
- Args: none
- Returns: `{ total, byStatus, bySource }`

### Mutations

#### `listings:create`
Create a new listing.
- Args: `{ streetEasyUrl, price, source?, status?, address?, bedrooms?, neighborhood?, noFee?, emailMessageId? }`
- Returns: New listing ID

#### `listings:updateStatus`
Update listing status.
- Args: `{ id, status }`
- Returns: `{ success: true }`

#### `listings:update`
Update listing details.
- Args: `{ id, streetEasyUrl?, price?, status?, address?, bedrooms?, neighborhood?, noFee? }`
- Returns: `{ success: true }`

#### `listings:remove`
Delete a listing.
- Args: `{ id }`
- Returns: `{ success: true, deletedId }`

### Admin Functions

#### `admin:auditData`
Audit existing data for issues (XSS, invalid URLs, orphaned listings).
- Requires authentication
- Returns audit report

#### `admin:sanitizeExistingData` (internal)
Remove problematic data. Run from Convex dashboard.

## Schema

```typescript
listings: {
  streetEasyUrl: string,
  price: number,
  source: string,
  status: string,
  foundAt: number,
  address?: string,
  bedrooms?: number,
  neighborhood?: string,
  noFee?: boolean,
  emailMessageId?: string,
  userId?: string, // Optional for backward compatibility
}
```

## Backward Compatibility

Existing listings without `userId` are preserved but "orphaned" - they won't appear in user queries. New listings always have `userId` set.
