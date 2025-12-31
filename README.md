# Outta

**Production Site:** [outta.events](https://outta.events) • [www.outta.events](https://www.outta.events)
**GitHub:** [rfinch11/outta-nextjs](https://github.com/rfinch11/outta-nextjs)
**Status:** ✅ Live in Production

Outta is a kid-friendly adventures discovery platform built with Next.js 16, TypeScript, and Tailwind CSS. Find amazing activities, events, and camps for kids near you.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Forms:** Typeform (@typeform/embed-react)
- **Icons:** React Icons (Lucide)
- **Automation:** Vercel Cron Jobs (RSS ingestion, image fetching, geocoding)
- **APIs:** BiblioCommons RSS, Unsplash, Google Maps Geocoding

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/rfinch11/outta-nextjs.git
cd outta-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Development

```bash
# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
outta-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   └── listings/[id]/      # Dynamic listing detail pages
│   ├── components/             # React components
│   │   ├── Homepage.tsx        # Main homepage component
│   │   ├── ClickableCard.tsx   # Listing card component
│   │   ├── SearchModal.tsx     # Search modal
│   │   ├── FilterModal.tsx     # Filter modal
│   │   ├── LocationModal.tsx   # Location picker
│   │   ├── SubmitModal.tsx     # Typeform submission modal
│   │   ├── EventDetail.tsx     # Listing detail page
│   │   └── Footer.tsx          # Footer component
│   └── lib/                    # Utilities
│       └── supabase.ts         # Supabase client
├── public/                     # Static assets
│   ├── Outta_logo.svg
│   ├── hero.png
│   └── favicon.png
├── .env.local                  # Environment variables (not committed)
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── tsconfig.json               # TypeScript config
```

## 🔧 Development Workflow

We use Git pre-commit hooks to ensure code quality:
- TypeScript type checking
- ESLint linting

All checks must pass before committing.

## 🌍 Environment Variables

Required environment variables:

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase (Server-side only)
SUPABASE_SERVICE_KEY=your_service_role_key

# External APIs (for automated cron jobs)
UNSPLASH_ACCESS_KEY=your_unsplash_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
CRON_SECRET=your_secret_for_cron_authentication
```

## 🚀 Deployment

The site is deployed on Vercel with automatic deployments from the `main` branch:

- **Production:** [outta.events](https://outta.events) • [www.outta.events](https://www.outta.events)
- **Staging:** [outta-nextjs.vercel.app](https://outta-nextjs.vercel.app)

### Production Deployment

Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

Vercel automatically builds and deploys to outta.events with zero downtime.

## 🤖 Automated Data Pipeline

Outta features a fully automated data pipeline that runs daily via Vercel Cron Jobs:

### RSS Feed Ingestion (9 AM UTC / 1 AM PT)
- **Source:** BiblioCommons library RSS feeds
- **Libraries:** Palo Alto, San Mateo County, Santa Clara County
- **Processing:**
  - Parses RSS feeds with custom field extraction
  - Decodes HTML entities and cleans descriptions
  - Converts Pacific Time timestamps to ISO format
  - Deduplicates using RSS GUID
  - Automatically imports new events daily

### Unsplash Image Automation (10 AM UTC / 2 AM PT)
- **Purpose:** Fetches high-quality images for listings without images
- **Strategy:** Progressive fallback system with 5 search tiers
  1. All tags + 'kids'
  2. First tag + 'kids'
  3. Title keywords + 'kids'
  4. Smart category detection (e.g., storytime → "children reading books")
  5. Generic fallbacks ("kids activities", "children playing", "family events")
- **Features:**
  - 100% image coverage guaranteed
  - Deduplication tracking via `unsplash_photo_id`
  - Landscape orientation, high content filter
  - 79% unique photo usage across 123 listings

### Geocoding Automation (11 AM UTC / 3 AM PT)
- **Purpose:** Converts addresses to latitude/longitude coordinates
- **API:** Google Maps Geocoding API
- **Address Building:**
  - Primary: street + city + state + zip
  - Fallback: location_name + city + state
- **Results:** 92% geocoding coverage (2269/2465 listings)
- **Rate Limiting:** 100ms delay between requests

### Migration from Airtable
The project has been fully migrated from Airtable to a Supabase-native architecture:
- ✅ Removed Airtable dependency completely
- ✅ All data now flows directly: RSS → Supabase
- ✅ Automated enrichment (images, geocoding) via cron jobs
- ✅ No manual intervention required

## ✨ Features

- **Tab Navigation:** Browse Events, Activities, and Camps
- **Search:** Full-text search across all listings
- **Filters:** Distance, date, price, type, tags, and rating filters
- **Location:** Geolocation and zip code-based distance calculations
- **Listing Details:** Rich detail pages with maps, organizer info, and sharing
- **Submit Listings:** Integrated Airtable form for community submissions
- **Load More Pagination:** Infinite scroll with 15 items per page
- **Mobile Responsive:** Bottom sheet modals and mobile-first design

## 🗄 Database Schema

Powered by Supabase PostgreSQL with the following main tables:

### listings Table
Core table for all events, activities, and camps with:
- **Deduplication:** `rss_guid` (RSS feed unique ID), `airtable_id` (legacy ID)
- **Source Tracking:** `source_name` (e.g., "Palo Alto Library")
- **Image Management:** `image` (URL), `unsplash_photo_id` (deduplication tracking)
- **Geolocation:** `latitude`, `longitude`, `street`, `city`, `state`, `zip`
- **Metadata:** `title`, `description`, `type`, `start_date`, `tags`, `organizer`
- **Curation:** `recommended` (boolean), `rating` (1-5)

### Future Tables
- `profiles` - User accounts and preferences
- `favorites` - Saved listings
- `reviews` - User ratings and reviews

## 📝 License

Private - All Rights Reserved

---

**Built with ❤️ by Ryan Finch**
