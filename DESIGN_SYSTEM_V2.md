# Outta Design System v2.0

**Document Version:** 1.0
**Last Updated:** January 16, 2026
**Status:** Draft - Pending Review

This document defines the updated design system for Outta, incorporating Vercel's Geist Design System components while preserving Outta's unique brand colors.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation & Setup](#2-installation--setup)
3. [Typography](#3-typography)
4. [Colors](#4-colors)
5. [Materials (Surfaces)](#5-materials-surfaces)
6. [Icons](#6-icons)
7. [Components](#7-components)
   - [Buttons](#71-buttons)
   - [Inputs](#72-inputs)
   - [Badges](#73-badges)
   - [Drawers & Modals](#74-drawers--modals)
   - [Sliders](#75-sliders)
8. [Migration Mapping](#8-migration-mapping)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Overview

### Design Decisions

- **Modal Style**: Responsive - bottom sheets on mobile, centered modals on desktop
- **Geist Usage**: Mix both - Geist components where convenient, Tailwind CSS elsewhere
- **Dark Mode**: Not included in this refresh (light theme only)
- **Snap Points**: Custom per drawer based on content needs

### What's Changing

| Aspect | Current (v1) | New (v2) |
|--------|--------------|----------|
| Typography | Bricolage Grotesque | Geist Sans + Geist Mono |
| Modals | Custom bottom sheets | Vaul Drawer (responsive: bottom mobile, centered desktop) |
| Buttons | Custom Tailwind | Mix of Geist Button components + Tailwind patterns |
| Badges/Chips | Custom Chip.tsx | Geist Badge + custom Outta styling |
| Materials | None | Geist Materials (radii, shadows, fills) |
| Icons | Lucide (react-icons/lu) | Lucide (unchanged) |
| Colors | Outta 6-color system | Outta 6-color system (unchanged) |

### What's NOT Changing

- **Color Palette**: All 6 color scales (Broom, Flamenco, Lavender Magenta, Emerald, Malibu, Black) remain unchanged
- **Icon Library**: Lucide icons via react-icons/lu
- **Core Functionality**: All features, filters, and data flows remain the same

---

## 2. Installation & Setup

### Required Packages

```bash
# Typography
npm install geist

# Drawers/Modals
npm install vaul
```

### Layout Configuration

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outta - Kid-friendly adventures near you",
  description: "Discover fun kid-friendly events, activities, and camps in your area",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### CSS Configuration

Update `src/app/globals.css` to include Geist typography classes:

```css
@import 'tailwindcss';

:root {
  --background: #ffffff;
  --foreground: #171717;

  /* Geist Font Variables (set by geist package) */
  --font-geist-sans: var(--font-geist-sans);
  --font-geist-mono: var(--font-geist-mono);

  /* ... existing color variables remain unchanged ... */
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Monospace text (code, technical content) */
.font-mono {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}
```

---

## 3. Typography

### Font Families

| Font | Usage | CSS Variable |
|------|-------|--------------|
| Geist Sans | All UI text, headings, body | `--font-geist-sans` |
| Geist Mono | Code, technical content, numbers | `--font-geist-mono` |

### Typography Scale (Geist Classes)

#### Headings
Use for page titles, section headers, and marketing content.

| Class | Size | Use Case |
|-------|------|----------|
| `text-heading-72` | 72px | Marketing heroes only |
| `text-heading-64` | 64px | Large marketing headings |
| `text-heading-56` | 56px | Marketing headings |
| `text-heading-48` | 48px | Page titles |
| `text-heading-40` | 40px | Section titles |
| `text-heading-32` | 32px | Dashboard headings, subheadings |
| `text-heading-24` | 24px | Card titles, modal headers |
| `text-heading-20` | 20px | Subsection titles |
| `text-heading-16` | 16px | Small headings |
| `text-heading-14` | 14px | Micro headings |

**Subtle Modifier**: Add `<strong>` for reduced visual emphasis on heading-32 through heading-16.

#### Body/Copy Text
Use for paragraphs, descriptions, and general content.

| Class | Size | Use Case |
|-------|------|----------|
| `text-copy-24` | 24px | Hero descriptions |
| `text-copy-20` | 20px | Hero subtext |
| `text-copy-18` | 18px | Marketing content, quotes |
| `text-copy-16` | 16px | Modal content with breathing room |
| `text-copy-14` | 14px | **Most common** - default body text |
| `text-copy-13` | 13px | Secondary text, compact views |
| `text-copy-13-mono` | 13px | Inline code |

**Strong Modifier**: Add `<strong>` for increased emphasis.

#### Labels
Use for form labels, menu items, and metadata.

| Class | Size | Use Case |
|-------|------|----------|
| `text-label-20` | 20px | Marketing labels |
| `text-label-18` | 18px | Large labels |
| `text-label-16` | 16px | Form labels |
| `text-label-14` | 14px | **Most common** - menu items, filters |
| `text-label-13` | 13px | Secondary labels |
| `text-label-12` | 12px | Tertiary labels, metadata |

**Modifiers**: Strong, Tabular (for numbers), CAPS, Mono variants available.

#### Button Text

| Class | Size | Use Case |
|-------|------|----------|
| `text-button-16` | 16px | Large buttons |
| `text-button-14` | 14px | Default buttons |
| `text-button-12` | 12px | Small buttons, inline actions |

### Typography Usage Examples

```tsx
// Page title
<h1 className="text-heading-32">Events Near You</h1>

// Section header
<h2 className="text-heading-24">Upcoming This Week</h2>

// Card title
<h3 className="text-heading-20">Family Fun Day at the Park</h3>

// Body text
<p className="text-copy-14">Join us for an afternoon of games, crafts, and fun...</p>

// Secondary/metadata
<span className="text-label-13 text-black-500">San Francisco, CA</span>

// Price/number (tabular)
<span className="text-label-14-mono">$15.00</span>
```

---

## 4. Colors

### Outta Color Palette (Unchanged)

The 6-color system remains exactly as defined. Each scale has 11 shades (50-950).

#### Broom (Yellow/Brown) - Primary Accent
```
50: #fdfee8   100: #faffc2   200: #f9ff87   300: #feff43
400: #fff407  500: #efdb03   600: #ceac00   700: #a47c04
800: #88610b  900: #734e10   950: #432a05
```
**Usage**: Primary buttons, highlights, active states

#### Flamenco (Orange) - Secondary Accent
```
50: #fff8ed   100: #fff0d4   200: #ffdda8   300: #ffc470
400: #ff9f37  500: #ff7e08   600: #f06606   700: #c74c07
800: #9e3c0e  900: #7f340f   950: #451705
```
**Usage**: CTAs, borders, warm accents

#### Lavender Magenta (Purple) - Feature Highlight
```
50: #fef4ff   100: #fde7ff   200: #fcceff   300: #fd9bff
400: #fd74fe  500: #f540f5   600: #d920d5   700: #b417ae
800: #93158c  900: #781771   950: #51014c
```
**Usage**: Scout Pick badge, special features

#### Emerald (Green) - Success/Deals
```
50: #f1fcf5   100: #dff9ea   200: #c0f2d4   300: #8fe6b3
400: #56d28a  500: #35cb75   600: #219854   700: #1e7744
800: #1c5f3a  900: #194e31   950: #082b19
```
**Usage**: Deal badge, success states, positive actions

#### Malibu (Blue) - Information
```
50: #eff9ff   100: #dff2ff   200: #b8e8ff   300: #78d6ff
400: #40c6ff  500: #06aaf1   600: #0088ce   700: #006ca7
800: #025b8a  900: #084c72   950: #06304b
```
**Usage**: Links, info states, backgrounds

#### Black (Grayscale) - Neutral
```
50: #f6f6f6   100: #e7e7e7   200: #d1d1d1   300: #b0b0b0
400: #888888  500: #6d6d6d   600: #5d5d5d   700: #4f4f4f
800: #454545  900: #3d3d3d   950: #000000
```
**Usage**: Text, borders, backgrounds, disabled states

### Color Usage Guidelines

| Use Case | Color | Shade |
|----------|-------|-------|
| Primary text | Black | 950 |
| Secondary text | Black | 500 |
| Tertiary/muted text | Black | 400 |
| Borders | Black | 200 |
| Subtle backgrounds | Black | 50-100 |
| Primary button | Broom | 400 |
| Primary button hover | Broom | 500 |
| Danger/Error | Flamenco | 500-600 |
| Success | Emerald | 500 |
| Links | Malibu | 500-600 |

---

## 5. Materials (Surfaces)

Geist Materials define consistent surface treatments (radii, fills, strokes, shadows).

### Material Types

| Type | Radius | Elevation | Use Case |
|------|--------|-----------|----------|
| `material-base` | 6px | None | Everyday containers |
| `material-small` | 6px | Slight | Slightly raised elements |
| `material-medium` | 12px | Medium | Cards, panels |
| `material-large` | 12px | High | Featured cards |
| `material-tooltip` | 6px | Light shadow | Tooltips (with triangle stem) |
| `material-menu` | 12px | Lifted | Dropdown menus, popovers |
| `material-modal` | 12px | Higher lift | Modals, dialogs |
| `material-fullscreen` | 16px | Highest | Full-screen overlays |

### Material CSS Classes

```css
/* Custom Tailwind utilities based on Geist materials */
.material-base {
  @apply rounded-md;
}

.material-small {
  @apply rounded-md shadow-sm;
}

.material-medium {
  @apply rounded-xl shadow-md;
}

.material-large {
  @apply rounded-xl shadow-lg;
}

.material-tooltip {
  @apply rounded-md shadow-sm;
}

.material-menu {
  @apply rounded-xl shadow-lg;
}

.material-modal {
  @apply rounded-xl shadow-xl;
}

.material-fullscreen {
  @apply rounded-2xl shadow-2xl;
}
```

### Usage Examples

```tsx
// Event card
<div className="material-medium bg-white p-4">
  <h3>Family Fun Day</h3>
</div>

// Dropdown menu
<div className="material-menu bg-white">
  <MenuItem>Option 1</MenuItem>
</div>

// Modal/Drawer content
<div className="material-modal bg-white">
  <ModalContent />
</div>
```

---

## 6. Icons

### Icon Library

**Primary**: Lucide icons via `react-icons/lu`
**Secondary**: BiNavigation from `react-icons/bi` (navigation only)

### Core Icon Mapping

```tsx
import {
  LuMenu,          // Menu/hamburger
  LuRows2,         // Collections/list view
  LuCalendar,      // Events, dates, calendar
  LuMapPin,        // Location marker
  LuTag,           // Tags, categories
  LuSearch,        // Search
  LuChevronLeft,   // Back navigation
  LuChevronRight,  // Forward navigation
  LuChevronUp,     // Collapse/up
  LuChevronDown,   // Expand/down
  LuPlus,          // Add/create
  LuBadgeCheck,    // Verified/trusted
  LuMap,           // Map view
  LuSlidersHorizontal, // Filters
} from "react-icons/lu";

import { BiNavigation } from "react-icons/bi"; // Navigation/compass
```

### Place Type Icons

See `/src/lib/placeTypeIcons.ts` for the complete mapping of place types to icons:

| Category | Icon | Place Types |
|----------|------|-------------|
| Education | `LuSchool` | School, After school |
| Education | `LuBook` | Library |
| Education | `LuGraduationCap` | Education center |
| Museums | `LuLandmark` | Museum, Children's museum |
| Childcare | `LuBaby` | Day care, Daycare |
| Entertainment | `LuFerrisWheel` | Amusement park |
| Entertainment | `LuCircleDot` | Amusement center, Indoor playground |
| Entertainment | `LuSparkles` | Playground |
| Entertainment | `LuDoorOpen` | Escape room |
| Entertainment | `LuFlag` | Miniature golf |
| Arts | `LuPalette` | Art gallery, Painting studio |
| Arts | `LuTheater` | Theater, Theatre |
| Recreation | `LuDumbbell` | Gymnastics |
| Recreation | `LuUsers` | Recreation center, Community center |
| Outdoor | `LuTrees` | Park (non-amusement) |
| Outdoor | `LuFlower2` | Garden |
| Shopping | `LuShoppingBag` | Toy store, Book store |
| Tourism | `LuBinoculars` | Tourist attraction |
| Tourism | `LuInfo` | Visitor center |
| Default | `LuBuilding` | Fallback |

### Icon Sizing

| Context | Size | Tailwind Class |
|---------|------|----------------|
| Small (inline) | 16px | `w-4 h-4` |
| Default | 20px | `w-5 h-5` |
| Medium | 24px | `w-6 h-6` |
| Large | 32px | `w-8 h-8` |

---

## 7. Components

### Geist Components vs Tailwind Patterns

We use a **mixed approach** for flexibility:

| Use Geist Components | Use Tailwind Patterns |
|---------------------|----------------------|
| Standard buttons in forms | Custom-styled buttons matching Outta brand |
| Basic badges | Custom Chip badges with Outta colors |
| Form inputs | Complex/custom input layouts |
| Sliders | Custom range controls |

**When to use Geist components:**
- Standard UI patterns that match Geist's design
- When you need built-in accessibility features
- For consistency in form elements

**When to use Tailwind patterns:**
- Custom Outta brand styling (yellow buttons, colored badges)
- Complex layouts requiring fine control
- When Geist component doesn't fit the design

```tsx
// Using Geist Button for secondary actions
import { Button } from 'geist/components';

<Button type="secondary" size="small">
  Cancel
</Button>

// Using Tailwind for primary Outta-branded button
<button className="px-4 py-2 bg-broom-400 hover:bg-broom-500 text-black-950 rounded-md">
  Find Events
</button>
```

### 7.1 Buttons

#### Button Types

| Type | Use Case | Style |
|------|----------|-------|
| `default` | Primary action | Solid fill, high contrast |
| `secondary` | Secondary action | Outline or subtle fill |
| `tertiary` | Low-priority action | Text only, minimal styling |
| `error` | Destructive action | Red/warning coloring |
| `warning` | Cautionary action | Orange/amber coloring |

#### Button Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `small` | 32px | `px-3 py-1.5` | `text-button-12` |
| `default` | 40px | `px-4 py-2` | `text-button-14` |
| `large` | 48px | `px-6 py-3` | `text-button-16` |

#### Button Variants

```tsx
// Standard button
<Button type="default" size="default">
  Upload
</Button>

// With prefix icon
<Button prefix={<LuPlus className="w-4 h-4" />}>
  Add Event
</Button>

// With suffix icon
<Button suffix={<LuChevronRight className="w-4 h-4" />}>
  Continue
</Button>

// Rounded pill button
<Button shadow shape="rounded" type="secondary">
  Filter
</Button>

// Icon-only button
<Button svgOnly aria-label="Search">
  <LuSearch className="w-5 h-5" />
</Button>
```

#### Outta Button Styles (Tailwind)

```tsx
// Primary button (Broom yellow)
<button className="
  px-4 py-2
  bg-broom-400 hover:bg-broom-500
  text-black-950
  text-button-14 font-medium
  rounded-md
  transition-colors
">
  Primary Action
</button>

// Secondary button (outline)
<button className="
  px-4 py-2
  bg-white hover:bg-black-50
  text-black-950
  border border-black-200
  text-button-14 font-medium
  rounded-md
  transition-colors
">
  Secondary Action
</button>

// Tertiary button (text only)
<button className="
  px-4 py-2
  text-black-700 hover:text-black-950
  text-button-14 font-medium
  transition-colors
">
  Tertiary Action
</button>
```

### 7.2 Inputs

#### Input Sizes

| Size | Height | Use Case |
|------|--------|----------|
| `small` | 32px | Compact forms, inline |
| `default` | 40px | Standard forms |
| `large` | 48px | Prominent inputs, search |

#### Input Styling

```tsx
<input
  type="text"
  placeholder="Search events..."
  aria-label="Search"
  className="
    w-full px-4 py-2
    bg-white
    border border-black-200
    rounded-md
    text-copy-14 text-black-950
    placeholder:text-black-400
    focus:outline-none focus:ring-2 focus:ring-broom-400 focus:border-transparent
    transition-all
  "
/>
```

### 7.3 Badges

#### Badge Sizes

| Size | Padding | Font |
|------|---------|------|
| `sm` | `px-2 py-0.5` | `text-label-12` |
| `md` | `px-2.5 py-1` | `text-label-13` |
| `lg` | `px-3 py-1.5` | `text-label-14` |

#### Outta Badge Variants (Chip System)

| Variant | Background | Text | Border | Use Case |
|---------|------------|------|--------|----------|
| Scout Pick | `lavender-magenta-100` | `lavender-magenta-700` | `lavender-magenta-200` | Editor's choice |
| Deal | `emerald-100` | `emerald-700` | `emerald-200` | Discounts, free events |
| Promoted | `flamenco-100` | `flamenco-700` | `flamenco-200` | Sponsored content |
| New | `malibu-100` | `malibu-700` | `malibu-200` | Recently added |
| Coming Soon | `broom-100` | `broom-700` | `broom-200` | Future events |
| Top Rated | `broom-100` | `broom-700` | `broom-200` | Highly rated |

```tsx
// Scout Pick badge
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5
  bg-lavender-magenta-100
  text-lavender-magenta-700
  border border-lavender-magenta-200
  text-label-12 font-medium
  rounded-full
">
  <LuBadgeCheck className="w-3 h-3" />
  Scout Pick
</span>

// Deal badge
<span className="
  inline-flex items-center
  px-2 py-0.5
  bg-emerald-100
  text-emerald-700
  border border-emerald-200
  text-label-12 font-medium
  rounded-full
">
  Free
</span>
```

### 7.4 Drawers & Modals

Modal interfaces use **Vaul Drawer** with responsive behavior:
- **Mobile**: Bottom sheet with drag-to-dismiss
- **Desktop**: Centered modal with backdrop click to close

#### Responsive Drawer/Modal Component

```tsx
'use client';

import { Drawer } from 'vaul';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: (number | string)[];
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  snapPoints,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    // Centered modal for desktop
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black-950/40" />
          <Drawer.Content className="
            fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            bg-white
            rounded-xl
            outline-none
            w-full max-w-lg
            max-h-[85vh]
            flex flex-col
            shadow-xl
          ">
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-black-100">
                <Drawer.Title className="text-heading-20">{title}</Drawer.Title>
                <Drawer.Close asChild>
                  <button className="p-2 hover:bg-black-50 rounded-md" aria-label="Close">
                    <LuX className="w-5 h-5 text-black-500" />
                  </button>
                </Drawer.Close>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Bottom sheet for mobile
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black-950/40" />
        <Drawer.Content className="
          fixed bottom-0 left-0 right-0
          bg-white
          rounded-t-xl
          outline-none
          max-h-[96vh]
          flex flex-col
        ">
          {/* Drag handle (mobile only) */}
          <Drawer.Handle className="mx-auto mt-4 mb-2 w-12 h-1.5 rounded-full bg-black-200" />

          {title && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-black-100">
              <Drawer.Title className="text-heading-20">{title}</Drawer.Title>
              <Drawer.Close asChild>
                <button className="p-2 hover:bg-black-50 rounded-md" aria-label="Close">
                  <LuX className="w-5 h-5 text-black-500" />
                </button>
              </Drawer.Close>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

#### useMediaQuery Hook

```tsx
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

#### Drawer with Header

```tsx
<Drawer.Root open={open} onOpenChange={onOpenChange}>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black-950/40" />
    <Drawer.Content className="
      fixed bottom-0 left-0 right-0
      bg-white
      rounded-t-xl
      outline-none
      max-h-[96vh]
      flex flex-col
    ">
      <Drawer.Handle className="mx-auto mt-4 mb-2 w-12 h-1.5 rounded-full bg-black-200" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black-100">
        <Drawer.Title className="text-heading-20">
          Filters
        </Drawer.Title>
        <Drawer.Close asChild>
          <button className="p-2 hover:bg-black-50 rounded-md" aria-label="Close">
            <LuX className="w-5 h-5 text-black-500" />
          </button>
        </Drawer.Close>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Filter content */}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black-100">
        <button className="w-full px-4 py-3 bg-broom-400 text-black-950 text-button-14 font-medium rounded-md">
          Apply Filters
        </button>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

#### Vaul Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | - | Controlled open state |
| `onOpenChange` | function | - | Called when state changes |
| `modal` | boolean | `true` | Disable outside interaction |
| `dismissible` | boolean | `true` | Allow drag/click to close |
| `direction` | string | `"bottom"` | `"top"`, `"right"`, `"bottom"`, `"left"` |
| `snapPoints` | array | - | Define snap positions (e.g., `[0.5, 1]`) |
| `handleOnly` | boolean | `false` | Only drag from handle |

#### Snap Points (Custom Per Drawer)

Each drawer should have snap points configured based on its content:

| Drawer | Snap Points | Rationale |
|--------|-------------|-----------|
| Search | `[1]` (full only) | Needs keyboard space |
| Filter | `[0.6, 1]` | Preview filters at 60%, expand for all |
| Location | `[0.5, 1]` | Simple input at 50%, map at full |
| Submit | `[0.7, 1]` | Form fits at 70%, expand if needed |

```tsx
// Filter drawer with custom snap points
<ResponsiveModal
  open={filterOpen}
  onOpenChange={setFilterOpen}
  title="Filters"
  snapPoints={[0.6, 1]}
>
  <FilterContent />
</ResponsiveModal>

// Search drawer - full height for keyboard
<ResponsiveModal
  open={searchOpen}
  onOpenChange={setSearchOpen}
  title="Search"
  snapPoints={[1]}
>
  <SearchContent />
</ResponsiveModal>
```

### 7.5 Sliders

For range inputs like distance selection.

```tsx
import { useState } from 'react';

export function DistanceSlider() {
  const [value, setValue] = useState([20]);

  return (
    <div className="w-full">
      <label className="text-label-14 text-black-700 mb-2 block">
        Distance: {value[0]} miles
      </label>
      <input
        type="range"
        min={5}
        max={50}
        step={5}
        value={value[0]}
        onChange={(e) => setValue([parseInt(e.target.value)])}
        className="
          w-full h-2
          bg-black-200
          rounded-full
          appearance-none
          cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:bg-broom-400
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md
        "
      />
    </div>
  );
}
```

---

## 8. Migration Mapping

### Component Mapping

| Current Component | New Implementation |
|-------------------|-------------------|
| `SearchModal.tsx` | Vaul Drawer (direction="bottom") |
| `FilterModal.tsx` | Vaul Drawer with snap points |
| `LocationModal.tsx` | Vaul Drawer |
| `SubmitModal.tsx` | Vaul Drawer |
| `Chip.tsx` | Updated with Geist Badge patterns |
| Custom buttons | Standardized button styles |

### Typography Migration

| Current | New |
|---------|-----|
| `font-bricolage-grotesque` | `font-sans` (Geist Sans) |
| `text-xs` | `text-label-12` |
| `text-sm` | `text-label-14` or `text-copy-14` |
| `text-base` | `text-copy-16` |
| `text-lg` | `text-copy-18` |
| `text-xl` | `text-heading-20` |
| `text-2xl` | `text-heading-24` |
| `text-3xl` | `text-heading-32` |

### Files to Update

1. `src/app/layout.tsx` - Font configuration
2. `src/app/globals.css` - Typography utilities, material classes
3. `src/components/SearchModal.tsx` - Convert to Vaul
4. `src/components/FilterModal.tsx` - Convert to Vaul
5. `src/components/LocationModal.tsx` - Convert to Vaul
6. `src/components/SubmitModal.tsx` - Convert to Vaul
7. `src/components/Chip.tsx` - Update styling
8. `src/components/Homepage.tsx` - Update typography classes
9. All components using custom button styles

---

## 9. Implementation Checklist

### Phase 1: Foundation
- [ ] Install `geist` and `vaul` packages
- [ ] Update `layout.tsx` with Geist fonts
- [ ] Create `useMediaQuery` hook
- [ ] Add typography utility classes to `globals.css`
- [ ] Add material utility classes to `globals.css`
- [ ] Test font rendering on both desktop and mobile

### Phase 2: Core Components
- [ ] Create `ResponsiveModal` wrapper component
- [ ] Convert `SearchModal` to ResponsiveModal (snapPoints: [1])
- [ ] Convert `FilterModal` to ResponsiveModal (snapPoints: [0.6, 1])
- [ ] Convert `LocationModal` to ResponsiveModal (snapPoints: [0.5, 1])
- [ ] Convert `SubmitModal` to ResponsiveModal (snapPoints: [0.7, 1])
- [ ] Test responsive behavior (bottom sheet mobile, centered desktop)

### Phase 3: Typography Migration
- [ ] Update `Homepage.tsx` typography
- [ ] Update `EventDetail.tsx` typography
- [ ] Update `ClickableCard.tsx` typography
- [ ] Update `TabBar.tsx` typography
- [ ] Update `Footer.tsx` typography
- [ ] Update all remaining components

### Phase 4: Component Refinement
- [ ] Integrate Geist Button component where beneficial
- [ ] Integrate Geist Badge component where beneficial
- [ ] Integrate Geist Input component where beneficial
- [ ] Update `Chip.tsx` with new badge patterns
- [ ] Apply material classes to card surfaces
- [ ] Standardize button styles across all components

### Phase 5: Testing & Polish
- [ ] Test all drawer interactions (drag, snap, dismiss)
- [ ] Test keyboard accessibility
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Performance testing (bundle size impact)
- [ ] Visual regression testing

---

## Appendix: Quick Reference

### Typography Classes

```
Headings: text-heading-{72|64|56|48|40|32|24|20|16|14}
Copy: text-copy-{24|20|18|16|14|13}
Labels: text-label-{20|18|16|14|13|12}
Buttons: text-button-{16|14|12}
Mono variants: text-{copy|label}-{13|14}-mono
```

### Color Usage

```
Primary: broom-400
Secondary: flamenco-500
Success: emerald-500
Info: malibu-500
Feature: lavender-magenta-500
Text primary: black-950
Text secondary: black-500
Borders: black-200
Background subtle: black-50
```

### Material Classes

```
Surface: material-{base|small|medium|large}
Floating: material-{tooltip|menu|modal|fullscreen}
```
