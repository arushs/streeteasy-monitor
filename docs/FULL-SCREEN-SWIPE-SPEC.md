# StreetYeet Full-Screen Swipe UI - Design Spec

## Problem Statement

The current swipe UI is unusable. Cards are small, cramped, and don't showcase listings properly. Users want a Tinder-like experience where each apartment feels like a full-screen discovery moment.

### Current Issues
1. **Cards too small** - `h-64` image + content = ~500px card, constrained to `max-w-lg` (~512px)
2. **No real images** - Schema missing `imageUrl` field (bug!), email parsing extracts URLs but they're not stored
3. **Amateur styling** - Functional but lacks polish, doesn't feel premium
4. **Poor mobile experience** - Swipe gestures cramped, not full-screen

---

## Design Vision: "Tinder for Apartments"

### Reference: How Tinder/Bumble/Hinge Do It

**Key UX Patterns:**
1. **Full-viewport cards** - Card fills 85-95% of screen height
2. **Image-first** - 70%+ of card is imagery, text overlays on image
3. **Minimal chrome** - Header is thin/translucent, focus is on content
4. **Gesture-driven** - Swipe left/right/up with satisfying physics
5. **Visual feedback** - Colored overlays (NOPE/LIKE) appear on drag
6. **Stacked peek** - See 1-2 cards behind, creates depth

**Specific Implementations:**
- Tinder: Full-bleed images, name/age overlay at bottom, action buttons below
- Bumble: Similar, but info in expandable drawer
- Hinge: "Prompt" style cards with images + conversation starters

### For StreetYeet

**Card Layout (Mobile-First):**
```
┌─────────────────────────────────────┐
│  [Time] ●                    [No Fee]│  ← Overlaid badges
│                                      │
│                                      │
│         FULL SCREEN IMAGE            │
│        (swipeable gallery)           │
│                                      │
│                                      │
│  ● ● ○ ○ ○                          │  ← Image indicators
├─────────────────────────────────────┤
│  $4,500/mo                          │  ← Price prominent
│  123 East 10th Street               │  ← Address
│  2 BR  •  East Village              │  ← Details inline
│                                      │
│  [← Skip]  [↑ Contact]  [Save →]    │  ← Action hints
└─────────────────────────────────────┘
```

**Proportions:**
- Image area: 70% of viewport height
- Info area: 20% of viewport height
- Action hints: 10%
- Total: Full viewport (minus status bar)

---

## Technical Requirements

### 1. Image Storage & Display (Backend)

**Problem:** Schema missing `imageUrl`, images are ephemeral external URLs

**Solution:**
1. Add `imageUrl` to schema (nullable string) ✓ Simple
2. Add `images` array for galleries (v2)
3. Implement image caching service:
   - On email ingestion, download & store images in Convex file storage
   - Store permanent Convex file URLs
   - Fallback: scrape StreetEasy listing page for images

**Schema Change:**
```typescript
listings: defineTable({
  // ... existing fields
  imageUrl: v.optional(v.string()),      // Primary image URL
  images: v.optional(v.array(v.string())), // Gallery (v2)
  imageStorageId: v.optional(v.id("_storage")), // Convex file storage
})
```

### 2. Full-Screen Card Component (Frontend)

**Changes to SwipeCard.tsx:**
- Remove fixed `h-64` image height
- Use `h-[70vh]` or CSS calc for image area
- Make card absolute/fixed full-viewport
- Image should fill and cover, not contain
- Add gradient overlay for text readability

**Changes to SwipeFeed.tsx:**
- Remove `max-w-lg` constraint
- Header should be transparent/overlaid
- Filter panel as bottom sheet, not inline

**Changes to CardStack.tsx:**
- Stack container should be full viewport
- Adjust peek offsets for full-screen cards

### 3. Visual Polish (Design)

**Typography:**
- Price: 32-40px bold, white with shadow (on image)
- Address: 18-24px semibold
- Details: 14-16px medium

**Colors:**
- Swipe overlays: Red/Green with 60% opacity
- Badges: Glassmorphic (blur + transparency)
- Gradients: Bottom-to-top dark gradient on images

**Animations:**
- Card entry: Scale from 0.9 + fade in
- Swipe: Rotation + translation with spring physics
- Overlay: Fade based on drag distance

**Shadows:**
- Cards: Large, soft shadow (0 25px 50px rgba(0,0,0,0.15))
- Badges: Subtle drop shadow

---

## Implementation Phases

### Phase 1: Critical Fixes (P0)
1. Fix schema - add `imageUrl` field
2. Full-screen card layout
3. Image-first design with overlays

### Phase 2: Image Pipeline (P1)
1. Download & cache images on ingestion
2. Add Convex file storage
3. Gallery support (multiple images)

### Phase 3: Polish (P2)
1. Glassmorphic UI elements
2. Refined animations
3. Image gallery swipe within card
4. Better empty states

---

## Acceptance Criteria

- [ ] Cards fill 90%+ of mobile viewport
- [ ] Images display full-bleed (cover, not contain)
- [ ] Price/address readable over images (gradient overlay)
- [ ] Swipe gestures work smoothly on mobile
- [ ] SKIP/SAVE/CONTACT overlays appear on drag
- [ ] Images persist (not broken links)
- [ ] No more amateur vibes - looks like a real app

---

## Files to Modify

**Frontend:**
- `src/components/SwipeCard.tsx` - Full-screen layout
- `src/components/CardStack.tsx` - Container sizing
- `src/pages/SwipeFeed.tsx` - Remove constraints, overlay header
- `src/index.css` - Global styles for full-screen

**Backend:**
- `convex/schema.ts` - Add imageUrl field
- `convex/emailIngestion.ts` - Image download/storage
- (new) `convex/images.ts` - Image storage utilities

---

*Spec by Sage 🧠 | 2026-02-09*
