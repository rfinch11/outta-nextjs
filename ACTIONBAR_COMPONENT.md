# ActionBar Component Documentation

## Overview

The `ActionBar` is a reusable component that provides a consistent, pill-shaped action button container used throughout the Outta app. It creates a fixed-position white pill with rounded corners containing icon-only action buttons.

---

## Visual Design

### Container Styling
- **Shape**: Rounded pill (`rounded-[60px]`)
- **Background**: White (`bg-white`)
- **Shadow**: Subtle shadow (`shadow-sm`)
- **Padding**: Compact (`p-2` = 8px)
- **Gap**: 8px between buttons (`gap-2`)

### Button Styling
- **Size**: 44px × 44px (`w-11 h-11`)
- **Shape**: Fully rounded (`rounded-full`)
- **Background**: Transparent with hover state
  - Default: `bg-transparent`
  - Hover: `bg-gray-100`
  - Active: `bg-malibu-50` (optional)
- **Icons**: 17px size
- **No text labels**: Icons only for compact design

### Positioning
- **Default**: Top-right corner (`top-5 right-5` = 20px from edges)
- **Alternative**: Top-left corner (`top-5 left-5`)
- **Z-index**: `z-50` (above most content)

---

## Component API

### ActionBar Props

```typescript
interface ActionBarProps {
  children: React.ReactNode;      // ActionBar.Button components
  position?: 'top-left' | 'top-right';  // Default: 'top-right'
  className?: string;              // Additional custom classes
}
```

### ActionBar.Button Props

```typescript
interface ActionBarButtonProps {
  onClick?: () => void;            // Click handler (for buttons)
  href?: string;                   // URL (for links)
  target?: string;                 // Link target
  rel?: string;                    // Link rel attribute
  children: React.ReactNode;       // Icon component
  'aria-label': string;            // Required for accessibility
  type?: 'button' | 'submit' | 'reset';  // Button type
  onMouseEnter?: () => void;       // Hover start handler
  onMouseLeave?: () => void;       // Hover end handler
  isActive?: boolean;              // Active state styling
}
```

---

## Usage Examples

### Example 1: EventDetail Page Actions

**File**: `src/components/EventDetail.tsx`

**Use Case**: Share, Add to Calendar, Visit Website

```tsx
import ActionBar from './ActionBar';
import { LuShare, LuCalendar, LuGlobe } from 'react-icons/lu';

<ActionBar position="top-right">
  <ActionBar.Button onClick={handleShare} aria-label="Share">
    <LuShare size={17} />
  </ActionBar.Button>

  {start_date && (
    <ActionBar.Button onClick={handleAddToCalendar} aria-label="Add to calendar">
      <LuCalendar size={17} />
    </ActionBar.Button>
  )}

  {website && (
    <ActionBar.Button
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit website"
    >
      <LuGlobe size={17} />
    </ActionBar.Button>
  )}
</ActionBar>
```

### Example 2: Homepage Actions

**File**: `src/components/Homepage.tsx`

**Use Case**: Search, Location, Add Listing

```tsx
import ActionBar from './ActionBar';
import { LuSearch, LuPlus } from 'react-icons/lu';
import { TbLocation } from 'react-icons/tb';

<ActionBar position="top-right">
  <ActionBar.Button
    onClick={() => setIsSearchMode(true)}
    aria-label="Search"
    isActive={searchQuery.length > 0}
  >
    <LuSearch size={17} />
  </ActionBar.Button>

  <ActionBar.Button
    onClick={() => setShowLocationModal(true)}
    aria-label="Change location"
  >
    <TbLocation size={17} />
  </ActionBar.Button>

  <ActionBar.Button
    onClick={() => setShowSubmitModal(true)}
    aria-label="Add listing"
  >
    <LuPlus size={17} />
  </ActionBar.Button>
</ActionBar>
```

---

## Implementation Details

### Conditional Buttons

Buttons can be conditionally rendered based on data availability:

```tsx
<ActionBar position="top-right">
  <ActionBar.Button onClick={handleShare} aria-label="Share">
    <LuShare size={17} />
  </ActionBar.Button>

  {/* Only show if event has a start date */}
  {start_date && (
    <ActionBar.Button onClick={handleCalendar} aria-label="Add to calendar">
      <LuCalendar size={17} />
    </ActionBar.Button>
  )}

  {/* Only show if website URL exists */}
  {website && (
    <ActionBar.Button href={website} target="_blank" aria-label="Visit website">
      <LuGlobe size={17} />
    </ActionBar.Button>
  )}
</ActionBar>
```

### Button vs Link

The component automatically renders as:
- `<button>` when `onClick` is provided
- `<a>` when `href` is provided

```tsx
{/* Renders as <button> */}
<ActionBar.Button onClick={handleClick} aria-label="Click me">
  <LuShare size={17} />
</ActionBar.Button>

{/* Renders as <a> */}
<ActionBar.Button href="/path" aria-label="Go to page">
  <LuGlobe size={17} />
</ActionBar.Button>
```

### Active State

Use `isActive` prop to highlight the current action:

```tsx
<ActionBar.Button
  onClick={handleSearch}
  isActive={isSearchMode}  // Shows bg-malibu-50 when true
  aria-label="Search"
>
  <LuSearch size={17} />
</ActionBar.Button>
```

---

## Design Guidelines

### Icon Selection
- Use 17px icons from `react-icons/lu` (Lucide) or `react-icons/tb` (Tabler)
- Keep icons simple and recognizable
- Ensure icons are visually balanced at 17px

### Icon Recommendations
| Action | Icon | Library |
|--------|------|---------|
| Share | `LuShare` | react-icons/lu |
| Calendar | `LuCalendar` | react-icons/lu |
| Website/External | `LuGlobe` | react-icons/lu |
| Search | `LuSearch` | react-icons/lu |
| Add/Plus | `LuPlus` | react-icons/lu |
| Location | `TbLocation` | react-icons/tb |

### Accessibility
- **Always** provide `aria-label` for each button
- Use descriptive labels: "Share", "Add to calendar", "Visit website"
- Ensure keyboard navigation works (built-in with semantic buttons)

### Button Count
- **Recommended**: 2-4 buttons per ActionBar
- **Maximum**: 5 buttons (beyond this, consider redesign)
- Too many buttons reduces usability on mobile

---

## Alignment with Other Elements

### Vertical Centering

When placing ActionBar alongside other fixed elements (like a back button), ensure vertical centers align:

```tsx
{/* Back Button - 40px tall */}
<div className="fixed top-5 left-5 z-50 mt-2.5">
  <Link href="/" className="w-10 h-10 ...">
    <IoIosArrowBack size={24} />
  </Link>
</div>

{/* ActionBar - ~60px tall (44px button + 16px padding) */}
{/* mt-2.5 on back button centers it with ActionBar */}
<ActionBar position="top-right">
  {/* buttons */}
</ActionBar>
```

**Calculation**:
- ActionBar: 44px button + 16px padding = 60px total, center at 30px
- Back button: 40px tall, center at 20px
- Offset needed: 30px - 20px = 10px (`mt-2.5`)

---

## Current Implementations

### 1. EventDetail Page
**Location**: `src/components/EventDetail.tsx:318-339`

**Actions**:
- Share (triggers OS share sheet)
- Add to Calendar (downloads .ics file)
- Visit Website (opens external link)

**Position**: Top-right

### 2. Homepage
**Location**: `src/components/Homepage.tsx:1048-1158`

**Actions**:
- Search (toggles search mode)
- Change Location (opens location modal)
- Add Listing (opens submit modal)

**Position**: Top-right (within sticky header)

**Note**: Homepage implementation is currently inline and could be refactored to use the ActionBar component for consistency.

---

## Future Enhancements

### Potential Features
1. **Tooltip support**: Show action labels on hover
2. **Badge indicators**: Display notification counts
3. **Animation**: Smooth entry/exit animations
4. **Mobile optimization**: Adjust size/spacing for small screens
5. **Theme support**: Dark mode variant

### Refactoring Opportunities
- Update Homepage to use ActionBar component (currently inline)
- Extract hover state management into the component
- Add transition animations for active state

---

## Migration Guide

### Converting Existing Inline ActionBars

**Before** (Inline implementation):
```tsx
<div className="fixed top-5 right-5 z-50">
  <div className="flex items-center gap-2 bg-white rounded-[60px] shadow-sm p-2">
    <button
      onClick={handleClick}
      className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors bg-transparent hover:bg-gray-100"
      aria-label="Action"
    >
      <LuIcon size={17} />
    </button>
  </div>
</div>
```

**After** (Using ActionBar component):
```tsx
<ActionBar position="top-right">
  <ActionBar.Button onClick={handleClick} aria-label="Action">
    <LuIcon size={17} />
  </ActionBar.Button>
</ActionBar>
```

---

## Testing Checklist

When implementing an ActionBar:
- [ ] All buttons have `aria-label` attributes
- [ ] Icon size is 17px
- [ ] Buttons respond to hover (background changes to gray-100)
- [ ] Active states work correctly (if applicable)
- [ ] Links open in new tab with proper `rel` attribute
- [ ] Vertical alignment with other fixed elements is correct
- [ ] Component works on mobile (touch-friendly, proper sizing)
- [ ] Z-index doesn't conflict with other overlays

---

**Last Updated**: January 2026
**Component Location**: `src/components/ActionBar.tsx`
