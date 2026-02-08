# StreetEasy Monitor - Deployment Guide

## Current Version (V1)

Simple Vite + React app with Convex backend.

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Cloudflare Pages | https://streeteasy-monitor.pages.dev |
| Backend | Convex | (configured in convex.json) |

### Deploy V1

```bash
# Deploy Convex backend
npx convex deploy

# Build frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=streeteasy-monitor
```

---

## V2 (Next.js - In Progress)

Located in `v2/` directory. Full-stack Next.js app with Clerk auth and Prisma.

### Stack

- **Framework:** Next.js 14
- **Auth:** Clerk
- **Database:** PostgreSQL (Prisma ORM)
- **Styling:** Tailwind CSS

### Required Environment Variables

Create `v2/.env.local` from `v2/.env.example`:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/streeteasy_monitor?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Email (Phase 4+)
# RESEND_API_KEY="re_..."
```

### Database Providers

Get a free PostgreSQL database from:
- **Neon:** https://neon.tech
- **Supabase:** https://supabase.com
- **Railway:** https://railway.app

### Clerk Setup

1. Create app at https://dashboard.clerk.com
2. Copy publishable key and secret key
3. Configure sign-in/sign-up URLs

### Deploy V2 (Vercel - Recommended)

```bash
cd v2

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Deploy V2 (Cloudflare Pages)

```bash
cd v2

# Build
npm run build

# Deploy (may need Next.js compatibility mode)
npx wrangler pages deploy .next --project-name=streeteasy-monitor-v2
```

**Note:** Next.js on Cloudflare Pages requires `@cloudflare/next-on-pages` adapter.

### Local Development (V2)

```bash
cd v2
npm install
npx prisma generate
npx prisma db push
npm run dev
```

App runs at http://localhost:3000

---

## Migration Plan (V1 → V2)

1. ✅ V2 scaffold created in `v2/` folder
2. ⏳ Deploy V2 to new URL (e.g., v2.streeteasy-monitor.pages.dev)
3. ⏳ Migrate data from Convex to PostgreSQL
4. ⏳ Point main domain to V2
5. ⏳ Deprecate V1

## Gotchas

1. **V1 uses Convex**, V2 uses Prisma + PostgreSQL (different backends!)
2. **Clerk keys** - Publishable key is `NEXT_PUBLIC_*`, secret is server-only
3. **Database SSL** - Most cloud Postgres requires `?sslmode=require`
4. **Prisma client** - Run `npx prisma generate` after any schema change
5. **Next.js on Cloudflare** - Needs adapter, Vercel is easier
