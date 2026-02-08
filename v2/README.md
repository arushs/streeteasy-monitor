# StreetEasy Monitor V2

Multi-user apartment hunting platform with auto-contact capabilities.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma
- **Auth:** Clerk
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (recommended)

## Getting Started

### Prerequisites

1. Node.js 18+
2. PostgreSQL database (use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for free)
3. Clerk account ([dashboard.clerk.com](https://dashboard.clerk.com))

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the following:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
   - `CLERK_SECRET_KEY` - From Clerk dashboard

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations:**
   ```bash
   npx prisma db push
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard routes
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   ├── page.tsx        # Main dashboard/feed
│   │   ├── queue/          # Contact queue
│   │   ├── sent/           # Contact history
│   │   ├── saved/          # Saved listings
│   │   └── settings/       # User settings
│   ├── sign-in/            # Clerk sign-in
│   ├── sign-up/            # Clerk sign-up
│   ├── layout.tsx          # Root layout with ClerkProvider
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ListingCard.tsx     # Listing display card
│   ├── Sidebar.tsx         # Dashboard sidebar nav
│   └── StatsCard.tsx       # Dashboard stat widget
├── lib/                    # Utilities
│   ├── db.ts               # Prisma client
│   └── utils.ts            # Helper functions
└── middleware.ts           # Clerk auth middleware

prisma/
└── schema.prisma           # Database schema
```

## Database Schema

- **User** - User profiles and settings
- **Listing** - Apartment listings from StreetEasy
- **Contact** - Email contacts sent to brokers
- **Template** - User's contact message templates
- **InboundEmail** - Raw forwarded emails

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `RESEND_API_KEY` | Phase 4+ | For sending emails |
| `SENDGRID_API_KEY` | Phase 2+ | For receiving emails |

## Development Phases

- [x] **Phase 1:** Foundation (Next.js, Clerk, Prisma, Dashboard layout)
- [ ] **Phase 2:** Email Ingestion
- [ ] **Phase 3:** Dashboard & Listings
- [ ] **Phase 4:** Contact System
- [ ] **Phase 5:** Auto-Contact
- [ ] **Phase 6:** Response Tracking
- [ ] **Phase 7:** Polish & Launch

## License

Private - Internal use only.
