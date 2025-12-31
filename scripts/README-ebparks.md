# East Bay Regional Park District Event Import

Automatically imports events from the East Bay Regional Park District directly into your Supabase database using Playwright for full content scraping.

## Features

- **Outdoor Events**: Scrapes hikes, walks, farm programs, and nature activities
- **Playwright Integration**: Uses headless browser to scrape React SPA detail pages
- **Full Content Extraction**: Gets complete descriptions, images, pricing, and age ranges
- **Pagination Support**: Automatically fetches events from multiple calendar pages
- **Smart Parsing**: Automatically parses dates, times, locations, and event types
- **Automatic Deduplication**: Uses event URLs to prevent duplicate entries
- **Daily Automation**: GitHub Action runs daily to keep events fresh
- **Direct Supabase Import**: Bypasses Airtable, imports directly to Supabase

## Setup

### 1. Environment Variables

Already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 2. GitHub Secrets

For automated imports, these secrets should already be configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Usage

### Test Scraping (Page 1 only)
```bash
node scripts/test-ebparks-scrape.js
```

This will:
- Fetch the first calendar page
- Extract event details (title, date, location, URL)
- Display the first 5 events
- **Not import to Airtable** (for testing only)

### Test Pagination
```bash
node scripts/test-ebparks-pagination.js
```

This will:
- Test fetching the first 3 calendar pages
- Show event counts per page
- Verify pagination is working correctly

### Full Import (All events)
```bash
node scripts/import-ebparks-events.js
```

This will:
- Launch a headless browser (Playwright)
- Fetch events from up to 10 calendar pages
- Scrape each event's detail page for full descriptions and images
- Create or update records in Supabase
- Skip past events automatically

## What Gets Imported

### Source
- **Website**: https://www.ebparks.org/calendar
- **Coverage**: All East Bay Regional Parks
- **Event Types**: Hikes, walks, drop-in programs, farm activities, nature education

### Supabase Fields Mapped
- **title**: Event name (e.g., "Wednesday Walk: Elsie Roemer")
- **type**: Always "Activity"
- **description**: Full event description scraped from detail page via Playwright
- **start_date**: ISO format date/time (UTC)
- **location_name**: Park name (e.g., "Crown Beach", "Ardenwood")
- **city**: City where park is located (e.g., "Alameda", "Fremont")
- **state**: "CA"
- **organizer**: "East Bay Regional Park District"
- **website**: Event detail page URL on ActiveCommunities (used for deduplication)
- **image**: Event image scraped from detail page
- **price**: Extracted from detail page or "Free" for drop-in programs
- **age_range**: Extracted from detail page when available
- **tags**: Auto-generated based on content:
  - Always includes: "East Bay Regional Park District", "Outdoor", "Nature"
  - Conditional: "Drop-in", "Free", "Hiking", "Wildlife", "Family-Friendly", "Biking", "Camping", "Farm", "Educational", "Arts & Crafts"
- **place_type**: Always "Park"
- **source**: "ebparks_scraper" (for tracking data source)
- **created_at**: ISO timestamp
- **updated_at**: ISO timestamp

## Automation

The import runs automatically via GitHub Actions:
- **Schedule**: Daily at 9 AM UTC (1 AM PST / 2 AM PDT)
- **Workflow**: `.github/workflows/import-ebparks-events.yml`
- **Manual Trigger**: Available in GitHub Actions tab

## Rate Limiting

The script includes appropriate delays:
- **2 seconds** between fetching calendar pages
- **2 seconds** between processing events (Playwright scraping is slower)
- Respectful of the park district's website resources

## How It Works

1. **Launch Browser**: Initializes Playwright Chromium headless browser
2. **Fetch Calendar Pages**: Scrapes calendar listing pages with pagination support
   - URL pattern: `https://www.ebparks.org/calendar?page=N`
   - Fetches up to 10 pages (configurable via `MAX_PAGES`)
3. **Extract Event Cards**: Finds all event links on each page
   - Links point to ActiveCommunities registration platform
4. **Parse Basic Data**: Extracts from each card:
   - Title from `<h3>` tag
   - Date/time from div (e.g., "Wednesday, Dec. 31, 2025, 9:30 AM")
   - Location from div (e.g., "Crown Beach, Alameda")
   - Drop-in status from icon image
5. **Scrape Detail Pages**: Uses Playwright to load each event's React SPA:
   - Waits for JavaScript to render content
   - Extracts full event description
   - Finds and extracts event images
   - Parses pricing information
   - Extracts age range when available
6. **Parse Dates**: Converts date text to ISO format
7. **Generate Tags**: Creates relevant tags based on title keywords
8. **Check Existing**: Queries Supabase to see if event already exists by URL
9. **Import**: Creates new records or updates existing ones directly in Supabase
10. **Close Browser**: Cleans up Playwright resources

## Technology Stack

### Playwright for Dynamic Content
The event detail pages (on ActiveCommunities) are React Single Page Applications (SPAs) that load data dynamically via JavaScript. This scraper uses Playwright to:

- **Render JavaScript**: Launches a headless Chromium browser to execute React code
- **Wait for Content**: Waits for network idle and additional time for content to load
- **Extract Dynamic Data**: Scrapes fully rendered HTML for complete information
- **Handle Images**: Converts relative URLs to absolute for proper image linking

This approach ensures we get **complete event information** including full descriptions, images, pricing, and age ranges that wouldn't be available with simple HTML scraping.

## Typical Results

- **Events found**: 50-200+ events (depends on season)
- **Import time**: 2-5 minutes
- **Event types**: Nature walks, guided hikes, farm programs, drop-in activities, educational programs

## Troubleshooting

### "Missing Supabase credentials"
Ensure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

### Events not appearing
- Check that events are in the future (past events are skipped)
- Verify Supabase service key has write access to the listings table
- Check logs for specific error messages
- Verify the `listings` table exists in Supabase

### "Could not parse date"
- Some events may have non-standard date formats
- These will be imported without a start_date field
- You can manually add dates in Airtable if needed

### No events found
- The park district may have changed their website structure
- Check https://www.ebparks.org/calendar manually
- The scraper may need updating if HTML structure changed

### Browser/Playwright issues
If you encounter Playwright errors:
- Run `npx playwright install chromium` to ensure browsers are installed
- Check that the system has enough memory for headless browser
- Increase timeout values if events are loading slowly

## Related Files

- `import-ebparks-events.js` - Full import script with Playwright and Supabase
- `test-ebparks-scrape.js` - Test basic scraping (page 1 only, no Playwright/Supabase)
- `test-ebparks-import.js` - Test full Playwright scraping (2 events, no Supabase)
- `test-ebparks-pagination.js` - Test pagination functionality
- `.github/workflows/import-ebparks-events.yml` - GitHub Action for automation
- `MIGRATION_PLAN.md` - Plan for migrating other scrapers to Supabase

## Example Output

```
🚀 Starting East Bay Regional Park District event import...

🌐 Launching browser...

🔍 Fetching calendar page 1...
✓ Found 10 events on page 1

🔍 Fetching calendar page 2...
✓ Found 10 events on page 2

🔍 Fetching calendar page 3...
✓ Found 9 events on page 3

✓ Total events found: 29

[1/29] Processing event...
  📝 Title: Wednesday Walk: Elsie Roemer
  📅 Date: Wednesday, Dec. 31, 2025, 9:30 AM
  📍 Location: Crown Beach, Alameda
  🔍 Loading detail page...
  💰 Price: Free
  📷 Image: Found
  ✅ Created new record

[2/29] Processing event...
  📝 Title: New Year's Eve Hike
  📅 Date: Wednesday, Dec. 31, 2025, 10:00 AM
  📍 Location: Big Break, Oakley
  🔍 Loading detail page...
  💰 Price: Free
  👶 Age range: All ages
  📷 Image: Found
  ✅ Created new record

[3/29] Processing event...
  📝 Title: Wake Up The Farm
  📅 Date: Thursday, Jan. 1, 2026, 10:30 AM
  📍 Location: Ardenwood, Fremont
  🔍 Loading detail page...
  💰 Price: Free
  📷 Image: Found
  ♻️  Updated existing record

==================================================
📊 Import Summary
==================================================
✅ Created: 22
♻️  Updated: 5
⏭️  Skipped: 2
❌ Errors: 0
📊 Total processed: 29
==================================================
```

## Notes

- East Bay Regional Parks offers a large variety of free drop-in programs
- Many events are nature walks, hikes, and educational programs
- The calendar is updated frequently with new events
- Drop-in programs typically don't require registration and are free
- The park district covers a large area from Richmond to Fremont
- Events span diverse locations including coastal areas, hills, farms, and urban parks
