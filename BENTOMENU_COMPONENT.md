# BentoMenu Component Documentation

## Overview

The BentoMenu is a comprehensive navigation menu component that provides quick access to key actions on the Homepage. It replaces the previous inline action buttons with a single menu button that opens a popover containing all quick actions.

## Components

### BentoMenu.tsx
Main wrapper component that manages the menu trigger button and popover state.

### BentoMenuPopover.tsx
The popover content component with three distinct modes:
1. **Grid Mode** - 2x2 grid of main action buttons
2. **Search Mode** - Search input interface
3. **Location Mode** - Location setting interface

## Features

### Grid Mode (Default)
Displays four primary action buttons in a 2x2 grid layout:

1. **Set location** (Yellow/Broom)
   - Opens location mode within the popover
   - Allows users to set their location via browser geolocation or zip code

2. **Search events** (Orange/Flamenco)
   - Opens search mode within the popover
   - Provides search input for finding events

3. **Submit event** (Pink/Lavender-Magenta)
   - Opens the SubmitModal (Airtable form)
   - Allows users to submit new events

4. **Become a Scout** (Green/Emerald)
   - Opens mailto link to rfinch@outta.events
   - Subject line: "Become a Scout"

**More Options Section:**
- **Sign in** - Currently disabled
- **Partner with Outta** - Opens mailto link with subject "Partner with Outta"

### Search Mode
When "Search events" is clicked, the popover transforms to show:
- Back button to return to grid mode
- Search input field with placeholder "Find something amazing"
- Clear button (appears when text is entered)
- Submit button to execute search
- Closes popover and applies search filter when submitted

### Location Mode
When "Set location" is clicked, the popover transforms to show:
- Back button to return to grid mode
- "Use my location" button (requests browser geolocation)
- "or" divider
- Zip code input field
- Submit button to set location
- Closes popover and saves location when submitted

## Styling

### Menu Button
- Size: `w-9 h-9` (36px × 36px)
- Shape: `rounded-full` (circle)
- Icon: LuLayoutGrid at 17px
- States:
  - Default: `bg-transparent hover:bg-gray-100`
  - Active (menu open): `bg-malibu-50`

### Popover Container
- Position: `absolute top-full right-0 mt-3`
- Background: `bg-white`
- Border: `rounded-xl border border-gray-200`
- Shadow: `shadow-lg`
- Z-index: `z-50`
- Width: `min-w-[280px] max-w-[320px]`

### Grid Action Buttons
- Layout: `grid grid-cols-2 gap-3 p-4`
- Button styling:
  - Padding: `p-6`
  - Border radius: `rounded-3xl`
  - Border: `border border-malibu-950` (1px stroke)
  - Shadow: `shadow-[2px_2px_0_0_#06304b]` (offset shadow effect)
  - Hover: Shadow reduces to 1px and button translates slightly
- Icon size: `24px`
- Text: `text-sm font-semibold text-malibu-950`

### Color Mapping
- **Set location**: `bg-broom-400` (vibrant yellow)
- **Search events**: `bg-flamenco-500` (vibrant orange)
- **Submit event**: `bg-lavender-magenta-300` (vibrant pink)
- **Become a Scout**: `bg-emerald-500` (vibrant green)

## Props Interface

### BentoMenu
```typescript
interface BentoMenuProps {
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  onSubmitClick: () => void;
  onSearch: (query: string) => void;
  className?: string;
}
```

### BentoMenuPopover
```typescript
interface BentoMenuPopoverProps {
  onSearchClick: () => void;
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  onSubmitClick: () => void;
  onSearch: (query: string) => void;
  onClose: () => void;
}
```

## Usage

### Homepage Integration
```tsx
<BentoMenu
  onLocationSet={saveLocation}
  onSubmitClick={() => setShowSubmitModal(true)}
  onSearch={(query) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
  }}
/>
```

## State Management

### BentoMenu State
- `isOpen`: boolean - Controls popover visibility
- Click-outside detection via refs and useEffect
- Escape key handler to close popover

### BentoMenuPopover State
- `mode`: 'grid' | 'search' | 'location' - Controls which view is shown
- `searchQuery`: string - Search input value
- `zipCodeInput`: string - Zip code input value
- `loading`: boolean - Loading state for location requests

## API Integration

### Location Setting
Uses OpenStreetMap Nominatim API:
- **Geocoding** (zip code to coordinates):
  - Endpoint: `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`
  - Returns: latitude, longitude

- **Reverse Geocoding** (coordinates to zip code):
  - Endpoint: `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  - Returns: address data including zip code

### Browser Geolocation
Uses native `navigator.geolocation.getCurrentPosition()` API to get user's current coordinates.

## Accessibility

- All buttons have `aria-label` attributes
- Menu button has `aria-expanded` state
- Keyboard navigation: Escape key closes popover
- Click-outside detection for closing popover
- Touch-friendly button sizes (minimum 36px)

## Icon Library

All icons from `react-icons`:
- Menu: `LuLayoutGrid` (Lucide)
- Location: `TbLocation` (Tabler)
- Search: `LuSearch` (Lucide)
- Add/Submit: `LuPlus` (Lucide)
- Scout/Verified: `MdVerified` (Material Design)
- Back: `IoIosArrowBack` (Ionicons)
- Close: `IoMdClose` (Ionicons)

## Key Differences from Previous Implementation

### Before
- Three separate action buttons in header (Search, Location, Add)
- Search button opened search mode in header (header expanded)
- Location button opened separate LocationModal
- Logo animated away when search mode was active

### After
- Single menu button opens popover
- All actions contained within popover
- Search mode is within popover (doesn't affect header)
- Location mode is within popover (no separate modal needed)
- Logo always visible (no animation)

## Files Modified

**New Files:**
- `src/components/BentoMenu.tsx` - Menu wrapper component
- `src/components/BentoMenuPopover.tsx` - Popover content component
- `BENTOMENU_COMPONENT.md` - This documentation file

**Modified Files:**
- `src/components/Homepage.tsx`:
  - Removed inline action buttons (Search, Location, Add)
  - Added BentoMenu component
  - Removed search mode state from header
  - Removed logo hide/show animation
  - Changed from `onLocationClick` to `onLocationSet` pattern

## Edge Cases Handled

1. **Click outside detection**: Popover closes when clicking outside, but not when clicking inside
2. **Keyboard navigation**: Escape key closes popover
3. **Mode state cleanup**: Search query and zip code input reset when returning to grid mode
4. **Loading states**: Buttons disabled during API requests
5. **Error handling**: Alerts shown for failed geocoding or geolocation requests
6. **Mailto links**: Work correctly on all platforms/browsers

## Future Enhancements

- Enable "Sign in" functionality when authentication is implemented
- Add animation transitions between modes
- Consider adding keyboard shortcuts for quick actions
- Add tooltips for action buttons
- Track usage analytics for each action

---

**Last Updated**: January 2026
