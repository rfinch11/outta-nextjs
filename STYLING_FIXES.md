# Styling Fixes - Matching Original Site

**Date:** November 22, 2025
**Status:** 🔄 In Progress
**Goal:** Make Next.js site match original outta.events site exactly before production cutover

---

## ✅ Completed Fixes

### 1. Font System
- **Fixed:** Changed from Geist to Space Grotesk (Google Fonts)
- **Files:** `src/app/layout.tsx`, `src/app/globals.css`
- **Weights:** 400, 600, 700

### 2. Hero Section
- **Fixed:** Changed from center-aligned to left-aligned
- **Fixed:** Added hero.png graphic (kid-friendly adventures)
- **Fixed:** Removed zip code text below hero
- **File:** `src/components/Homepage.tsx`

### 3. Tab Navigation
- **Fixed:** Labels changed to "Events/Activities/Camps"
- **Fixed:** Inactive tab color to #BDBDBD (exact match)
- **Fixed:** Border color to #E0E0E0
- **Fixed:** Padding to py-[14px] (14px exact)
- **Fixed:** Font size to text-lg (18px)
- **File:** `src/components/Homepage.tsx`

### 4. Image Loading
- **Fixed:** Added remotePatterns to next.config.ts
- **Fixed:** Configured for http/https with wildcard hostnames
- **File:** `next.config.ts`
- **Result:** Event card images now display properly

### 5. Search Modal
- **Fixed:** Replaced emoji magnifying glass with LuSearch icon
- **Fixed:** Button stays yellow (bg-outta-yellow)
- **Fixed:** Removed focus border color change on input
- **File:** `src/components/SearchModal.tsx`

### 6. Filter Modal - Complete Redesign ✅
- **Fixed:** Removed search input from modal
- **Fixed:** Selected buttons use orange border (border-outta-orange)
- **Fixed:** Unselected buttons use white background with transparent border
- **Fixed:** Save button matches yellow design with black border and shadow
- **Fixed:** Rating options now include: Any, 3+ Stars, 4+ Stars, 4.5+ Stars
- **Fixed:** Range slider thumb uses orange color (#FF7E08)
- **Fixed:** Type and Tags buttons follow same orange border pattern
- **File:** `src/components/FilterModal.tsx`

---

## 🔍 Areas Still to Review

### Potential Differences to Check:
1. **Card Styling** - Compare ClickableCard component with original
2. **Event Detail Page** - Review EventDetail component styling
3. **Footer** - Verify footer matches original
4. **Spacing/Padding** - Check if margins and padding match throughout
5. **Colors** - Verify all brand colors are consistent:
   - Yellow: #FFF407
   - Orange: #FF7E08
   - Blue: #E3F2FD
   - Green: #3DD68C
   - Dark: #37474F
6. **Hover States** - Check button hover effects match
7. **Responsive Design** - Test on mobile/tablet to match original
8. **Typography** - Verify all font sizes, weights match
9. **Shadows** - Check if drop shadows match original design
10. **Border Radius** - Verify rounded corners match

---

## Design System Colors (Reference)

```css
--outta-yellow: #FFF407
--outta-orange: #FF7E08
--outta-blue: #E3F2FD
--outta-green: #3DD68C
--outta-dark: #37474F
```

---

## Next Steps

When you return, we should:
1. Compare more sections side-by-side with original site
2. Check the event cards styling
3. Review the event detail page
4. Test responsive design on different screen sizes
5. Continue fixing any visual differences found

**Remember:** We're not moving to production (Phase 5) until the Next.js site perfectly matches the original site!

---

## Resources

- **Next.js Site:** https://outta-nextjs.vercel.app
- **Original Site:** https://outta.events
- **GitHub Repo:** https://github.com/rfinch11/outta-nextjs
- **Design Assets:** `/Users/ryanfinch/outta-components/`
