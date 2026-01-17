# Hero Section Implementation Plan

## Overview
Add a hero banner to the Homepage displaying a dynamic count of family-friendly activities near the user's detected city. The banner appears below the header and above the featured carousel.

## User Requirements

### Display Format
- **Text**: "XX family friendly activities near [city name]"
- **Count (XX)**: Dynamic database query result
  - Events with start_date >= today within 50 miles
  - All Activities within 50 miles
  - All Camps within 50 miles
- **City Name**: Detected from user's location (clickable to update)

### Fallback Behavior
- **No location**: "Hundreds of family friendly activities near you"
- **Zero results**: Show "Request Outta in your city" button (mailto:rfinch@outta.events)
- **No city name**: Use "you" instead of city

### User Interactions
- **City click**: Opens LocationModal to update location
- **Request button**: Opens email client pre-filled to rfinch@outta.events

### Design Specifications
- **Style**: Full-width banner with centered text
- **Background**: bg-malibu-50 (matches page)
- **Count behavior**: Static on page load (doesn't update with filters)

## Technical Implementation

### 1. Update Location State to Include City Name

**File**: `src/components/Homepage.tsx`

**Current State** (lines 53-57):
```typescript
const [userLocation, setUserLocation] = useState<{
  lat: number;
  lng: number;
  zipCode: string;
} | null>(null);
```

**Updated State**:
```typescript
const [userLocation, setUserLocation] = useState<{
  lat: number;
  lng: number;
  zipCode: string;
  city?: string;  // NEW: Optional city field
} | null>(null);
```

**Update Points**:
1. `saveLocation` function (lines 105-109): Add city parameter
2. Browser geolocation handler (lines 157-162): Extract city from Nominatim
3. IP geolocation handler (lines 117-128): Extract city from ipapi.co
4. LocationModal callback (line 1253): Pass city to saveLocation

### 2. Extract City Name During Location Detection

**Browser Geolocation** (lines 150-178):
```typescript
const data = await response.json();
const zipCode = data.address?.postcode || 'Unknown';
const city = data.address?.city || data.address?.town || null;
saveLocation(lat, lng, zipCode, city);
```

**IP Geolocation** (lines 112-133):
```typescript
const city = data.city || null;
saveLocation(lat, lng, zipCode, city);
```

### 3. Add Count Calculation Helper Function

**Location**: After line 102 in `Homepage.tsx`

```typescript
const calculateHeroCount = useCallback((): number => {
  if (!allListings.length || !userLocation) return 0;

  const now = new Date();
  const MAX_DISTANCE = 50; // miles

  return allListings.filter((listing) => {
    // Must have valid location
    if (!listing.latitude || !listing.longitude) return false;

    // Must be Event, Activity, or Camp
    if (!['Event', 'Activity', 'Camp'].includes(listing.type)) return false;

    // Must be within 50 miles
    if ((listing.distance || 0) > MAX_DISTANCE) return false;

    // Events must have future start_date
    if (listing.type === 'Event') {
      if (!listing.start_date) return false;
      return new Date(listing.start_date) >= now;
    }

    // Activities and Camps always count (no date filter)
    return true;
  }).length;
}, [allListings, userLocation]);
```

**Why This Approach**:
- Reuses existing `allListings` state (no additional DB queries)
- Uses same distance calculations as main listings
- Follows existing event filtering logic
- Optimal performance (calculated after listings load)

### 4. Insert Hero Section JSX

**Location**: Line 1059 (after header, before featured carousel)

```tsx
{/* Hero Section - Activity Count Banner */}
{!loading && userLocation && (
  <div className="py-6 bg-malibu-50">
    <div className="max-w-7xl mx-auto px-5">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-malibu-950">
          {(() => {
            const count = calculateHeroCount();

            // Zero count case
            if (count === 0) {
              return (
                <div className="space-y-4">
                  <p className="text-2xl md:text-3xl">
                    No activities found near {userLocation.city || 'you'}
                  </p>
                  <a
                    href="mailto:rfinch@outta.events?subject=Request Outta in my city"
                    className="inline-block px-6 py-3 bg-broom-400 border-2 border-malibu-950 rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#06304b] hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5 text-malibu-950 no-underline"
                  >
                    Request Outta in your city
                  </a>
                </div>
              );
            }

            // Normal case with count
            const displayCount = userLocation.city ? count : 'Hundreds of';
            return (
              <>
                {displayCount} family friendly activities near{' '}
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="underline cursor-pointer bg-transparent border-none text-malibu-950 font-bold hover:text-malibu-700 transition-colors"
                >
                  {userLocation.city || 'you'}
                </button>
              </>
            );
          })()}
        </h1>
      </div>
    </div>
  </div>
)}
```

**Design Details**:
- Container: `max-w-7xl mx-auto px-5` (standard pattern)
- Background: `bg-malibu-50` (page background)
- Padding: `py-6` (more than carousel py-3)
- Typography: `text-3xl md:text-4xl font-bold`
- Button: Matches "Load more" offset shadow style
- Conditional: Only shows when location detected and not loading

### 5. Update LocationModal to Extract City

**File**: `src/components/LocationModal.tsx`

**Update Props Interface** (line 10):
```typescript
onLocationSet: (lat: number, lng: number, zipCode: string, city?: string) => void;
```

**Extract City from Zip Code Geocoding** (lines 37-59):
```typescript
const data = await response.json();
if (data && data.length > 0) {
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);

  // Reverse geocode to get city
  const reverseResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const reverseData = await reverseResponse.json();
  const city = reverseData.address?.city || reverseData.address?.town || undefined;

  onLocationSet(lat, lng, zipCode, city);
}
```

**Extract City from Browser Location** (lines 68-87):
```typescript
const data = await response.json();
const zipCode = data.address?.postcode || 'Unknown';
const city = data.address?.city || data.address?.town || undefined;
onLocationSet(lat, lng, zipCode, city);
```

## State Management

**No New State Required**:
- Count: Calculated on-the-fly via helper function
- City: Stored in existing `userLocation` object
- Modal: Reuses existing `showLocationModal` state

**Updated State**:
- `userLocation`: Add optional `city` field
- LocalStorage: Automatically persists city

## Fallback Scenarios

| Scenario | Hero Display |
|----------|-------------|
| No location detected | Hero doesn't render |
| Location, no city | "Hundreds of family friendly activities near **you**" |
| Location + city, zero count | "No activities found near [city]" + Request button |
| Location + city, has count | "[count] family friendly activities near [city]" |

## Performance Considerations

**Count Calculation**:
- Triggers: When `allListings` or `userLocation` changes
- Frequency: 1-2 times per page load
- Cost: O(n) filter over ~500-2000 items
- No additional API calls

**Network Requests**:
- No new API calls (reuses Nominatim/ipapi)
- City extraction piggybacks on existing location detection

## Implementation Sequence

### Phase 1: Location State Enhancement
1. Update `userLocation` type definition
2. Update `saveLocation` function signature
3. Extract city from browser geolocation
4. Extract city from IP geolocation

### Phase 2: LocationModal Updates
1. Update props interface
2. Add city extraction to zip code geocoding
3. Add city extraction to browser location
4. Update callback to Homepage

### Phase 3: Hero Section
1. Add `calculateHeroCount` helper function
2. Insert hero JSX after header
3. Implement fallback states
4. Style button to match design system

### Phase 4: Testing
1. Test location detection with/without city
2. Test zero count scenario
3. Verify city click opens modal
4. Check mobile responsiveness
5. Test email button functionality

## Critical Files to Modify

### Homepage.tsx
- Lines 53-57: Update userLocation state type
- Lines 105-109: Update saveLocation function
- Lines 117-128: Extract city from IP geolocation
- Lines 157-162: Extract city from browser geolocation
- After line 102: Add calculateHeroCount helper
- After line 1059: Insert hero section JSX
- Line 1253: Update LocationModal callback

### LocationModal.tsx
- Line 10: Update LocationModalProps interface
- Lines 37-59: Add city extraction to zip geocoding
- Lines 68-87: Add city extraction to browser location

## Design System Consistency

- **Colors**: `bg-malibu-50`, `text-malibu-950`, `bg-broom-400`
- **Container**: `max-w-7xl mx-auto px-5`
- **Button Style**: Offset shadow effect matching existing buttons
- **Typography**: Hero-sized text with responsive breakpoints
- **Responsive**: Mobile-first with `md:` breakpoint

## Risk Assessment

**Low Risk**:
- Location detection already working reliably
- Filtering logic already battle-tested
- All changes are additive (no breaking changes)
- No database schema changes needed

**Mitigation Strategies**:
- City extraction failures → fallback to "you"
- Zero count in rural areas → dedicated UI with request button
- No location → hero doesn't render (graceful)

---

**Status**: Planning Complete - Ready for Implementation

**Created**: January 2026
