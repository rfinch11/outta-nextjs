# Carousel Pattern Documentation

## Overview

The carousel pattern provides a horizontal scrolling component for displaying featured content on the homepage. It consists of two main components that work together to create an engaging, mobile-friendly browsing experience.

---

## Components

### 1. FeaturedCarousel

**File:** `src/components/FeaturedCarousel.tsx`

**Purpose:** Container component that handles horizontal scrolling, navigation, and layout.

**Features:**
- Horizontal scroll with touch/swipe support
- Desktop navigation arrows (hidden on mobile)
- Keyboard navigation (Arrow Left/Right)
- Smooth scrolling behavior
- Snap-to-item scrolling on mobile
- Auto-hide scrollbar
- Responsive arrow visibility based on scroll position

**Props:**
```typescript
interface FeaturedCarouselProps {
  listings: Listing[];  // Array of listings to display
}
```

**Key Styling:**
- Card width: `300px` (fixed)
- Gap between cards: `16px` (gap-4)
- Scroll behavior: Smooth with snap points
- Navigation scroll amount: `300px` per click

---

### 2. FeaturedCard

**File:** `src/components/FeaturedCard.tsx`

**Purpose:** Individual card component for displaying a single featured item.

**Layout:**
- Vertical stack layout
- Image on top with overlaid chips
- Content below (title, metadata, location)

**Props:**
```typescript
interface FeaturedCardProps {
  airtable_id: string;
  title: string;
  image?: string;
  place_id?: string;
  type: 'Event' | 'Activity' | 'Camp';
  start_date?: string;
  place_type?: string;
  description?: string;
  city: string;
  distance?: number;
  scout_pick?: boolean;
  deal?: boolean;
  promoted?: boolean;
}
```

**Key Dimensions:**
- Card width: `300px` (set by carousel container)
- Image aspect ratio: `3:2` (width:height)
- Image corner radius: `16px` (rounded-2xl)
- Bottom margin after image: `12px` (mb-3)

**Dynamic Content by Type:**
- **Events:** Shows date with calendar icon
- **Activities:** Shows place type with category icon
- **Camps:** Shows description snippet

**Image Handling:**
- Primary: Google Place API photo (if place_id exists)
- Fallback: Supabase image URL
- Error handling with automatic fallback

---

## Usage Example

### Adding a Carousel to Homepage

```tsx
import FeaturedCarousel from '@/components/FeaturedCarousel';

// In your component:
const [carouselListings, setCarouselListings] = useState<Listing[]>([]);

// Fetch data
const fetchCarouselData = async () => {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('featured', true)
    .limit(10);

  if (data) {
    setCarouselListings(data);
  }
};

// Render
{carouselListings.length > 0 && (
  <div className="py-3 bg-malibu-50">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">
        Section Title
      </h2>
      <div className="pl-5">
        <FeaturedCarousel listings={carouselListings} />
      </div>
    </div>
  </div>
)}
```

---

## Current Homepage Implementation

### Featured Events Carousel

**Location:** `src/components/Homepage.tsx` (lines 861-870)

**Data Source:**
- Table: `listings`
- Filter: `featured = true`
- Additional filters: Within 40 miles, future events only
- Sort: By start_date (earliest first)
- Limit: 10 items

**Query Logic:**
```typescript
const { data } = await supabase
  .from('listings')
  .select('*')
  .eq('featured', true)
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);

// Filter by distance and date
const filtered = data
  .map(listing => ({
    ...listing,
    distance: calculateDistance(userLat, userLng, listing.latitude, listing.longitude)
  }))
  .filter(listing => {
    if (listing.distance > 40) return false;
    if (listing.type === 'Event' && listing.start_date) {
      return new Date(listing.start_date) >= new Date();
    }
    return true;
  })
  .sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )
  .slice(0, 10);
```

---

## Creating New Carousels

### Step 1: Add State for Carousel Data

```typescript
const [newCarouselListings, setNewCarouselListings] = useState<Listing[]>([]);
```

### Step 2: Create Fetch Function

```typescript
const fetchNewCarouselData = async () => {
  // Your custom query logic here
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('your_filter', true)
    .limit(10);

  if (data) {
    setNewCarouselListings(data);
  }
};
```

### Step 3: Call Fetch in useEffect

```typescript
useEffect(() => {
  if (userLocation) {
    fetchNewCarouselData();
  }
}, [userLocation]);
```

### Step 4: Add Carousel to Homepage JSX

Insert between the hero section and tab navigation:

```tsx
{/* Your New Carousel Section */}
{!loading && newCarouselListings.length > 0 && (
  <div className="py-3 bg-malibu-50">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">
        Your Section Title
      </h2>
      <div className="pl-5">
        <FeaturedCarousel listings={newCarouselListings} />
      </div>
    </div>
  </div>
)}
```

---

## Design Specifications

### Spacing
- Carousel section vertical padding: `12px` (py-3)
- Section title bottom margin: `24px` (mb-6)
- Left padding for carousel container: `20px` (pl-5)
- Right padding: Handled by carousel scroll (pr-5 on scroll container)

### Typography
- Section heading: `text-xl font-bold text-malibu-950`
- Card title: `text-lg font-bold text-malibu-950`
- Metadata text: `text-sm text-black-600`

### Colors
- Background: `bg-malibu-50` (light blue)
- Text: `text-malibu-950` (dark blue)
- Navigation arrows: White with border (`bg-white border border-gray-200`)

---

## Customization Options

### Adjust Card Width

In `FeaturedCarousel.tsx`, change the card wrapper width:

```tsx
<div className="flex-none snap-start w-[300px]"> {/* Change 300px */}
```

### Adjust Image Aspect Ratio

In `FeaturedCard.tsx`, change the aspect ratio:

```tsx
<div className="relative w-full aspect-[3/2]"> {/* Change 3/2 */}
```

Common ratios:
- `aspect-[3/2]` - Current (300px × 200px)
- `aspect-[16/9]` - Widescreen (300px × 169px)
- `aspect-[4/3]` - Traditional (300px × 225px)
- `aspect-square` - Square (300px × 300px)

### Adjust Scroll Distance

In `FeaturedCarousel.tsx`, change scroll amount:

```tsx
const scrollAmount = direction === 'left' ? -300 : 300; // Change 300
```

### Adjust Gap Between Cards

In `FeaturedCarousel.tsx`, change gap class:

```tsx
<div className="flex gap-4"> {/* Change gap-4 (16px) */}
```

---

## Accessibility

- All images have alt text (listing title)
- Navigation buttons have aria-labels
- Keyboard navigation supported (Arrow Left/Right)
- Smooth scroll behavior for reduced motion users
- Semantic HTML with proper heading hierarchy

---

## Performance Considerations

- Images load via Google Place API or Supabase CDN
- Lazy loading handled by browser (native img element)
- Scroll event listener cleaned up on unmount
- Keyboard listener cleaned up on unmount
- Limited to 10 items per carousel for performance

---

## Mobile Behavior

- Touch/swipe scrolling enabled
- Snap-to-item on scroll
- Navigation arrows hidden (mobile users swipe)
- Full-width scrollable area with hidden scrollbar
- Cards maintain 300px width on all screen sizes

---

## Desktop Behavior

- Arrow navigation appears on hover/scroll
- Keyboard shortcuts (Arrow Left/Right)
- Smooth animated scrolling
- Mouse wheel horizontal scroll supported

---

## Future Enhancements

Potential improvements to consider:

1. **Auto-scroll:** Add timer-based auto-advance
2. **Indicators:** Add dots/pills showing position in carousel
3. **Lazy loading:** Implement intersection observer for off-screen cards
4. **Variable width:** Support different card sizes
5. **Infinite scroll:** Loop back to start when reaching end
6. **Touch gestures:** Add swipe velocity detection

---

## Related Components

- **VenuesCarousel** - Similar pattern for venue sources
- **VenueCard** - Card variant for venues (logo-based)
- **ClickableCard** - List-view card variant (horizontal layout)

---

## Version History

- **v1.0** (Dec 2024) - Initial implementation with 4:3 aspect ratio
- **v1.1** (Jan 2026) - Reduced image height to 3:2 aspect ratio for vertical space optimization

---

**Last Updated:** January 2026
