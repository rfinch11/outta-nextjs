# Eventbrite Event Import

Automatically imports kid-friendly events from Eventbrite across the SF Bay Area into your Airtable database.

## Features

- **Bay Area Coverage**: Searches 16 major Bay Area cities including San Francisco, Oakland, San Jose, Berkeley, and more
- **Smart Filtering**: Finds events tagged with "kids" or family-friendly keywords
- **Automatic Deduplication**: Uses event URLs to prevent duplicate entries
- **Field Mapping**: Properly maps to all Airtable fields (Title, Date, Location, Tags, etc.)
- **Daily Automation**: GitHub Action runs daily to keep events fresh

## Setup

### 1. Environment Variables

Already configured in `.env.local`:
```
AIRTABLE_ACCESS_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
```

### 2. GitHub Secrets

For automated imports, add these secrets to your GitHub repository:
- `AIRTABLE_ACCESS_TOKEN`
- `AIRTABLE_BASE_ID`

Go to: Repository Settings → Secrets and variables → Actions → New repository secret

## Usage

### Test Import (5 events)
```bash
node scripts/test-eventbrite-import.js
```

### Full Import (All Bay Area cities)
```bash
node scripts/import-eventbrite-events.js
```

### Export to CSV (Preview without importing)
```bash
node scripts/export-eventbrite-to-csv.js
```
Output: `/tmp/eventbrite-sf-kids-events.csv`

## What Gets Imported

### Cities Covered
- San Francisco
- Oakland
- San Jose
- Berkeley
- Palo Alto
- Mountain View
- Sunnyvale
- Santa Clara
- Fremont
- Hayward
- San Mateo
- Redwood City
- Cupertino
- Santa Cruz
- Sausalito
- Mill Valley

### Airtable Fields Mapped
- **Title**: Event name
- **Type**: Always "Event"
- **Description**: Event summary/description
- **Start Date**: ISO format date/time
- **Location name**: Venue name
- **City**: Event city
- **State**: Always "CA"
- **Street**: Street address
- **ZIP**: Postal code
- **Organizer**: "Eventbrite"
- **Website**: Event URL (used for deduplication)
- **Image**: Event image URL
- **Price**: "Free" or "See website"
- **Age range**: Extracted from event text (e.g., "3-5", "Teens")
- **Tags**: Auto-generated (Eventbrite, Arts & Crafts, Music, Free, etc.)
- **Place type**: Inferred from venue (Library, Museum, Park, Theater, etc.)

## Automation

The import runs automatically via GitHub Actions:
- **Schedule**: Daily at 7 AM UTC (11 PM PST / 12 AM PDT)
- **Workflow**: `.github/workflows/import-eventbrite-events.yml`
- **Manual Trigger**: Available in GitHub Actions tab

## Rate Limiting

The script includes appropriate delays:
- **2 seconds** between pagination pages
- **3 seconds** between different cities
- **1 second** between Airtable operations

## Typical Results

- **Events per city**: 20-60 events
- **Total events collected**: 200-500+ events
- **Import time**: 5-15 minutes depending on volume
- **Deduplication**: Events appearing in multiple cities are automatically deduplicated

## Troubleshooting

### "Missing Airtable credentials"
Ensure `.env.local` has both `AIRTABLE_ACCESS_TOKEN` and `AIRTABLE_BASE_ID`

### Events not appearing
- Check that events are in the future (past events are skipped)
- Verify Airtable credentials have write access
- Check logs for specific error messages

### Duplicate events
The script automatically deduplicates by Website URL. If you see duplicates:
- They may have different URLs (different event instances)
- Previous imports may have used different URLs

## Related Files

- `import-eventbrite-events.js` - Full import script
- `test-eventbrite-import.js` - Test script (5 events only)
- `export-eventbrite-to-csv.js` - CSV export for preview
- `test-eventbrite-scrape-v2.js` - Low-level scraping test
- `.github/workflows/import-eventbrite-events.yml` - GitHub Action

## How It Works

1. **Fetch**: Scrapes Eventbrite search pages for each Bay Area city
2. **Extract**: Parses embedded JSON data from `__SERVER_DATA__`
3. **Transform**: Maps Eventbrite fields to Airtable schema
4. **Deduplicate**: Removes duplicate events by URL
5. **Check**: Queries Airtable to see if event already exists
6. **Import**: Creates new records or updates existing ones
7. **Sync**: Events flow to Supabase via your existing sync pipeline

## Notes

- Eventbrite's public search API was deprecated, so this uses web scraping
- The script respects rate limits to avoid being blocked
- Events are sourced from Eventbrite's public search results
- Images are URL references (not uploaded to Airtable as attachments)
