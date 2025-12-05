# Chip Components Documentation

## Overview

The Chip component system provides 6 distinct badge variants for labeling and highlighting content throughout the Outta application. Each chip has a specific purpose and visual style aligned with the design system color scales.

## Component Location

**File:** `src/components/Chip.tsx`

## Available Variants

### 1. Scout Pick (`scoutpick`)

**Purpose:** Editor-curated recommendations and featured picks

**Visual Style:**
- Background: Lavender Magenta 100 (#FDE7FF)
- Border: Lavender Magenta 900 (#781771)
- Icon: Verified checkmark (VscVerified)
- Text Color: Lavender Magenta 900

**Usage:**
```tsx
<Chip variant="scoutpick" />
<Chip variant="scoutpick" label="Editor's Choice" />
```

**Use Cases:**
- Manually curated events by Outta team
- High-quality verified listings
- Featured recommendations

---

### 2. Deal (`deal`)

**Purpose:** Special offers, discounts, and promotional pricing

**Visual Style:**
- Background: Emerald 100 (#DFF9EA)
- Border: Emerald 900 (#194E31)
- Icon: Tag (LuTag)
- Text Color: Emerald 900

**Usage:**
```tsx
<Chip variant="deal" />
<Chip variant="deal" label="50% Off" />
<Chip variant="deal" label="Free Entry" />
```

**Use Cases:**
- Discounted tickets
- Free events
- Limited-time offers
- Early bird pricing

---

### 3. Promoted (`promoted`)

**Purpose:** Sponsored or promoted content

**Visual Style:**
- Background: Malibu 100 (#DFF2FF)
- Border: Malibu 900 (#084C72)
- Icon: Megaphone (PiMegaphoneBold)
- Text Color: Malibu 900

**Usage:**
```tsx
<Chip variant="promoted" />
<Chip variant="promoted" label="Sponsored" />
```

**Use Cases:**
- Paid promotional listings
- Partner event highlights
- Featured venue advertisements

---

### 4. New (`new`)

**Purpose:** Recently added listings

**Visual Style:**
- Background: Broom 50 (#FDFEE8)
- Border: Broom 800 (#88610B)
- Icon: None
- Text Color: Broom 800

**Usage:**
```tsx
<Chip variant="new" />
<Chip variant="new" label="Just Added" />
```

**Use Cases:**
- Listings added within last 7 days
- Fresh content highlights
- Recently updated events

---

### 5. Coming Soon (`comingsoon`)

**Purpose:** Future or upcoming listings not yet available

**Visual Style:**
- Background: Black 100 (#E7E7E7)
- Border: Black 800 (#454545)
- Icon: None
- Text Color: Black 800

**Usage:**
```tsx
<Chip variant="comingsoon" />
<Chip variant="comingsoon" label="Opens Next Month" />
```

**Use Cases:**
- Events with registration not yet open
- Upcoming seasonal activities
- Pre-announced camps

---

### 6. Top Rated (`toprated`)

**Purpose:** Highly-rated content based on user reviews

**Visual Style:**
- Background: Flamenco 100 (#FFF0D4)
- Border: Flamenco 900 (#7F340F)
- Icon: Trophy (PiTrophyBold)
- Text Color: Flamenco 900

**Usage:**
```tsx
<Chip variant="toprated" />
<Chip variant="toprated" label="4.8★ Rating" />
```

**Use Cases:**
- Events with 4+ star ratings
- Highly reviewed activities
- Award-winning venues

---

## Props API

### ChipProps

```typescript
interface ChipProps {
  variant: ChipVariant;
  label?: string;
  className?: string;
}

type ChipVariant = 'scoutpick' | 'deal' | 'promoted' | 'new' | 'comingsoon' | 'toprated';
```

**Props:**

- **variant** (required): The chip style/type to display
- **label** (optional): Custom text to display. If not provided, uses default label for the variant
- **className** (optional): Additional CSS classes for customization

---

## Default Labels

Each variant has a default label that displays when no custom label is provided:

| Variant | Default Label |
|---------|--------------|
| scoutpick | "Scout Pick" |
| deal | "Deal" |
| promoted | "Promoted" |
| new | "New" |
| comingsoon | "Coming Soon" |
| toprated | "Top Rated" |

---

## Layout Specifications

All chips share the same layout properties:

```css
display: inline-flex;
padding: 2px 5px;
justify-content: center;
align-items: center;
gap: 2px;
border-radius: 8px;
border: 1px solid [variant-border-color];
background: [variant-background-color];
```

**Typography:**
- Font size: 11px
- Font weight: 600 (semibold)
- Line height: none (leading-none)

**Icon Size:** 12px

---

## Implementation Examples

### In ClickableCard Component

```tsx
import Chip from './Chip';

// Scout Pick event
{listing.is_scout_pick && (
  <Chip variant="scoutpick" />
)}

// Deal event
{listing.has_discount && (
  <Chip variant="deal" label={`${listing.discount_percentage}% Off`} />
)}

// Top rated event
{listing.rating >= 4.5 && (
  <Chip variant="toprated" />
)}
```

### Multiple Chips

```tsx
<div className="flex gap-1">
  <Chip variant="new" />
  <Chip variant="toprated" />
  <Chip variant="deal" label="Free" />
</div>
```

### In EventDetail Component

```tsx
<div className="flex flex-wrap gap-2 mb-4">
  {event.is_promoted && <Chip variant="promoted" />}
  {event.is_coming_soon && <Chip variant="comingsoon" />}
  {event.rating >= 4 && <Chip variant="toprated" label={`${event.rating}★`} />}
</div>
```

---

## Future Implementation Considerations

### Database Schema Changes

To support these chips, consider adding these boolean fields to the `listings` table:

```sql
ALTER TABLE listings ADD COLUMN is_scout_pick BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN is_promoted BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN has_discount BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN discount_percentage INTEGER;
ALTER TABLE listings ADD COLUMN is_new BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN is_coming_soon BOOLEAN DEFAULT FALSE;
```

### Automatic "New" Badge Logic

```tsx
const isNew = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreated <= 7;
};
```

### Automatic "Top Rated" Logic

```tsx
const isTopRated = (rating: number | null) => {
  return rating !== null && rating >= 4.0;
};
```

### Priority Order

When displaying multiple chips, use this priority order:

1. Scout Pick (highest priority)
2. Promoted
3. Top Rated
4. Deal
5. New
6. Coming Soon

```tsx
const getChipsToDisplay = (listing) => {
  const chips = [];
  if (listing.is_scout_pick) chips.push(<Chip variant="scoutpick" />);
  if (listing.is_promoted) chips.push(<Chip variant="promoted" />);
  if (listing.rating >= 4) chips.push(<Chip variant="toprated" />);
  if (listing.has_discount) chips.push(<Chip variant="deal" />);
  if (isNew(listing.created_at)) chips.push(<Chip variant="new" />);
  if (listing.is_coming_soon) chips.push(<Chip variant="comingsoon" />);

  // Limit to 3 chips max to avoid clutter
  return chips.slice(0, 3);
};
```

---

## Design System Integration

All chip colors are integrated with the Outta design system:

- **Broom** (Yellow/Brown): New listings
- **Flamenco** (Orange): Top rated content
- **Lavender Magenta** (Purple): Scout picks
- **Emerald** (Green): Deals and discounts
- **Malibu** (Blue): Promoted content
- **Black** (Grayscale): Coming soon

Colors are defined in `src/app/globals.css` and use Tailwind utility classes.

---

## Accessibility

- All chips use semantic HTML (`<span>`)
- Text labels provide context for screen readers
- Color is not the only indicator (icons and text provide redundancy)
- Sufficient color contrast ratios between background and border

---

## Testing

### Visual Testing Checklist

- [ ] All 6 variants render correctly
- [ ] Icons display at correct size (12px)
- [ ] Custom labels override defaults
- [ ] Chips align properly in flex containers
- [ ] Border radius is consistent (8px)
- [ ] Colors match design system specifications

### Component Testing

```tsx
// Example test cases
<Chip variant="scoutpick" /> // Should show verified icon + "Scout Pick"
<Chip variant="deal" label="50% Off" /> // Should show tag icon + "50% Off"
<Chip variant="new" /> // Should show "New" without icon
```

---

## Related Components

- **ClickableCard**: Display chips on event/activity cards
- **EventDetail**: Show chips in event detail headers
- **FilterModal**: Potential filter by chip types

---

## Version History

- **v1.0** (2025-12-04): Initial implementation with 6 chip variants
