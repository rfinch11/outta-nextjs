# CLAUDE.md - Project Context for AI Assistance

**Last Updated:** January 18, 2026
**Project:** Outta - Kid-Friendly Adventures Discovery Platform
**Production URL:** [outta.events](https://outta.events)
**Status:** ✅ Live in Production

This file provides essential context for Claude and other AI assistants working on the Outta codebase.

---

## 🎯 Project Overview

Outta is a production-grade Next.js application that helps families discover kid-friendly events, activities, and camps near them. The platform features a fully automated data pipeline that ingests events from multiple sources, enriches them with images and geocoding, and presents them through an intuitive filtering and search interface.

**Key Numbers:**
- 2,465+ active listings
- 7 automated data sources
- 9 daily automated jobs (7 import + 2 enrichment)
- 92% geocoding coverage
- 100% image coverage (automated via Unsplash)

---

## 🛠 Tech Stack

### Core Technologies
- **Framework:** Next.js 16.0.7 (App Router with React Server Components)
- **Language:** TypeScript 5 (strict mode enabled)
- **Styling:** Tailwind CSS v4 with custom design system
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (auto-deploy from `main` branch)
- **Testing:** Jest + Playwright

### Key Dependencies
- **UI:** React 19, React Icons (Lucide, Bi)
- **Animation:** Framer Motion (card stack hero, transitions)
- **Modals:** Vaul (responsive drawer/modal system)
- **Data:** @supabase/supabase-js, rss-parser, cheerio
- **Maps:** @react-google-maps/api, Google Maps API
- **Time:** luxon (Pacific Time → ISO 8601 conversion)
- **HTML:** he (HTML entity decoding)
- **Automation:** Playwright (for scrapers)

### Development Tools
- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- **Git Hooks:** Husky (pre-commit type checking + linting)
- **Type Checking:** TypeScript strict mode
- **Package Manager:** npm

---

## 📁 Project Structure

```
outta-nextjs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Geist font)
│   │   ├── page.tsx                  # Homepage
│   │   ├── globals.css               # Design system colors + global styles
│   │   ├── listings/[id]/page.tsx    # Dynamic event detail pages
│   │   ├── filter/[type]/page.tsx    # Filter pages (events, place types)
│   │   └── api/                      # API routes + Vercel cron jobs
│   │       ├── listings/route.ts     # Fetch listings
│   │       ├── search/route.ts       # Search endpoint
│   │       ├── place-photo/route.ts  # Google Places photo proxy
│   │       ├── place-details/route.ts # Cached Google Place details (manual refresh)
│   │       ├── ingest-rss/route.ts   # RSS feed cron (8 AM UTC)
│   │       ├── fetch-unsplash-images/route.ts  # Image cron (10 AM UTC)
│   │       └── geocode-listings/route.ts       # Geocoding cron (11 AM UTC)
│   │
│   ├── components/                   # React components (32 total)
│   │   ├── Homepage.tsx              # Main page component
│   │   ├── DraggableHero.tsx         # Card stack hero with Framer Motion
│   │   ├── FilterBar.tsx             # Horizontal filter button bar
│   │   ├── FilterPageContent.tsx     # Filter page with drawer/modal filters
│   │   ├── ClickableCard.tsx         # Event card with badge overlays
│   │   ├── EventDetail.tsx           # Detail page view
│   │   ├── FilterModal.tsx           # Advanced filtering UI
│   │   ├── SearchModal.tsx           # Search interface
│   │   ├── LocationModal.tsx         # Location picker (geolocation + zip)
│   │   ├── MapView.tsx               # Google Maps integration
│   │   ├── TabBar.tsx                # Events/Activities/Camps tabs
│   │   ├── MenuPopover.tsx           # Navigation popover menu
│   │   ├── Chip.tsx                  # Badge system (6 variants)
│   │   ├── Footer.tsx                # Site footer
│   │   └── __tests__/                # Component tests
│   │
│   └── lib/
│       └── supabase.ts               # Supabase client + TypeScript types
│
├── scripts/                          # Data import & automation
│   ├── import-ebparks-events.js      # East Bay Parks scraper (Playwright)
│   ├── import-santa-cruz-library.js  # Santa Cruz Library import
│   ├── import-badm-events.js         # Bay Area Discovery Museum scraper
│   ├── import-eventbrite-events.js   # Eventbrite Bay Area scraper
│   ├── refresh-place-details.js      # Manual Google Place details refresh
│   ├── backfill-images.js            # Image backfill utilities
│   └── [45+ utility scripts]
│
├── .github/workflows/                # GitHub Actions
│   ├── import-ebparks-events.yml     # Daily at 9 AM UTC
│   ├── import-santa-cruz-events.yml  # Daily at 6 AM UTC
│   ├── import-badm-events.yml        # Daily at 8 AM UTC
│   └── import-eventbrite-events.yml  # Daily at 7 AM UTC
│
├── Documentation/
│   ├── ARCHITECTURE.md               # System architecture (744 lines)
│   ├── DATA_SOURCES.md               # Data pipeline docs
│   ├── README.md                     # Project overview
│   └── [Component-specific docs]
│
├── vercel.json                       # Cron job schedules
├── next.config.ts                    # Next.js config (remote image patterns)
├── tsconfig.json                     # TypeScript strict mode config
└── package.json                      # Dependencies
```

---

## 🎨 Design System

### Design System v2 (January 2026)
Based on Vercel Geist Design System with Outta brand colors.

### Typography
- **Primary Font:** Geist Sans (via `geist` package)
- **Monospace Font:** Geist Mono (for code/technical content)
- Loaded in `src/app/layout.tsx`

### Color Scales (6 palettes, 11 shades each: 50-950)
Defined in `src/app/globals.css` using Tailwind v4 `@theme` inline:

- **Broom** (Yellow/Brown): Primary accent, buttons, highlights
- **Flamenco** (Orange): Accents, borders, CTAs
- **Lavender Magenta** (Purple): Badges, Scout Pick chip
- **Emerald** (Green): Success states, Deal chip
- **Malibu** (Blue): Backgrounds, info states
- **Black** (Grayscale 50-950): Text, borders, backgrounds

### Icons
- **Primary:** Lucide icons via `react-icons/lu`
- **Navigation:** BiNavigation from `react-icons/bi`
- See `src/lib/placeTypeIcons.ts` for place type mappings

### Component System
- **Modals/Drawers:** Vaul (`vaul` package) - bottom sheet on mobile, centered on desktop
- **ResponsiveModal:** `src/components/ui/ResponsiveModal.tsx` - wrapper component
- **Chip Badges:** 6 variants with Lucide icons and subtle borders
- **Cards:** ClickableCard with hover effects and material-like styling

### Key Design Files
- `DESIGN_SYSTEM_V2.md` - Full design system documentation
- `src/lib/design-system-colors.ts` - Color scale definitions
- `src/hooks/useMediaQuery.ts` - Responsive breakpoint detection

---

## 🚀 Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with required keys (see Environment Variables section)

# Run development server
npm run dev  # http://localhost:3000

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### Scripts

```bash
npm run dev             # Start dev server (Turbopack)
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm run format         # Prettier formatting
npm run type-check     # TypeScript type checking
npm run test           # Jest tests
npm run test:watch     # Jest watch mode
npm run test:e2e       # Playwright E2E tests
npm run ship           # Custom deployment script
```

### Pre-commit Hooks (Husky)
Automatically runs before every commit:
1. TypeScript type checking (`npm run type-check`)
2. ESLint linting (`npm run lint`)

All checks must pass before commit succeeds.

---

## 🌍 Environment Variables

### Required Variables

```bash
# Supabase (Public - client-side safe)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[google-maps-key]

# Supabase (Server-side only - for cron jobs)
SUPABASE_SERVICE_KEY=[service-role-key]

# External APIs (for automated jobs)
UNSPLASH_ACCESS_KEY=[unsplash-access-key]
GOOGLE_MAPS_API_KEY=[google-maps-api-key]

# Cron Security
CRON_SECRET=[secret-for-cron-authentication]
```

**Note:** `.env.local` is in `.gitignore` and should never be committed.

---

## 🗄 Database Schema

### listings Table (Supabase PostgreSQL)

**Primary Key:** `airtable_id` (VARCHAR) - Legacy format preserved for compatibility

**Key Fields:**
- **Unique IDs & Source Tracking:**
  - `airtable_id` (PK): e.g., `ebparks_57722`, `rec...` (Airtable legacy)
  - `rss_guid`: BiblioCommons unique ID (for RSS deduplication)
  - `source_name`: e.g., "Palo Alto Library", "East Bay Regional Park District"

- **Core Content:**
  - `title`, `description` (HTML cleaned), `type` (Event/Activity/Camp)
  - `start_date` (TIMESTAMP WITH TIME ZONE, ISO 8601 format)

- **Image Management:**
  - `image`: Image URL (Unsplash or original source)
  - `unsplash_photo_id`: For deduplication tracking

- **Location:**
  - `latitude`, `longitude`: Geocoded coordinates (92% coverage)
  - `street`, `city`, `state`, `zip`: Address components
  - `location_name`: Venue name (e.g., park name)

- **Metadata:**
  - `price`, `age_range`, `organizer`, `website`, `tags`, `place_type`

- **Curation:**
  - `recommended` (BOOLEAN): Curated picks
  - `rating` (DECIMAL 2,1): 1-5 rating
  - `scout_pick` (BOOLEAN): Editor's choice

- **Google Place Details (Cached):**
  - `place_id`: Google Place ID for the location
  - `google_place_details` (JSONB): Cached Google Place data including:
    - `photos`: Array of `{url, width, height}` for place photos
    - `rating`: Google Places rating (1-5)
    - `userRatingsTotal`: Number of Google reviews
    - `reviews`: Array of `{authorName, rating, text, relativeTimeDescription}`
    - `openingHours`: `{isOpen, weekdayText[]}` for business hours
  - `place_details_updated_at` (TIMESTAMP): When cache was last refreshed

**Indexes:**
- Performance: `type`, `start_date`, `city`, `recommended`, `location` (lat/lng)
- Deduplication: `rss_guid`, `unsplash_photo_id`, `source_name`

---

## 🤖 Automated Data Pipeline

### Overview
**9 daily automated jobs** (fully autonomous, zero manual intervention):
- **7 data sources:** 4 Playwright scrapers + 3 RSS feeds
- **2 enrichment pipelines:** Unsplash images + Google Maps geocoding

### Vercel Cron Jobs (configured in `vercel.json`)

1. **RSS Feed Ingestion** (8 AM UTC / 12 AM PT)
   - Path: `/api/ingest-rss`
   - Sources: Palo Alto, San Mateo County, Santa Clara County libraries
   - BiblioCommons RSS with custom field parsing
   - HTML entity decoding, Pacific Time → ISO 8601 conversion
   - Deduplicates via `rss_guid`

2. **Unsplash Image Automation** (10 AM UTC / 2 AM PT)
   - Path: `/api/fetch-unsplash-images`
   - 5-tier progressive fallback search strategy
   - Deduplication tracking via `unsplash_photo_id`
   - 100% image coverage guaranteed
   - 79% unique photo usage

3. **Geocoding Automation** (11 AM UTC / 3 AM PT)
   - Path: `/api/geocode-listings`
   - Google Maps Geocoding API
   - Address building with fallbacks
   - 92% coverage (2,269/2,465 listings)
   - 100ms rate limiting

### GitHub Actions Scrapers

1. **East Bay Regional Park District** (9 AM UTC / 1 AM PT)
   - Workflow: `.github/workflows/import-ebparks-events.yml`
   - Script: `scripts/import-ebparks-events.js`
   - Playwright-based React SPA scraping
   - ~97 events per run

2. **Santa Cruz Public Libraries** (6 AM UTC / 10 PM PT)
   - Workflow: `.github/workflows/import-santa-cruz-events.yml`
   - iCal feed parsing + web scraping

3. **Bay Area Discovery Museum** (8 AM UTC / 12 AM PT)
   - Workflow: `.github/workflows/import-badm-events.yml`
   - Museum event listing scraping

4. **Eventbrite Bay Area** (7 AM UTC / 11 PM PT)
   - Workflow: `.github/workflows/import-eventbrite-events.yml`
   - JSON extraction from embedded data

**Migration Note:** Fully migrated from Airtable to Supabase-native architecture (December 2025). All scrapers now write directly to Supabase with no external dependencies.

---

## 🎯 Key Features

### User-Facing Features
1. **Card Stack Hero:** Animated card carousel with family activity images
   - Auto-rotates every 2 seconds until user interaction
   - Click to cycle through cards
   - Framer Motion spring animations
   - Responsive: centered on mobile, side-by-side on desktop

2. **Filter Pages:** `/filter/[type]` routes for filtered views
   - Events page with date-based sorting
   - Place type pages (Museum, Park, etc.) sorted by distance
   - FilterBar with animated button selection
   - Filter drawer (mobile) / modal (desktop) with:
     - Date filter (events only)
     - Distance slider with Airbnb-style histogram
     - Rating filter (activities only)

3. **Tab Navigation:** Events, Activities, Camps (on homepage)

4. **Advanced Filtering:**
   - Distance: 10, 20, 40 miles (homepage) or slider 0-50 miles (filter pages)
   - Date: Today, Tomorrow, This Week, This Month
   - Price: Free, Paid, Any
   - Type: Events, Activities, Camps
   - Tags: Multi-select
   - Rating: 3+, 4+, 4.5+
   - Recommended only toggle

5. **Search:** Real-time client-side search across title, description, city, tags, organizer

6. **Location Services:**
   - Browser geolocation with permission
   - Zip code manual entry
   - Distance calculation (client-side)

7. **Event Details:** Rich detail pages with images, maps, metadata, sharing
8. **Pagination:** Load 15 items initially, "Load More" button
9. **Responsive Design:** Mobile-first with Vaul drawers on mobile, modals on desktop

### Technical Features
- **Client-side filtering:** All filters applied instantly without API calls
- **Framer Motion:** Smooth animations for hero cards and UI transitions
- **React Server Components:** Used in layout and page routes
- **Dynamic imports:** Modals loaded on-demand to reduce bundle size
- **Image optimization:** Next.js Image component with Unsplash CDN
- **State management:** React hooks + URL parameters
- **Responsive modals:** Vaul drawers on mobile, centered modals on desktop

---

## 📝 Code Conventions

### TypeScript
- **Strict mode:** Enabled in `tsconfig.json`
- **Path aliases:** `@/*` maps to `./src/*`
- **Target:** ES2017
- All components must be typed
- No implicit `any` types

### React
- **Functional components** with hooks (no class components)
- **React Server Components** for pages and layouts
- **"use client"** directive for interactive components
- Props interfaces defined at component level

### Styling
- **Tailwind CSS v4** with `@theme` inline in `globals.css`
- Utility-first approach
- Custom color scales (6 palettes)
- Responsive design using Tailwind breakpoints

### File Organization
- One component per file
- Co-located tests in `__tests__/` directories
- Component-specific types in same file or adjacent `.types.ts`
- API routes in `src/app/api/[route]/route.ts`

### Naming Conventions
- **Components:** PascalCase (e.g., `ClickableCard.tsx`)
- **Files:** kebab-case for scripts (e.g., `import-ebparks-events.js`)
- **Directories:** lowercase (e.g., `components/`, `api/`)
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase

### Git Workflow
- **Main branch:** `main` (auto-deploys to production)
- **Feature branches:** Descriptive names (e.g., `add-filter-modal`)
- **Commits:** Clear, descriptive messages
- **Pre-commit hooks:** Automatic type checking + linting

---

## 🚀 Deployment

### Production
- **Platform:** Vercel
- **Domain:** outta.events + www.outta.events
- **Trigger:** Push to `main` branch
- **Build Command:** `npm run build`
- **Process:**
  1. Install dependencies
  2. Run ESLint
  3. Run TypeScript check
  4. Build Next.js app
  5. Deploy to edge network with zero downtime

### Staging
- **URL:** outta-nextjs.vercel.app
- Auto-deploy from preview branches

---

## 🔍 Important Files & Their Purposes

| File | Purpose |
|------|---------|
| `src/components/Homepage.tsx` | Main page component with filtering logic |
| `src/components/EventDetail.tsx` | Listing detail view - **uses cached google_place_details from props** |
| `src/components/DraggableHero.tsx` | Card stack hero with Framer Motion animations |
| `src/components/FilterBar.tsx` | Horizontal filter button navigation bar |
| `src/components/FilterPageContent.tsx` | Filter page with drawer/modal filters |
| `src/lib/supabase.ts` | Supabase client configuration and TypeScript types |
| `src/app/globals.css` | Design system colors (6 palettes) and global styles |
| `src/app/filter/[type]/page.tsx` | Dynamic filter page route |
| `src/app/api/ingest-rss/route.ts` | Daily RSS feed ingestion cron job |
| `src/app/api/fetch-unsplash-images/route.ts` | Daily image automation cron job |
| `src/app/api/geocode-listings/route.ts` | Daily geocoding cron job |
| `vercel.json` | Cron job schedules |
| `next.config.ts` | Next.js configuration (remote image domains) |
| `ARCHITECTURE.md` | Comprehensive system architecture documentation |
| `DATA_SOURCES.md` | Data pipeline and source documentation |

---

## 🧪 Testing

### Test Framework
- **Unit Tests:** Jest with Testing Library
- **E2E Tests:** Playwright
- **Coverage:** `npm run test:coverage`

### Test Locations
- Component tests: `src/components/__tests__/`
- E2E tests: `e2e/` directory
- Test utilities: `jest.config.js`, `playwright.config.ts`

---

## ⚠️ Important Context for Development

### Migration History
- **December 2025:** Complete migration from Airtable to Supabase
- All scrapers updated to write directly to Supabase
- Field names changed from capitalized (Airtable) to lowercase (Supabase)
- `airtable_id` format preserved for backwards compatibility

### Data Quality Considerations
- **Image Coverage:** 100% automated, no manual intervention needed
- **Geocoding Coverage:** 92% (196 listings lack address data)
- **Deduplication:**
  - RSS feeds: `rss_guid` unique constraint
  - Images: `unsplash_photo_id` tracking
  - Events: Source-specific unique IDs (e.g., `ebparks_57722`)

### Google Place Details Architecture (CRITICAL)
**This pattern is critical to understand - getting it wrong breaks listing detail pages.**

Google Place details (photos, ratings, reviews, hours) are **cached in Supabase** to control API costs. They are NOT fetched live from Google Places API on every page load.

**Data Flow:**
1. `scripts/refresh-place-details.js` fetches data from Google Places API and stores in `google_place_details` column
2. Listing page (`src/app/listings/[id]/page.tsx`) fetches listing from Supabase including `google_place_details`
3. Listing page passes `google_place_details` as a prop to `EventDetail` component
4. `EventDetail` uses the cached data from props, with API hook as fallback only

**Critical Pattern in EventDetail.tsx:**
```typescript
// EventDetail receives google_place_details via props (from database cache)
const { google_place_details } = props;

// Only fetch from API if NOT already cached in props
const { data: fetchedPlaceDetails } = usePlaceDetails(
  google_place_details ? null : place_id  // Pass null to skip API call if cached
);

// Prefer cached data from props, fall back to fetched data
const placeDetails = google_place_details || fetchedPlaceDetails;
```

**Common Mistake (DO NOT DO THIS):**
```typescript
// WRONG: Always fetching from API, ignoring cached data from props
const { data: placeDetails } = usePlaceDetails(place_id);
// This ignores google_place_details prop and makes unnecessary API calls
```

**Why This Matters:**
- ~434 listings have cached Google Place data
- If EventDetail ignores the prop and only uses the API hook, all cached data is wasted
- The `/api/place-details` endpoint exists for manual refresh, not routine page loads

### Performance Considerations
- **Client-side filtering:** Fast but loads all data initially
- **Pagination:** Reduces initial load to 15 items
- **Image optimization:** Uses Next.js Image component
- **Code splitting:** Dynamic imports for modals
- **Edge caching:** Static assets cached at CDN

### Current Limitations
- No user authentication (planned)
- No user reviews (planned)
- No favorites/bookmarks (planned)
- Distance calculation is client-side only
- Search is client-side only (full-text search planned)

---

## 🆘 Common Tasks

### Adding a New Data Source
1. Create scraper script in `scripts/`
2. Add GitHub Actions workflow in `.github/workflows/`
3. Update `DATA_SOURCES.md`
4. Test locally with `node scripts/your-script.js`
5. Deploy and verify in Vercel cron logs

### Adding a New Component
1. Create component file in `src/components/`
2. Add "use client" directive if interactive
3. Define TypeScript interface for props
4. Use Tailwind for styling (design system colors)
5. Add tests in `__tests__/` directory
6. Export from component file

### Modifying Filters
1. Update filter state in `Homepage.tsx`
2. Modify `applyFiltersAndSort()` function
3. Update `FilterModal.tsx` UI
4. Ensure filter state persists in URL params if needed
5. Test all filter combinations

### Debugging Cron Jobs
1. Check Vercel deployment logs
2. Test endpoint manually: `curl https://outta.events/api/[endpoint]?cron_secret=XXX`
3. Review Supabase logs for database errors
4. Check external API rate limits (Unsplash, Google Maps)

### Refreshing Google Place Details (Manual Process)
Google Place details (photos, hours, ratings, reviews) are cached in Supabase and must be manually refreshed to control API costs.

```bash
# Preview what would be refreshed (dry run)
node scripts/refresh-place-details.js --dry-run

# Refresh listings with no cached data
node scripts/refresh-place-details.js --limit 50

# Refresh stale cache (>7 days old)
node scripts/refresh-place-details.js --stale --limit 50

# Refresh specific place
node scripts/refresh-place-details.js --place-id ChIJxxxxxxxx

# Refresh all listings (use sparingly)
node scripts/refresh-place-details.js --all
```

**Cost:** ~$0.017 per listing. Run `--dry-run` first to estimate costs.

---

## 📚 Additional Resources

- **Production Site:** [outta.events](https://outta.events)
- **GitHub:** [rfinch11/outta-nextjs](https://github.com/rfinch11/outta-nextjs)
- **Architecture Docs:** `ARCHITECTURE.md`
- **Data Sources:** `DATA_SOURCES.md`
- **Deployment Guide:** `SHIP_TO_PRODUCTION.md`

---

## 🎯 When Working on This Codebase

### Do:
- Run `npm run type-check` before committing
- Follow existing patterns and conventions
- Update documentation when making architectural changes
- **Always test locally first** before any deployment
- Use design system colors (no arbitrary color values)
- Write TypeScript interfaces for all props
- Add comments for complex logic
- **Use cached data from props before falling back to API hooks** (see Google Place Details Architecture)

### Don't:
- **NEVER push to production (`git push`) without explicit user approval** - commit locally and wait for "push to prod" instruction
- Commit `.env.local` or API keys
- Push directly to `main` without testing
- Skip pre-commit hooks
- Use `any` type in TypeScript
- Create arbitrary color values outside design system
- Ignore ESLint warnings
- Modify database schema without documentation update
- **NEVER ignore props data in favor of API hooks** - if a component receives cached data via props, use it first (see Google Place Details Architecture)

### Ask Before:
- Making breaking changes to database schema
- Modifying cron job schedules
- Changing core filtering logic
- Adding new external API dependencies
- Removing existing features

---

**Built with ❤️ by Ryan Finch**

*This file was last updated: January 18, 2026*
