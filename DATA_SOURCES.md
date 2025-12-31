# Outta Data Sources Documentation

**Last Updated:** December 31, 2025
**Status:** ✅ All sources migrated to Supabase
**Architecture:** Direct Supabase imports, zero Airtable dependency

This document provides a comprehensive overview of all automated data sources, enrichment pipelines, and data flows for the Outta platform.

---

## 📊 Data Pipeline Overview

Outta uses a fully automated data pipeline with **9 automated jobs** running daily:
- **7 Primary Data Sources** (4 scrapers + 3 RSS feeds)
- **2 Enrichment Pipelines** (images + geocoding)

All data flows directly into Supabase PostgreSQL with automated enrichment to ensure 100% image coverage and 92% geocoding coverage.

---

## 🤖 GitHub Actions Scrapers (Daily Automated)

Custom Playwright-based scrapers that import events directly to Supabase.

### 1. East Bay Regional Park District ✅

**Production Status:** Live (97 events imported on first run)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 9 AM UTC (1 AM PT) |
| **Script** | `scripts/import-ebparks-events.js` |
| **Workflow** | `.github/workflows/import-ebparks-events.yml` |
| **Method** | Playwright scraping (React SPA) |
| **Source URL** | https://www.ebparks.org/calendar |
| **Unique ID Format** | `ebparks_XXXXX` (extracted from event URL) |
| **Documentation** | `scripts/README-ebparks.md` |

**Features:**
- Scrapes 10 pages of calendar listings
- Playwright for React SPA detail pages
- Full descriptions with proper formatting
- Automatic price, age range, and location extraction
- Images set to null for Unsplash automation

**Data Fields:**
- Title, Description, Start Date
- Park Name (location_name), City, State
- Price, Age Range, Event Type
- Event URL (for deduplication)

---

### 2. Santa Cruz Public Libraries ✅

**Production Status:** Live (migrated from Airtable)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 6 AM UTC (10 PM PT) |
| **Script** | `scripts/import-santa-cruz-library.js` |
| **Workflow** | `.github/workflows/import-santa-cruz-events.yml` |
| **Method** | iCal feed parsing + web scraping |
| **Source URL** | Santa Cruz Library iCal feed |

**Features:**
- iCal feed parsing for event discovery
- Web scraping for detail pages
- Geo coordinates and address parsing
- Full event metadata extraction

**Migration Notes:**
- Migrated from Airtable December 2025
- Updated environment variables (SUPABASE_SERVICE_KEY)
- Changed field names to lowercase
- Fixed source column handling

---

### 3. Bay Area Discovery Museum (BADM) ✅

**Production Status:** Live (migrated from Airtable)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 8 AM UTC (12 AM PT) |
| **Script** | `scripts/import-badm-events.js` |
| **Workflow** | `.github/workflows/import-badm-events.yml` |
| **Method** | Event listing + detail page scraping |
| **Source URL** | https://bayareadiscoverymuseum.org |
| **Documentation** | `scripts/README-badm.md` |

**Features:**
- Museum-specific event scraping
- Detail page extraction for descriptions and pricing
- Date parsing and price extraction
- Full event metadata

**Migration Notes:**
- Migrated from Airtable December 2025
- Renamed mapEventToAirtable → mapEventToSupabase
- Updated all database operations to Supabase client

---

### 4. Eventbrite Bay Area ✅

**Production Status:** Live (migrated from Airtable)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 7 AM UTC (11 PM PT) |
| **Script** | `scripts/import-eventbrite-events.js` |
| **Workflow** | `.github/workflows/import-eventbrite-events.yml` |
| **Method** | JSON extraction from embedded data |
| **Source URL** | Eventbrite search (SF Bay Area) |
| **Documentation** | `scripts/README-eventbrite.md` |

**Features:**
- JSON extraction from page scripts
- Multi-city support (SF Bay Area)
- Full description scraping from event pages
- Kid-friendly event filtering

**Migration Notes:**
- Migrated from Airtable December 2025
- Updated all database operations
- Changed field mappings to lowercase

---

## 📡 RSS Feed Ingestion (Vercel Cron)

BiblioCommons library RSS feeds with custom field extraction.

### 5-7. Library RSS Feeds ✅

**Production Status:** Live (already on Supabase)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 9 AM UTC (1 AM PT) |
| **API Route** | `src/app/api/ingest-rss/route.ts` |
| **Method** | RSS parsing with custom fields |
| **Deduplication** | RSS GUID (`rss_guid` column) |

**Libraries Configured:**

1. **Palo Alto Library**
   - Feed: `https://gateway.bibliocommons.com/v2/libraries/paloalto/rss/events`
   - Source Name: "Palo Alto Library"

2. **San Mateo County Library**
   - Feed: `https://gateway.bibliocommons.com/v2/libraries/smcl/rss/events`
   - Source Name: "San Mateo County Library"

3. **Santa Clara County Library**
   - Feed: `https://gateway.bibliocommons.com/v2/libraries/sccl/rss/events?audiences=...`
   - Source Name: "Santa Clara County Library"
   - Filter: Kid-friendly audiences only

**Features:**
- Parses RSS feeds with custom BiblioCommons fields
- Decodes HTML entities and cleans descriptions
- Converts Pacific Time to ISO format timestamps
- Deduplicates using RSS GUID
- Automatic image extraction from RSS metadata

**Field Extraction:**
```typescript
customFields: {
  'ev:location': ['ev:location'],
  'ev:address': ['ev:address', 'address'],
  'ev:startdate': ['ev:startdate'],
  'ev:image': ['ev:image'],
  'ev:city': ['ev:city']
}
```

---

## 🎨 Data Enrichment Pipeline (Vercel Cron)

Automated enrichment ensures complete data quality.

### 8. Unsplash Image Automation ✅

**Production Status:** Live (100% image coverage)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 10 AM UTC (2 AM PT) |
| **API Route** | `src/app/api/fetch-unsplash-images/route.ts` |
| **Purpose** | Fill null images with high-quality photos |
| **Results** | 100% coverage, 79% unique photo usage |

**5-Tier Fallback Strategy:**

1. **All tags + 'kids'** - Most specific
2. **First tag + 'kids'** - Tag-based
3. **Title keywords + 'kids'** - Title-based
4. **Smart category detection** - Context-aware
   - "storytime" → "children reading books"
   - "music" → "kids musical instruments"
   - "science" → "children science experiments"
5. **Generic fallbacks** - Guaranteed results
   - "kids activities"
   - "children playing"
   - "family events"

**Features:**
- Landscape orientation preference
- High content safety filter
- Deduplication tracking via `unsplash_photo_id`
- Progressive fallback ensures 100% coverage
- Attribution metadata stored

---

### 9. Google Maps Geocoding ✅

**Production Status:** Live (92% coverage)

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 11 AM UTC (3 AM PT) |
| **API Route** | `src/app/api/geocode-listings/route.ts` |
| **Purpose** | Convert addresses to latitude/longitude |
| **Results** | 92% coverage (2269/2465 listings) |

**Address Building Strategy:**

1. **Primary:** `street + city + state + zip`
2. **Fallback:** `location_name + city + state`

**Features:**
- Google Maps Geocoding API integration
- Handles park names without street addresses
- Rate limiting (100ms delay between requests)
- Stores latitude/longitude in Supabase
- Enables distance-based filtering on frontend

**Example Queries:**
- "Del Valle Livermore CA" → 37.6025, -121.6919
- "Ardenwood Fremont CA" → 37.5474, -122.0636

---

## 📈 Production Statistics

### Coverage Metrics
- **Total Active Sources:** 7 primary data sources
- **Total Automation Jobs:** 9 (7 imports + 2 enrichment)
- **Image Coverage:** 100% (via Unsplash automation)
- **Geocoding Coverage:** 92% (2269/2465 listings)
- **Unique Photo Usage:** 79% across 123 listings

### Import Results
- **East Bay Parks:** 97 events (first production run)
- **RSS Feeds:** Continuous daily imports
- **All Scrapers:** Active and running daily

### Architecture
- **Database:** 100% Supabase-native
- **Airtable Dependency:** ✅ Fully removed (December 2025)
- **Automation:** GitHub Actions + Vercel Cron
- **Zero Manual Intervention:** Fully automated pipeline

---

## 🔧 Environment Variables

All data sources require proper environment configuration:

### Required for Scrapers (GitHub Actions)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Required for RSS & Enrichment (Vercel)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
CRON_SECRET=your_cron_secret
```

---

## 🗄️ Database Schema

All data sources write to the `listings` table in Supabase:

### Core Fields
- `airtable_id` (TEXT, REQUIRED) - Unique event identifier
  - East Bay Parks: `ebparks_XXXXX`
  - RSS Feeds: `rss_guid` value
  - Legacy: Airtable record IDs
- `source_name` (TEXT) - Data source identifier
- `title` (TEXT) - Event title
- `description` (TEXT) - Full event description
- `type` (TEXT) - Event, Activity, or Camp
- `start_date` (TIMESTAMP) - Event start date/time

### Location Fields
- `location_name` (TEXT) - Venue/park name
- `street` (TEXT) - Street address
- `city` (TEXT) - City
- `state` (TEXT) - State (usually "CA")
- `zip` (INTEGER) - ZIP code
- `latitude` (DECIMAL) - GPS latitude
- `longitude` (DECIMAL) - GPS longitude

### Metadata Fields
- `organizer` (TEXT) - Event organizer
- `website` (TEXT) - Event URL (used for deduplication)
- `image` (TEXT) - Image URL
- `unsplash_photo_id` (TEXT) - Unsplash deduplication tracking
- `price` (TEXT) - Price information
- `age_range` (TEXT) - Target age range
- `tags` (TEXT) - Comma-separated tags
- `place_type` (TEXT) - Venue type

### Curation Fields
- `recommended` (BOOLEAN) - Curated recommendation flag
- `rating` (INTEGER) - 1-5 star rating
- `scout_pick` (BOOLEAN) - Staff pick flag

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (Daily)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GitHub Actions (Scrapers)          Vercel Cron (RSS)       │
│  ├─ East Bay Parks (1 AM PT)        └─ 3 Libraries (1 AM PT)│
│  ├─ Santa Cruz (10 PM PT)                                   │
│  ├─ BADM (12 AM PT)                                         │
│  └─ Eventbrite (11 PM PT)                                   │
│                                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   SUPABASE    │
              │   listings    │
              │     table     │
              └───────┬───────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌────────────────┐
│   UNSPLASH    │          │  GOOGLE MAPS   │
│   Images      │          │   Geocoding    │
│   (2 AM PT)   │          │   (3 AM PT)    │
└───────┬───────┘          └────────┬───────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   ENRICHED    │
              │   LISTINGS    │
              │  (Frontend)   │
              └───────────────┘
```

---

## 📚 Migration History

### Airtable to Supabase Migration (December 2025)

**Status:** ✅ Complete

All data sources have been migrated from Airtable to Supabase:

| Scraper | Status | Date | Notes |
|---------|--------|------|-------|
| East Bay Parks | ✅ Built | Dec 31, 2025 | Built from scratch for Supabase |
| Santa Cruz Library | ✅ Migrated | Dec 31, 2025 | Converted from Airtable |
| BADM | ✅ Migrated | Dec 31, 2025 | Converted from Airtable |
| Eventbrite | ✅ Migrated | Dec 31, 2025 | Converted from Airtable |
| RSS Feeds | ✅ Already Live | N/A | Already on Supabase |

**Key Changes:**
- Removed Airtable SDK dependency
- Updated all environment variables
- Changed field names from capitalized to lowercase
- Renamed `mapEventToAirtable()` → `mapEventToSupabase()`
- Updated `eventExists()` and `createOrUpdateEvent()` functions
- All scrapers now write directly to Supabase

**Documentation:**
- `scripts/MIGRATION_PLAN.md` - Detailed migration guide
- `MIGRATION_RESULTS.csv` - Migration tracking spreadsheet

---

## 🚀 Adding New Data Sources

To add a new data source to Outta:

### For Scrapers (GitHub Actions)

1. **Create Script:** `scripts/import-[source]-events.js`
2. **Add Workflow:** `.github/workflows/import-[source]-events.yml`
3. **Configure Schedule:** Choose non-overlapping time slot
4. **Add Secrets:** Configure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
5. **Document:** Create `scripts/README-[source].md`
6. **Update:** Add to this file and main README.md

### For RSS Feeds (Vercel Cron)

1. **Update Route:** Add feed to `src/app/api/ingest-rss/route.ts`
2. **Configure Feed:** Add to `RSS_FEEDS` array
3. **Test Locally:** Run development server and test endpoint
4. **Deploy:** Push to production (Vercel auto-deploys)

### Testing Checklist

- [ ] Script runs without errors
- [ ] Events import to Supabase correctly
- [ ] Deduplication works (no duplicate events)
- [ ] All required fields populated
- [ ] Images set appropriately (URL or null for Unsplash)
- [ ] Geocoding works for location data
- [ ] Documentation complete

---

## 📞 Support

For issues with data sources:

1. **Check Logs:** GitHub Actions logs or Vercel function logs
2. **Review Documentation:** Individual scraper READMEs
3. **Test Locally:** Run scripts with `node scripts/import-[source]-events.js`
4. **Verify Secrets:** Ensure environment variables are configured

---

**Last Updated:** December 31, 2025
**Maintained By:** Ryan Finch
**Project:** [outta-nextjs](https://github.com/rfinch11/outta-nextjs)
