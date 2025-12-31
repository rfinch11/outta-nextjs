# Airtable to Supabase Migration Plan

## Overview

All scrapers currently import data into Airtable, which then syncs to Supabase. The goal is to migrate all scrapers to import directly into Supabase, eliminating the Airtable dependency.

## Status

### ✅ Completed
- **East Bay Regional Park District** (`import-ebparks-events.js`) - Migrated to Supabase with Playwright support

### 🔄 To Migrate

1. **Bay Area Discovery Museum** (`import-badm-events.js`)
2. **Eventbrite Events** (`import-eventbrite-events.js`)
3. **Santa Cruz Library** (`import-santa-cruz-library.js`)

## Migration Pattern

### Environment Variables

**Before (Airtable):**
```javascript
const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);
```

**After (Supabase):**
```javascript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

### Data Mapping

**Airtable field names** → **Supabase column names**:
- `Title` → `title`
- `Type` → `type`
- `Description` → `description`
- `Start Date` → `start_date`
- `Location name` → `location_name`
- `City` → `city`
- `State` → `state`
- `Street` → `street`
- `ZIP` → `zip`
- `Organizer` → `organizer`
- `Website` → `website`
- `Image` → `image`
- `Price` → `price`
- `Age range` → `age_range`
- `Tags` → `tags`
- `Place type` → `place_type`

**Additional Supabase fields to include:**
- `source` - Identifier for the scraper (e.g., `'badm_scraper'`, `'eventbrite_scraper'`)
- `created_at` - ISO timestamp
- `updated_at` - ISO timestamp

### Checking for Existing Records

**Before (Airtable):**
```javascript
const records = await airtable('Listings')
  .select({
    filterByFormula: `{Website} = '${websiteUrl.replace(/'/g, "\\'")}'`,
    maxRecords: 1,
  })
  .firstPage();

return records.length > 0 ? records[0] : null;
```

**After (Supabase):**
```javascript
const { data, error } = await supabase
  .from('listings')
  .select('id')
  .eq('website', websiteUrl)
  .maybeSingle();

if (error) {
  console.error(`Error checking if event exists:`, error.message);
  return null;
}

return data;
```

### Creating/Updating Records

**Before (Airtable):**
```javascript
if (existing) {
  await airtable('Listings').update(existing.id, fields);
  return { action: 'updated', id: existing.id };
} else {
  const record = await airtable('Listings').create(fields);
  return { action: 'created', id: record.id };
}
```

**After (Supabase):**
```javascript
if (existing) {
  const { error } = await supabase
    .from('listings')
    .update({
      ...eventData,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);

  if (error) {
    return { action: 'error', error: error.message };
  }

  return { action: 'updated', id: existing.id };
} else {
  const { data, error } = await supabase
    .from('listings')
    .insert(eventData)
    .select('id')
    .single();

  if (error) {
    return { action: 'error', error: error.message };
  }

  return { action: 'created', id: data.id };
}
```

### Date Handling

**Airtable:** Used Pacific timezone offsets manually:
```javascript
const offset = isDST ? '-07:00' : '-08:00';
return `${year}-${monthStr}-${day}T${hour}:${minute}:00${offset}`;
```

**Supabase:** Use ISO strings directly:
```javascript
return parsedDate.toISOString();
```

## Migration Steps for Each Scraper

### 1. Update Imports
```javascript
// Add
const { createClient } = require('@supabase/supabase-js');

// Remove
const Airtable = require('airtable');
```

### 2. Update Environment Variable Initialization
Replace Airtable config with Supabase config (see pattern above)

### 3. Update Field Mapping Function
- Change from `mapEventToAirtable()` to `mapEventToSupabase()`
- Use lowercase field names instead of capitalized
- Add `source`, `created_at`, `updated_at` fields
- Use `.toISOString()` for dates instead of manual timezone offsets

### 4. Update Existence Check Function
Replace Airtable query with Supabase query (see pattern above)

### 5. Update Create/Update Function
Replace Airtable insert/update with Supabase insert/update (see pattern above)

### 6. Update GitHub Actions Workflow
Replace Airtable secrets with Supabase secrets:
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### 7. Test the Migration
1. Run the test script (if exists) to verify scraping still works
2. Run the import script with a small batch to verify Supabase writes
3. Check Supabase dashboard to confirm data is inserted correctly
4. Verify deduplication works (try running import twice)

## GitHub Secrets Required

Ensure these secrets are set in the GitHub repository:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for server-side operations

## Implementation Order

Recommended order based on complexity:

1. **Santa Cruz Library** (`import-santa-cruz-library.js`) - Similar structure to BADM
2. **Bay Area Discovery Museum** (`import-badm-events.js`) - Well-structured, good template
3. **Eventbrite Events** (`import-eventbrite-events.js`) - May have API integration considerations

## Testing Checklist

For each migrated scraper:
- [ ] Script runs without errors
- [ ] Events are created in Supabase
- [ ] Existing events are updated (not duplicated)
- [ ] All fields are correctly mapped
- [ ] Dates are in correct format
- [ ] GitHub Action runs successfully
- [ ] No Airtable dependencies remain

## Rollback Plan

If issues occur:
1. Revert to the previous Airtable version from git history
2. Ensure Airtable → Supabase sync is still running
3. Debug the issue in a separate branch
4. Re-deploy once fixed and tested

## Post-Migration

Once all scrapers are migrated:
1. Monitor Supabase for a week to ensure stability
2. Consider deprecating the Airtable → Supabase sync
3. Update documentation to reflect Supabase-only workflow
4. Archive Airtable base (or keep as backup)

## Reference Implementation

See `scripts/import-ebparks-events.js` for a complete working example of:
- Supabase integration
- Playwright for dynamic content scraping
- Full description and image extraction
- Proper error handling
- Deduplication logic
