# StreetEasy Monitor - Deployment Guide

## Current Version (V1)

Vite + React frontend deployed to Cloudflare Pages.

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Cloudflare Pages | https://streetyeet.com |
| Staging | Cloudflare Pages | https://streeteasy-monitor.pages.dev |

## Custom Domain: streetyeet.com

**Status:** ✅ Configured (2026-02-09)

The domain is set up on Cloudflare:
- Zone: streetyeet.com (active)
- Pages Project: streeteasy-monitor
- Custom Domains:
  - streetyeet.com → streeteasy-monitor.pages.dev
  - www.streetyeet.com → streeteasy-monitor.pages.dev

SSL is automatically provisioned by Cloudflare.

### Deploy V1

```bash
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
```

### Deploy V2 (Vercel - Recommended)

```bash
cd v2
npm i -g vercel
vercel --prod
```

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
2. ⏳ Deploy V2 to new URL
3. ⏳ Migrate data to PostgreSQL
4. ⏳ Point main domain to V2
5. ⏳ Deprecate V1

## Gotchas

1. **V2 uses Prisma + PostgreSQL** as the backend
2. **Clerk keys** - Publishable key is `NEXT_PUBLIC_*`, secret is server-only
3. **Database SSL** - Most cloud Postgres requires `?sslmode=require`
4. **Prisma client** - Run `npx prisma generate` after any schema change
5. **Next.js on Cloudflare** - Needs adapter, Vercel is easier
