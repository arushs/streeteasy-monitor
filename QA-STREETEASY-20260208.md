# QA Report: StreetEasy Monitor

**Date:** 2026-02-08  
**Tester:** Shuri 🔬  
**Environment:** https://streeteasy-monitor.pages.dev

---

## Summary

| Category | Pass | Fail | Blocked |
|----------|------|------|---------|
| Landing/Load | 1 | 0 | 0 |
| Dashboard | 1 | 0 | 0 |
| Listing Cards | 1 | 1 | 0 |
| Filters | 1 | 0 | 1 |
| Kanban Actions | 0 | 1 | 0 |
| Mobile Responsive | 1 | 0 | 0 |
| Console Errors | 1 | 0 | 0 |
| **Total** | **6** | **2** | **1** |

---

## Test Results

### 1. Landing/Load
**Steps:**
1. Navigate to https://streeteasy-monitor.pages.dev

**Expected:** App loads, displays listings  
**Actual:** App loads successfully, shows 39 listings in "New" column  
**Status:** ✅ PASS

---

### 2. Dashboard Layout
**Steps:**
1. Observe Kanban board structure

**Expected:** Multi-column Kanban with labeled stages  
**Actual:** 6 columns displayed:
- ✨ New (39)
- 💜 Interested (0)
- 📧 Contacted (0)
- 🏠 Touring (0)
- 📝 Applied (0)
- 👋 Pass (0)

**Status:** ✅ PASS

---

### 3. Listing Cards
**Steps:**
1. Review listing card content

**Expected:** Each card shows price, address, bedrooms, neighborhood, StreetEasy link, Move action  
**Actual:** Cards display correctly with:
- Price (e.g., $5,700/mo)
- Address
- Bedroom count
- Neighborhood with 📍 icon
- "View on StreetEasy →" link (working external links)
- "Move ▾" dropdown button

**Status:** ✅ PASS (with observations)

**Observations:**
- Some listings show truncated addresses (e.g., "#2703Z" instead of full address)
- Some listings missing neighborhood indicator (e.g., Williamsburg listings at 224 North 7th)

---

### 4. Area Filter
**Steps:**
1. Select "Chelsea" from area dropdown

**Expected:** Listings filtered to Chelsea only  
**Actual:** Listings filtered from 39 to 3, showing only Chelsea listings  
**Status:** ✅ PASS

**Available areas:**
- All areas, Chelsea, DUMBO, Downtown Brooklyn, East Williamsburg, Fort Greene, Gramercy Park, Greenwich Village, Tribeca, West Chelsea, West Village, Williamsburg

---

### 5. Sort Filter
**Steps:**
1. Change sort dropdown from "Newest" to "Price ↓"

**Expected:** Listings reorder by price descending  
**Actual:** Could not complete test - browser control timeout  
**Status:** ⚠️ BLOCKED

---

### 6. Price Filter
**Steps:**
1. Enter max price value in "$ Max price" field

**Expected:** Listings filtered by price  
**Actual:** Could not complete test - browser control timeout  
**Status:** ⚠️ BLOCKED (grouped with sort)

---

### 7. Move Listing Action
**Steps:**
1. Click "Move ▾" on first listing
2. Select "👋 Pass" from dropdown

**Expected:** Listing moves to Pass column, counters update  
**Actual:** 
- Dropdown opens correctly with all 5 destination options
- Clicking "Pass" closes the dropdown
- Listing does NOT move - New still shows 39, Pass still shows 0

**Status:** ❌ FAIL

---

### 8. Mobile Responsiveness (375px)
**Steps:**
1. Resize viewport to 375x812 (iPhone SE)

**Expected:** Layout adapts for mobile  
**Actual:** 
- Header wraps appropriately ("StreetEasy Monitor" on two lines)
- Filter controls remain usable
- Kanban becomes single-column scroll
- Listing cards readable and touch-friendly

**Status:** ✅ PASS

---

### 9. Console Errors
**Steps:**
1. Check browser console for errors

**Expected:** No errors  
**Actual:** Console clean, no JavaScript errors  
**Status:** ✅ PASS

---

## Bugs Found

### BUG-001: Move Action Not Persisting
- **Severity:** 🔴 Critical
- **Steps to reproduce:**
  1. Navigate to https://streeteasy-monitor.pages.dev
  2. Click "Move ▾" on any listing
  3. Select any destination (e.g., "Pass", "Interested")
  4. Observe the board
- **Expected:** Listing moves to selected column, counters update
- **Actual:** Dropdown closes but listing remains in "New" column. Counter unchanged.
- **Impact:** Core functionality broken - users cannot track/organize listings
- **Notes:** This is the primary use case of the app. May be a missing API call, localStorage issue, or backend connectivity problem.

### BUG-002: Truncated Addresses on Some Listings
- **Severity:** 🟡 Medium
- **Steps to reproduce:**
  1. Scroll through listings
  2. Observe addresses like "#2703Z", "#245", "#317", "#5E", "#3B", "#701", "#1202", "#801", "#213"
- **Expected:** Full address (e.g., "20 Rockwell Place #2703Z")
- **Actual:** Only unit number shown (e.g., "#2703Z")
- **Impact:** Users cannot identify building without clicking through to StreetEasy
- **Notes:** Appears to be a data formatting/display issue. Some listings have full addresses, others only show unit.

### BUG-003: Missing Neighborhood on Some Listings
- **Severity:** 🟢 Low  
- **Steps to reproduce:**
  1. Scroll to listings like "224 North 7th Street #303" or "177 North Seventh Street #2B"
  2. Observe missing "📍 [Neighborhood]" indicator
- **Expected:** All listings show neighborhood
- **Actual:** Several Williamsburg listings missing the 📍 indicator
- **Impact:** Minor - users can infer from address, but inconsistent UX

---

## Screenshots

### Desktop View (1200px)
![Desktop](/Users/arushshankar/.openclaw/media/browser/e9a39bab-6fbf-441f-8dc6-35e06ad01ff6.png)

### Mobile View (375px)
![Mobile](/Users/arushshankar/.openclaw/media/browser/2e479867-98d3-41ab-a550-97e2053402da.png)

---

## Recommendations

1. **P0 - Fix Move Action:** Investigate why listings don't move between columns. Check:
   - Is there an API call being made?
   - localStorage persistence?
   - State management issue?
   
2. **P1 - Full Address Display:** Ensure all listings show complete street address, not just unit number

3. **P2 - Consistent Neighborhood:** Add neighborhood to all listings for consistent UX

4. **P3 - Empty State UX:** Consider adding onboarding hint when all columns except "New" are empty (e.g., "Move listings here to track your favorites!")

---

## Environment Notes
- Tested with OpenClaw browser automation
- Some browser control timeouts encountered during testing (sort/price filter tests blocked)
- No authentication required - app appears to be public/read-only demo

---

**Overall Assessment:** App loads well, looks clean, mobile responsive. However, the **critical Move functionality appears broken**, rendering the core Kanban tracking feature unusable. Recommend prioritizing BUG-001 fix before production use.

---
*QA Report by Shuri 🔬 - "If a user can't do it in a browser, it's not tested."*
