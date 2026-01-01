# Automated Jobs Schedule

## Overview

The Outta platform runs automated jobs to import content from various sources and then refine that content with images and geocoding. Jobs are scheduled to ensure content scripts complete before refinement scripts run.

---

## Schedule Summary

### Content Import Scripts (6:00 - 8:00 AM UTC / 10:00 PM - 12:00 AM PT)

Import events and activities from various sources. These run first to ensure all content is in the database before refinement.

| Time (UTC) | Time (PT) | Job | Type | Source |
|------------|-----------|-----|------|--------|
| 6:00 AM | 10:00 PM | Santa Cruz Library Events | GitHub Actions | RSS/iCal + Web Scraping |
| 6:30 AM | 10:30 PM | Eventbrite Bay Area Events | GitHub Actions | Web Scraping (JSON extraction) |
| 7:00 AM | 11:00 PM | Bay Area Discovery Museum Events | GitHub Actions | Web Scraping |
| 7:30 AM | 11:30 PM | East Bay Regional Park District Events | GitHub Actions | Web Scraping (Playwright) |
| 8:00 AM | 12:00 AM | Library RSS Feeds (PA, San Mateo, Santa Clara) | Vercel Cron | BiblioCommons RSS |

**Total Content Import Window:** 2 hours (6:00 - 8:00 AM UTC)

---

### Buffer Period (8:00 - 10:00 AM UTC / 12:00 - 2:00 AM PT)

**2-hour gap** to ensure all content imports complete before refinement begins.

---

### Content Refinement Scripts (10:00 - 11:00 AM UTC / 2:00 - 3:00 AM PT)

Enhance imported content with images and geographic coordinates.

| Time (UTC) | Time (PT) | Job | Type | Purpose |
|------------|-----------|-----|------|---------|
| 10:00 AM | 2:00 AM | Unsplash Image Automation | Vercel Cron | Fetch high-quality images for listings without images |
| 11:00 AM | 3:00 AM | Geocoding Automation | Vercel Cron | Convert addresses to lat/lng coordinates |

**Total Refinement Window:** 1 hour (10:00 - 11:00 AM UTC)

---

## Detailed Job Information

### Content Import Scripts

#### 1. Santa Cruz Library Events (6:00 AM UTC)
- **File:** `.github/workflows/import-santa-cruz-events.yml`
- **Script:** `scripts/import-santa-cruz-library.js`
- **Method:** iCal feed parsing + web scraping
- **Source:** Santa Cruz Public Libraries calendar
- **Features:** Geo coordinates, full descriptions
- **Typical Volume:** ~50-100 events

#### 2. Eventbrite Bay Area Events (6:30 AM UTC)
- **File:** `.github/workflows/import-eventbrite-events.yml`
- **Script:** `scripts/import-eventbrite-events.js`
- **Method:** Web scraping with JSON extraction from embedded data
- **Source:** Eventbrite (SF Bay Area)
- **Features:** Multi-city support, full descriptions
- **Typical Volume:** ~30-50 events

#### 3. Bay Area Discovery Museum Events (7:00 AM UTC)
- **File:** `.github/workflows/import-badm-events.yml`
- **Script:** `scripts/import-badm-events.js`
- **Method:** Web scraping (listing + detail pages)
- **Source:** Bay Area Discovery Museum
- **Features:** Museum-specific events, pricing, age ranges
- **Typical Volume:** ~10-20 events

#### 4. East Bay Regional Park District Events (7:30 AM UTC)
- **File:** `.github/workflows/import-ebparks-events.yml`
- **Script:** `scripts/import-ebparks-events.js`
- **Method:** Playwright-based scraping (React SPA)
- **Source:** EBRPD Calendar (activecommunities.com)
- **Features:** 10-page pagination, full descriptions, drop-in detection
- **Typical Volume:** ~90-100 events

#### 5. Library RSS Feeds (8:00 AM UTC)
- **File:** `src/app/api/ingest-rss/route.ts`
- **Config:** `vercel.json` cron
- **Method:** BiblioCommons RSS parsing
- **Sources:**
  - Palo Alto City Library
  - San Mateo County Libraries
  - Santa Clara County Libraries
- **Features:** Custom field parsing (bc:* namespace), HTML entity decoding
- **Typical Volume:** ~75 events/day, 0 duplicates

---

### Content Refinement Scripts

#### 6. Unsplash Image Automation (10:00 AM UTC)
- **File:** `src/app/api/fetch-unsplash-images/route.ts`
- **Config:** `vercel.json` cron
- **Purpose:** Fetch high-quality images for listings without images
- **Strategy:** Progressive fallback search (5 tiers)
  1. All tags + 'kids'
  2. First tag + 'kids'
  3. Title keywords + 'kids'
  4. Smart category detection
  5. Generic fallbacks
- **Features:**
  - 100% image coverage guaranteed
  - Deduplication tracking via `unsplash_photo_id`
  - Landscape orientation, high content filter
  - 79% unique photo usage
- **Processing:** 50 listings/run with 200ms rate limit

#### 7. Geocoding Automation (11:00 AM UTC)
- **File:** `src/app/api/geocode-listings/route.ts`
- **Config:** `vercel.json` cron
- **Purpose:** Convert addresses to latitude/longitude coordinates
- **API:** Google Maps Geocoding API
- **Address Building:**
  - Primary: street + city + state + zip
  - Fallback: location_name + city + state
- **Coverage:** 92% of all listings (2269/2465)
- **Processing:** 250 listings/run with 100ms rate limit
- **Results:** Updates `latitude` and `longitude` fields

---

## Configuration Files

### GitHub Actions Workflows
- `.github/workflows/import-santa-cruz-events.yml`
- `.github/workflows/import-eventbrite-events.yml`
- `.github/workflows/import-badm-events.yml`
- `.github/workflows/import-ebparks-events.yml`

### Vercel Cron Jobs
- `vercel.json` - Cron schedule configuration

### Import Scripts
- `scripts/import-santa-cruz-library.js`
- `scripts/import-eventbrite-events.js`
- `scripts/import-badm-events.js`
- `scripts/import-ebparks-events.js`

### Refinement Scripts
- `src/app/api/ingest-rss/route.ts`
- `src/app/api/fetch-unsplash-images/route.ts`
- `src/app/api/geocode-listings/route.ts`

---

## Why This Schedule?

### 1. Content Before Refinement
Content import scripts run 2 hours before refinement scripts to ensure:
- All new listings are in the database
- Refinement scripts can process all new content in a single run
- No race conditions or missed content

### 2. Staggered Content Imports (30-minute intervals)
- Prevents API rate limiting issues
- Distributes server load
- Easier to debug if one script fails

### 3. Late Night PT Timing
- 10 PM - 3 AM PT is low-traffic period
- Minimizes impact on user experience
- Allows time to fix issues before morning traffic

### 4. Daily Frequency
- Events are time-sensitive
- Many sources update daily
- Users expect fresh content

---

## Monitoring & Logs

### GitHub Actions
- View logs: [GitHub Actions](https://github.com/rfinch11/outta-nextjs/actions)
- Each workflow logs:
  - Events found
  - Events created/updated
  - Errors and warnings
  - Processing time

### Vercel Cron Jobs
- View logs: [Vercel Dashboard](https://vercel.com/dashboard)
- Each cron job logs:
  - Items processed
  - Success/error counts
  - API rate limit status
  - Processing time

---

## Manual Triggers

All jobs can be manually triggered:

### GitHub Actions
```bash
# Via GitHub Actions UI
# Navigate to Actions tab → Select workflow → Run workflow

# Or via gh CLI
gh workflow run import-santa-cruz-events.yml
gh workflow run import-eventbrite-events.yml
gh workflow run import-badm-events.yml
gh workflow run import-ebparks-events.yml
```

### Vercel Cron Jobs
```bash
# Via Vercel Dashboard or API
# Or manually run scripts locally:
node scripts/test-rss-ingestion.js
node scripts/test-unsplash-images.js
node scripts/test-geocoding.js
```

---

## Troubleshooting

### Content Import Issues
1. Check GitHub Actions logs
2. Verify source website is accessible
3. Check for HTML structure changes
4. Verify Supabase credentials in GitHub Secrets

### Refinement Issues
1. Check Vercel cron logs
2. Verify API keys (Google Maps, Unsplash)
3. Check API rate limits
4. Verify `CRON_SECRET` is set

### Missing Content
1. Check if import job succeeded
2. Verify data in Supabase
3. Check for geocoding coverage
4. Verify images were fetched

---

## Future Enhancements

Potential improvements to the automation pipeline:

1. **Slack/Email Notifications** for job failures
2. **Retry Logic** for failed imports
3. **Incremental Imports** to reduce processing time
4. **Content Validation** before saving to database
5. **Duplicate Detection** across sources
6. **Smart Scheduling** based on source update frequency
7. **Rate Limit Monitoring** with auto-throttling

---

**Last Updated:** January 2026
