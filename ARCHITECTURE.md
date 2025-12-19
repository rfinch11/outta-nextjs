# Outta System Architecture

## Overview

Outta is a Next.js 16 application that helps families discover kid-friendly events, activities, and camps near them. The application uses a modern stack with Supabase as the backend, Vercel for deployment, and integrates with various external APIs for data enrichment.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Browser    │  │    Mobile    │  │   Tablet     │                  │
│  │  (Desktop)   │  │   (Safari)   │  │   (iPad)     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                            │                                             │
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              VERCEL CDN / Edge Network                           │   │
│  │  - Static Assets (images, CSS, JS)                              │   │
│  │  - Edge Caching                                                  │   │
│  │  - Global Distribution                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Next.js 16 Application (Vercel)                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                  App Router (React Server Components)      │  │   │
│  │  ├───────────────────────────────────────────────────────────┤  │   │
│  │  │  Pages:                                                     │  │   │
│  │  │  • / (Homepage)           - Main listing view              │  │   │
│  │  │  • /listings/[id]         - Event detail page              │  │   │
│  │  │  • /chips                 - Component showcase             │  │   │
│  │  │  • /api/listings          - Server API route               │  │   │
│  │  │  • /api/search            - Search API route               │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                    Core Components                         │  │   │
│  │  ├───────────────────────────────────────────────────────────┤  │   │
│  │  │  • Homepage             - Main page with filters/map       │  │   │
│  │  │  • ClickableCard        - Event/activity card              │  │   │
│  │  │  • EventDetail          - Full event details               │  │   │
│  │  │  • FilterModal          - Filter UI                        │  │   │
│  │  │  • SearchModal          - Search interface                 │  │   │
│  │  │  • LocationModal        - Location picker                  │  │   │
│  │  │  • MapView              - Interactive map                  │  │   │
│  │  │  • Footer               - Site footer                      │  │   │
│  │  │  • Chip                 - Badge components (6 variants)    │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                    State Management                        │  │   │
│  │  ├───────────────────────────────────────────────────────────┤  │   │
│  │  │  • React useState/useEffect                                │  │   │
│  │  │  • URL params for filters                                  │  │   │
│  │  │  • Local storage for location                              │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                  Design System                             │  │   │
│  │  ├───────────────────────────────────────────────────────────┤  │   │
│  │  │  • Tailwind CSS v4 with @theme inline                      │  │   │
│  │  │  • Color Scales:                                           │  │   │
│  │  │    - Broom (Yellow/Brown)                                  │  │   │
│  │  │    - Flamenco (Orange)                                     │  │   │
│  │  │    - Lavender Magenta (Purple)                             │  │   │
│  │  │    - Emerald (Green)                                       │  │   │
│  │  │    - Malibu (Blue)                                         │  │   │
│  │  │    - Black (Grayscale)                                     │  │   │
│  │  │  • Bricolage Grotesque font                                      │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Supabase (PostgreSQL)                         │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                  listings Table                            │  │   │
│  │  ├───────────────────────────────────────────────────────────┤  │   │
│  │  │  Columns:                                                   │  │   │
│  │  │  • airtable_id (PK)      - Unique identifier               │  │   │
│  │  │  • title                 - Event name                       │  │   │
│  │  │  • type                  - Event/Activity/Camp              │  │   │
│  │  │  • description           - Full description                 │  │   │
│  │  │  • image                 - Image URL                        │  │   │
│  │  │  • start_date            - Event date/time                  │  │   │
│  │  │  • city                  - City name                        │  │   │
│  │  │  • state                 - State code                       │  │   │
│  │  │  • zip                   - Zip code                         │  │   │
│  │  │  • street                - Street address                   │  │   │
│  │  │  • latitude              - Geocoded latitude                │  │   │
│  │  │  • longitude             - Geocoded longitude               │  │   │
│  │  │  • location_name         - Venue name                       │  │   │
│  │  │  • price                 - Price information                │  │   │
│  │  │  • age_range             - Target age range                 │  │   │
│  │  │  • organizer             - Event organizer                  │  │   │
│  │  │  • website               - External URL                     │  │   │
│  │  │  • tags                  - Comma-separated tags             │  │   │
│  │  │  • place_type            - Venue category                   │  │   │
│  │  │  • recommended           - Boolean flag                     │  │   │
│  │  │  • rating                - User rating (1-5)                │  │   │
│  │  │  • created_at            - Creation timestamp               │  │   │
│  │  │  • updated_at            - Last update timestamp            │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐                      │
│  │   OpenStreetMap     │  │   Google Maps       │                      │
│  │  (Nominatim API)    │  │   Embed API         │                      │
│  ├─────────────────────┤  ├─────────────────────┤                      │
│  │  • Geocoding        │  │  • Map display      │                      │
│  │  • Reverse geocode  │  │  • Location pins    │                      │
│  │  • Zip code lookup  │  │  • Directions       │                      │
│  └─────────────────────┘  └─────────────────────┘                      │
│                                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐                      │
│  │   Outscraper API    │  │   Vercel Analytics  │                      │
│  │   (Data Source)     │  │   & Monitoring      │                      │
│  ├─────────────────────┤  ├─────────────────────┤                      │
│  │  • Event scraping   │  │  • Performance      │                      │
│  │  • Venue data       │  │  • User analytics   │                      │
│  │  • Enrichment       │  │  • Error tracking   │                      │
│  └─────────────────────┘  └─────────────────────┘                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKGROUND PROCESSES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Data Import Scripts                         │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │  • import-santa-cruz-library.js                            │  │   │
│  │  │    - Scrapes Santa Cruz Library events                     │  │   │
│  │  │    - Geocodes locations                                    │  │   │
│  │  │    - Stores in Supabase                                    │  │   │
│  │  │                                                             │  │   │
│  │  │  • backfill-images.js                                      │  │   │
│  │  │    - Generates placeholder images                          │  │   │
│  │  │    - Updates missing image URLs                            │  │   │
│  │  │                                                             │  │   │
│  │  │  • check-events.js                                         │  │   │
│  │  │    - Validates event data                                  │  │   │
│  │  │    - Reports statistics                                    │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Visit Flow

```
User → Vercel CDN → Next.js App → Load Homepage
                                 ↓
                    Check localStorage for location
                                 ↓
                    Display LocationModal if no location
                                 ↓
                    Fetch listings from Supabase
                                 ↓
                    Filter by type, date, location
                                 ↓
                    Calculate distances (client-side)
                                 ↓
                    Render ClickableCards + MapView
```

### 2. Search Flow

```
User types query → SearchModal
                      ↓
          Update search state → Homepage
                                  ↓
              Filter listings by query
                                  ↓
            Search in: title, description, city,
                      tags, place_type, organizer
                                  ↓
                Display filtered results
```

### 3. Filter Flow

```
User clicks filter → FilterModal opens
                          ↓
        User selects filters (price, distance, type, etc.)
                          ↓
                    Click "Save"
                          ↓
              Update filter state → Homepage
                                      ↓
                Apply all active filters
                                      ↓
                  Display results
```

### 4. Event Detail Flow

```
User clicks card → Navigate to /listings/[id]
                              ↓
              Fetch event data from Supabase
                              ↓
          Render EventDetail component
                              ↓
        Display: image, info, map, organizer
```

### 5. Data Import Flow

```
Script runs → Fetch from external source (API/Scraper)
                         ↓
            Parse and normalize data
                         ↓
            Geocode addresses (Nominatim)
                         ↓
          Insert/Update Supabase listings
                         ↓
              Log results
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.x | UI component library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling framework |
| React Icons | 5.x | Icon library (MD, Lu, Pi, Io5) |
| Turbopack | Built-in | Fast dev bundler |

### Backend & Database

| Technology | Purpose |
|-----------|---------|
| Supabase | PostgreSQL database + Auth |
| Vercel | Hosting & deployment |
| Vercel Edge Functions | API routes |

### External APIs

| Service | Purpose |
|---------|---------|
| OpenStreetMap Nominatim | Geocoding & reverse geocoding |
| Google Maps Embed API | Map display in event details |
| Outscraper API | Data scraping (configured) |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Husky | Git hooks |
| dotenv | Environment variables |
| @supabase/supabase-js | Supabase client |

---

## File Structure

```
outta-nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx              - Root layout
│   │   ├── page.tsx                - Homepage (redirects to /)
│   │   ├── globals.css             - Global styles + design system
│   │   ├── chips/
│   │   │   └── page.tsx            - Chip showcase page
│   │   ├── listings/
│   │   │   └── [id]/
│   │   │       └── page.tsx        - Event detail page
│   │   └── api/
│   │       ├── listings/
│   │       │   └── route.ts        - Listings API
│   │       └── search/
│   │           └── route.ts        - Search API
│   │
│   ├── components/
│   │   ├── Homepage.tsx            - Main listing view
│   │   ├── ClickableCard.tsx       - Event card component
│   │   ├── EventDetail.tsx         - Event detail view
│   │   ├── FilterModal.tsx         - Filter interface
│   │   ├── SearchModal.tsx         - Search interface
│   │   ├── LocationModal.tsx       - Location picker
│   │   ├── MapView.tsx             - Map display
│   │   ├── Footer.tsx              - Site footer
│   │   ├── Loader.tsx              - Loading spinner
│   │   ├── Chip.tsx                - Badge components
│   │   ├── ChipShowcase.tsx        - Chip examples
│   │   └── DesignSystemExample.tsx - Design reference
│   │
│   └── lib/
│       ├── supabase.ts             - Supabase client
│       └── design-system-colors.ts - Color scale definitions
│
├── scripts/
│   ├── import-santa-cruz-library.js - Library event importer
│   ├── backfill-images.js          - Image backfill script
│   └── check-events.js             - Event validation script
│
├── public/
│   ├── Outta_logo.svg              - Logo
│   └── placeholder.jpg             - Default image
│
├── .env.local                      - Environment variables
├── next.config.ts                  - Next.js configuration
├── tailwind.config.ts              - Tailwind configuration
├── tsconfig.json                   - TypeScript configuration
├── package.json                    - Dependencies
│
└── Documentation/
    ├── ARCHITECTURE.md             - This file
    ├── CHIP_COMPONENTS.md          - Chip documentation
    ├── COLOR_MIGRATION_GUIDE.md    - Color system guide
    └── STYLING_FIXES.md            - Styling notes
```

---

## Key Features

### 1. **Filtering System**

Supports multiple filter types:
- **Type:** Events, Activities, Camps
- **Date:** Today, Tomorrow, Next Week, Next Month
- **Distance:** 10, 20, 40 miles, or Any
- **Price:** Any, Free, Paid
- **Rating:** Any, 3+, 4+, 4.5+
- **Place Type:** Library, Museum, Park, etc.
- **Tags:** Multiple tag selection
- **Recommended:** Show only curated picks

### 2. **Location Features**

- Browser geolocation with permission
- Zip code manual entry
- Reverse geocoding to get zip from coordinates
- Distance calculation for all listings
- Interactive map with pins
- Embedded Google Maps in detail view

### 3. **Pagination**

- Initial load: 15 items
- "Load More" button loads additional 15
- Maintains filters while loading more
- Separate counts for each tab

### 4. **Search**

- Real-time client-side search
- Searches across: title, description, city, tags, place_type, organizer
- Case-insensitive
- Works with filters

### 5. **Design System**

Six color scales with 11 shades each:
- **Broom** (#FFF407): Primary yellow, buttons
- **Flamenco** (#FF7E08): Orange accents, borders
- **Lavender Magenta** (#F540F5): Purple for badges
- **Emerald** (#35CB75): Green for success/deals
- **Malibu** (#DFF2FF): Light blue backgrounds
- **Black** (50-950): Grayscale system

### 6. **Chip System**

Six badge variants for content labeling:
- **Scout Pick:** Editor-curated (purple + verified icon)
- **Deal:** Discounts (green + tag icon)
- **Promoted:** Sponsored (blue + megaphone icon)
- **New:** Recent listings (yellow)
- **Coming Soon:** Upcoming (gray)
- **Top Rated:** Highly rated (orange + trophy icon)

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Optional: API Keys
OUTSCRAPER_API_KEY=[key]
```

---

## Deployment

### Production

- **Platform:** Vercel
- **Domain:** outta.events
- **Auto-deploy:** On push to main branch
- **Build Command:** `npm run build`
- **Output:** `.next/` directory

### Build Process

```
1. Install dependencies (npm install)
2. Run ESLint (npm run lint)
3. Run TypeScript check (npm run type-check)
4. Build Next.js app (next build)
5. Deploy to Vercel edge network
```

---

## Database Schema

### listings Table

```sql
CREATE TABLE listings (
  airtable_id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR CHECK (type IN ('Event', 'Activity', 'Camp')),
  description TEXT,
  image VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  city VARCHAR,
  state VARCHAR,
  zip INTEGER,
  street VARCHAR,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR,
  price VARCHAR,
  age_range VARCHAR,
  organizer VARCHAR,
  website VARCHAR,
  tags TEXT,
  place_type VARCHAR,
  recommended BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_start_date ON listings(start_date);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_recommended ON listings(recommended);
CREATE INDEX idx_listings_location ON listings(latitude, longitude);
```

---

## Performance Considerations

### Current Optimizations

1. **Client-side filtering:** Fast filtering without API calls
2. **Pagination:** Load only 15 items initially
3. **Static assets:** Cached at CDN edge
4. **Image optimization:** Next.js Image component
5. **Code splitting:** Automatic route-based splitting
6. **Turbopack:** Fast HMR in development

### Known Issues

1. **Location requirement:** 71% of events missing lat/long
   - **Impact:** Events without location don't show
   - **Solution needed:** Geocoding script for existing data

2. **Future events filter:** Only shows events with `start_date >= now()`
   - **Current:** 15 future events from 135 total
   - **Solution needed:** Backfill missing coordinates

---

## Security

- **API Keys:** Stored in environment variables
- **Supabase RLS:** Row-level security enabled
- **HTTPS:** Enforced on all connections
- **CORS:** Configured for outta.events domain
- **Secrets:** Not committed to Git (.env.local in .gitignore)

---

## Future Enhancements

### Planned Features (from Chip Documentation)

1. Add chip badge fields to database
2. Implement automatic "New" badge (< 7 days old)
3. Implement automatic "Top Rated" badge (rating >= 4.0)
4. Add user reviews and ratings
5. Implement "Scout Pick" curation workflow
6. Add promotional/sponsored listing support
7. Integrate payment for promoted listings

### Technical Debt

1. Geocode all existing listings
2. Consolidate duplicate filtering logic (hasMore, handleLoadMore, applyFiltersAndSort)
3. Add unit tests
4. Add error boundaries
5. Implement proper loading states
6. Add accessibility improvements (ARIA labels, keyboard nav)
7. Optimize bundle size

---

## Monitoring & Analytics

- **Vercel Analytics:** Page views, performance metrics
- **Error Tracking:** Vercel runtime logs
- **Build Logs:** Available in Vercel dashboard
- **Database Metrics:** Supabase dashboard

---

## Version History

- **v1.0** (2025-12): Initial launch with Events, Activities, Camps
- **v1.1** (2025-12): Design system color migration
- **v1.2** (2025-12): Chip component system added
- **v1.3** (2025-12): Pagination fixes, location improvements

---

## Support & Contact

- **Repository:** github.com/rfinch11/outta-nextjs
- **Email:** hello@outta.events
- **Website:** https://outta.events
