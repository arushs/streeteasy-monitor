# Design Polish Review - StreetYeet Swipe UI
**Reviewer:** Dieter 📐  
**Date:** 2026-02-09  
**Status:** PRELIMINARY (awaiting Parker's full-screen layout)

---

## Executive Summary

Parker's `[P0] Full-Screen Swipe Cards` task is still in inbox. I've reviewed the **current code** against the spec to identify design gaps and prepare recommendations. Once the layout work is complete, this review should be finalized.

---

## Current State Assessment

### ✅ What's Working Well

1. **Animation Foundation** - framer-motion with spring physics (`stiffness: 300, damping: 25`)
2. **Swipe Overlays** - SKIP/SAVE/CONTACT overlays exist with opacity transforms
3. **Undo History** - Nice UX pattern, well-implemented
4. **Filter Panel** - AnimatePresence for smooth open/close
5. **Time Badge** - Already has `backdrop-blur-sm` (proto-glassmorphic)
6. **Gradient Placeholders** - Neighborhood-based color gradients for missing images

### ❌ Issues to Fix (After Parker's Layout)

#### 1. Typography (Per Spec)

| Element | Current | Spec Target | Fix |
|---------|---------|-------------|-----|
| Price | `text-3xl` (~30px) | 32-40px bold, white with shadow | ✅ Close, needs shadow when overlaid |
| Address | `text-lg` (~18px) | 18-24px semibold | ✅ Good |
| Details | `text-sm` (~14px) | 14-16px medium | ✅ Good |

**Recommendation:** When price moves to image overlay:
```css
text-shadow: 0 2px 8px rgba(0,0,0,0.4);
```

#### 2. Swipe Overlay Colors

| Current | Spec | Issue |
|---------|------|-------|
| `bg-red-500/80` | Red with 60% opacity | ⚠️ 80% is too opaque |
| `bg-emerald-500/80` | Green with 60% opacity | ⚠️ 80% is too opaque |
| `bg-blue-500/80` | (contact) | Same issue |

**Fix:**
```tsx
bg-red-500/60    // Skip
bg-emerald-500/60  // Save  
bg-blue-500/60   // Contact
```

#### 3. Badges Need Glassmorphism

Current "No Fee" badge:
```tsx
className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white shadow-lg"
```

**Should be glassmorphic:**
```tsx
className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white shadow-lg backdrop-blur-md border border-white/30"
```

#### 4. Card Shadow Depth

Current: `shadow-xl` (standard Tailwind)

Spec calls for: "Large, soft shadow (0 25px 50px rgba(0,0,0,0.15))"

**Fix - add custom class or inline style:**
```css
.swipe-card {
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}
```

#### 5. Card Entry Animation

Current:
```tsx
initial={{ opacity: 0, scale: 0.8, y: 50 }}
```

Good start! The scale-up from 0.8 creates a nice "pop" effect.

#### 6. Missing: Gradient Overlay for Text Readability

When images display with price/address overlaid, need bottom gradient:

```tsx
{/* Add inside image container */}
<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
```

---

## Mobile Responsiveness Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| Touch targets 44px+ | ✅ | Action buttons are `h-16 w-16` (64px) |
| Full viewport usage | ❌ | Blocked by `max-w-lg`, `h-64` (Parker's task) |
| Swipe gesture feel | ✅ | Good threshold (100px), velocity detection |
| Safe area handling | ⚠️ | No explicit `env(safe-area-inset-*)` |

**Safe area fix for notched phones:**
```tsx
<main className="pb-[env(safe-area-inset-bottom)]">
```

---

## Animation Polish Recommendations

### Current Spring Config
```tsx
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

This feels snappy but slightly mechanical. For a more "premium" feel:

```tsx
// Option A: Slightly bouncier
transition={{ type: "spring", stiffness: 250, damping: 20 }}

// Option B: Smoother, more luxurious
transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.8 }}
```

### Exit Animation
```tsx
exitVariants = {
  left: { x: -400, opacity: 0, transition: { duration: 0.3 } },
```

Consider using spring for exits too (more satisfying):
```tsx
left: { x: -500, rotate: -15, opacity: 0, transition: { type: "spring", stiffness: 200, damping: 25 } },
```

---

## Color Palette Consistency

### Current Colors Used

| Purpose | Color | Notes |
|---------|-------|-------|
| Primary | `indigo-600` | Buttons, active states |
| Success/Save | `emerald-500` | Save overlay, No Fee badge |
| Danger/Skip | `red-500` | Skip overlay |
| Contact | `blue-500` | Contact overlay |
| Neutral | `gray-*` | Text, backgrounds |

**Issue:** The "Contact" action uses blue, but the action button uses a star (⭐). This is confusing:
- Star suggests "favorite/save"
- Blue suggests "message/contact"
- Swipe up = contact (opens StreetEasy)
- But middle button is blue with star?

**Recommendation:** Fix button icons to match gestures:
```tsx
{/* Skip */} ✕ or 👎
{/* Contact (up) */} 📧 or ✉️ (not ⭐)
{/* Save (right) */} ❤️ or ⭐
```

---

## Priority Fixes (When Parker Completes Layout)

### P0 - Critical
1. Reduce overlay opacity to 60%
2. Add gradient overlay for text on images
3. Fix button icon confusion (⭐ → 📧)

### P1 - High Value
4. Glassmorphic badges (`backdrop-blur-md`, `bg-white/20`)
5. Custom card shadow for depth
6. Safe area insets for notched phones

### P2 - Polish
7. Tune spring physics (slightly softer)
8. Add text shadows for overlaid typography
9. Spring-based exit animations

---

## Sign-Off

**Status:** BLOCKED - Cannot fully approve until full-screen layout is implemented.

Once Parker's task is complete:
1. Re-run visual audit on mobile viewport
2. Verify image-first proportions (70% image / 20% info / 10% hints)
3. Test swipe feel on actual device
4. Final sign-off or specific CSS fixes

---

*Review prepared by Dieter 📐 | 2026-02-09*
