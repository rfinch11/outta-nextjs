# Bay Area Discovery Museum Event Import

Automatically imports events from the Bay Area Discovery Museum into your Airtable database.

## Features

- **Museum Events**: Scrapes special events and programs from BADM
- **Full Event Details**: Extracts title, date, time, description, pricing, and images
- **Smart Parsing**: Automatically parses dates, times, and pricing information
- **Automatic Deduplication**: Uses event URLs to prevent duplicate entries
- **Daily Automation**: GitHub Action runs daily to keep events fresh

## Setup

### 1. Environment Variables

Already configured in `.env.local`:
```
AIRTABLE_ACCESS_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
```

### 2. GitHub Secrets

For automated imports, these secrets should already be configured:
- `AIRTABLE_ACCESS_TOKEN`
- `AIRTABLE_BASE_ID`

## Usage

### Test Import (First 3 events only)
```bash
node scripts/test-badm-import.js
```

This will:
- Fetch the events listing page
- Extract the first 3 event URLs
- Scrape and display event details
- **Not import to Airtable** (for testing only)

### Full Import (All events)
```bash
node scripts/import-badm-events.js
```

This will:
- Fetch all event URLs from the events page
- Scrape each event's detail page
- Create or update records in Airtable
- Skip past events automatically

## What Gets Imported

### Source
- **Website**: https://bayareadiscoverymuseum.org/events/
- **Location**: Bay Area Discovery Museum, 557 McReynolds Rd, Sausalito, CA 94965

### Airtable Fields Mapped
- **Title**: Event name
- **Type**: Always "Activity" (museum events are activities)
- **Description**: Full event description extracted from page
- **Start Date**: ISO format date/time (Pacific timezone)
- **Location name**: "Bay Area Discovery Museum"
- **City**: "Sausalito"
- **State**: "CA"
- **Street**: "557 McReynolds Rd"
- **ZIP**: 94965
- **Organizer**: "Bay Area Discovery Museum"
- **Website**: Event detail page URL (used for deduplication)
- **Image**: Event hero image or featured image
- **Price**: Extracted from page (e.g., "$10 members, $28 public" or "Free")
- **Age range**: "0-10" (BADM's target age range)
- **Tags**: Auto-generated based on content:
  - Always includes: "Bay Area Discovery Museum", "Museum", "Educational"
  - Conditional: "Arts & Crafts", "Music", "STEM", "Free"
- **Place type**: Always "Museum"

## Automation

The import runs automatically via GitHub Actions:
- **Schedule**: Daily at 8 AM UTC (12 AM PST / 1 AM PDT)
- **Workflow**: `.github/workflows/import-badm-events.yml`
- **Manual Trigger**: Available in GitHub Actions tab

## Rate Limiting

The script includes appropriate delays:
- **2 seconds** between scraping each event page
- Respectful of the museum's website resources

## How It Works

1. **Fetch Listing**: Scrapes the main events page (https://bayareadiscoverymuseum.org/events/)
2. **Extract URLs**: Finds all event detail page links
3. **Scrape Details**: Visits each event page and extracts:
   - Title from `<h1>` tag
   - Description from paragraph content
   - Date/time using regex pattern matching
   - Pricing from page text
   - Featured image from Open Graph meta tag or first image
4. **Parse Data**: Converts dates to ISO format with Pacific timezone
5. **Check Existing**: Queries Airtable to see if event already exists by URL
6. **Import**: Creates new records or updates existing ones
7. **Sync**: Events flow to Supabase via your existing Airtable sync pipeline

## Typical Results

- **Events found**: 5-20 events (depends on museum's schedule)
- **Import time**: 1-3 minutes
- **Event types**: Special programs, seasonal events, themed activities

## Troubleshooting

### "Missing Airtable credentials"
Ensure `.env.local` has both `AIRTABLE_ACCESS_TOKEN` and `AIRTABLE_BASE_ID`

### Events not appearing
- Check that events are in the future (past events are skipped)
- Verify Airtable credentials have write access
- Check logs for specific error messages
- The museum may not have upcoming events listed

### "Could not parse date"
- Some events may have non-standard date formats
- These will be imported without a start_date field
- You can manually add dates in Airtable if needed

### No events found
- The museum may have changed their website structure
- Check https://bayareadiscoverymuseum.org/events/ manually
- The scraper may need updating if HTML structure changed

## Related Files

- `import-badm-events.js` - Full import script
- `test-badm-import.js` - Test script (3 events, no Airtable import)
- `.github/workflows/import-badm-events.yml` - GitHub Action for automation

## Example Output

```
🚀 Starting Bay Area Discovery Museum event import...

🔍 Fetching events listing page...
✓ Found 8 event URLs

[1/8] Processing event...
  🔍 Scraping https://bayareadiscoverymuseum.org/events/noon-years-eve/
  📝 Title: Noon Year's Eve
  📅 Date: Wednesday, December 31, 2025, 9:00 AM – 2:00 PM
  💰 Price: $10 members, $28 public
  ✅ Created new record

[2/8] Processing event...
  🔍 Scraping https://bayareadiscoverymuseum.org/events/big-art-weekend/
  📝 Title: Big Art Weekend
  📅 Date: Saturday, January 18, 2025, 9:00 AM – 5:00 PM
  💰 Price: See website
  ♻️  Updated existing record

==================================================
📊 Import Summary
==================================================
✅ Created: 5
♻️  Updated: 2
⏭️  Skipped: 1
❌ Errors: 0
📊 Total processed: 8
==================================================
```

## Notes

- The Bay Area Discovery Museum typically has fewer events than sources like Eventbrite
- Events are often recurring (e.g., daily programs) but listed as separate entries on their website
- The museum updates their events page periodically, so daily scraping ensures you catch new additions
- Some special events may require advance registration or have capacity limits
