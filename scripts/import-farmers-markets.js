/**
 * Import Farmers Markets from CSV into Supabase
 *
 * This script:
 * 1. Reads the farmers market CSV file
 * 2. Maps CSV fields to Supabase schema
 * 3. Imports records (upserts to avoid duplicates)
 *
 * Usage:
 *   node scripts/import-farmers-markets.js                    # Preview only (dry run)
 *   node scripts/import-farmers-markets.js --import           # Actually import records
 *   node scripts/import-farmers-markets.js --import --fetch   # Import and fetch Google Place details
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ||
                       process.env.GOOGLE_MAPS_API_KEY ||
                       process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const CSV_PATH = '/Users/ryanfinch/Downloads/Farmers Market Raw Scrape - Sheet1 (1).csv';

const IMPORT_MODE = process.argv.includes('--import');
const FETCH_DETAILS = process.argv.includes('--fetch');

// Rate limiting delay (ms)
const DELAY_MS = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse CSV file
 */
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Generate a unique airtable_id for the farmers market
 */
function generateId(record) {
  if (record.place_id) {
    return `farmersmarket_${record.place_id}`;
  }
  // Fallback to slugified name
  const slug = record.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `farmersmarket_${slug}`;
}

/**
 * Map CSV record to Supabase schema
 */
function mapToSupabase(record) {
  // Parse working hours if available
  let workingHours = null;
  if (record.working_hours) {
    try {
      workingHours = JSON.parse(record.working_hours.replace(/'/g, '"'));
    } catch (e) {
      // Use the CSV-compatible format
      workingHours = record.working_hours_csv_compatible || null;
    }
  }

  // Build description from available fields
  let description = record.description || record.about || '';
  if (!description && record.reviews_tags) {
    description = `Popular for: ${record.reviews_tags}`;
  }

  return {
    airtable_id: generateId(record),
    title: record.name,
    description: description,
    type: 'Activity',
    latitude: record.latitude ? parseFloat(record.latitude) : null,
    longitude: record.longitude ? parseFloat(record.longitude) : null,
    street: record.street || null,
    city: record.city || null,
    state: record.state_code || record.state || null,
    zip: record.postal_code || null,
    location_name: record.name,
    website: record.website || null,
    phone: record.phone || null,
    rating: record.rating ? parseFloat(record.rating) : null,
    place_id: record.place_id || null,
    image: record.photo || null,
    source_name: 'Farmers Market Scrape',
    tags: ['Farmers Market'],
    place_type: 'Farmers Market',
    organizer: record.owner_title || null,
    hidden: false,
  };
}

/**
 * Fetch Google Place details for a place_id
 */
async function fetchPlaceDetails(placeId) {
  if (!GOOGLE_API_KEY) {
    console.log('  ⚠️  No Google API key, skipping details fetch');
    return null;
  }

  const fields = 'photos,opening_hours,rating,user_ratings_total,reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return null;
    }

    const result = data.result;

    // Build photo URLs
    const photos = (result.photos || []).slice(0, 10).map(photo => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`,
      width: photo.width,
      height: photo.height,
    }));

    // Parse opening hours
    const openingHours = result.opening_hours ? {
      isOpen: result.opening_hours.open_now ?? null,
      weekdayText: result.opening_hours.weekday_text || [],
    } : null;

    // Parse reviews
    const reviews = (result.reviews || []).slice(0, 5).map(review => ({
      authorName: review.author_name,
      rating: review.rating,
      text: review.text,
      relativeTimeDescription: review.relative_time_description,
    }));

    return {
      photos,
      openingHours,
      rating: result.rating ?? null,
      userRatingsTotal: result.user_ratings_total ?? null,
      reviews,
    };
  } catch (error) {
    console.log(`  ⚠️  Error fetching place details: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🌽 Farmers Market Import\n');

  if (!IMPORT_MODE) {
    console.log('⚠️  DRY RUN MODE - No records will be imported');
    console.log('   Run with --import to actually import records');
    if (!FETCH_DETAILS) {
      console.log('   Add --fetch to also fetch Google Place details\n');
    }
  } else {
    console.log('✏️  IMPORT MODE - Records will be imported to Supabase');
    if (FETCH_DETAILS) {
      console.log('📍 FETCH MODE - Google Place details will be fetched\n');
    }
  }

  // Read and parse CSV
  console.log('📁 Reading CSV file...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parseCSV(content);
  console.log(`   Found ${records.length} records\n`);

  // Map to Supabase schema
  const listings = records.map(mapToSupabase);

  // Show sample
  console.log('--- SAMPLE RECORDS (first 5) ---');
  listings.slice(0, 5).forEach((listing, i) => {
    console.log(`${i + 1}. ${listing.title}`);
    console.log(`   ID: ${listing.airtable_id}`);
    console.log(`   Location: ${listing.city}, ${listing.state}`);
    console.log(`   Rating: ${listing.rating || 'N/A'}`);
    console.log(`   Place ID: ${listing.place_id ? 'Yes' : 'No'}`);
    console.log('');
  });

  // Group by city for summary
  const byCity = {};
  listings.forEach(listing => {
    const city = listing.city || 'Unknown';
    byCity[city] = (byCity[city] || 0) + 1;
  });

  console.log('--- BY CITY ---');
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([city, count]) => {
      console.log(`${city}: ${count}`);
    });
  console.log('');

  // Count with place_id
  const withPlaceId = listings.filter(l => l.place_id).length;
  console.log(`📍 ${withPlaceId}/${listings.length} have Google Place IDs\n`);

  if (IMPORT_MODE) {
    console.log('─'.repeat(60));
    console.log('\n✏️  Importing records...\n');

    let imported = 0;
    let errors = 0;
    const importedIds = [];

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      process.stdout.write(`[${i + 1}/${listings.length}] ${listing.title.slice(0, 40).padEnd(40)} `);

      const { error } = await supabase
        .from('listings')
        .upsert(listing, { onConflict: 'airtable_id' });

      if (error) {
        console.log(`❌ ${error.message}`);
        errors++;
      } else {
        console.log('✅');
        imported++;
        importedIds.push(listing.airtable_id);
      }

      await sleep(50);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log(`   Imported: ${imported}`);
    console.log(`   Errors: ${errors}`);

    // Fetch Google Place details if requested
    if (FETCH_DETAILS && importedIds.length > 0) {
      console.log('\n' + '─'.repeat(60));
      console.log('\n📍 Fetching Google Place details...\n');

      let fetched = 0;
      let fetchErrors = 0;

      // Get the listings with place_id from what we just imported
      const { data: importedListings, error: fetchError } = await supabase
        .from('listings')
        .select('airtable_id, title, place_id')
        .in('airtable_id', importedIds)
        .not('place_id', 'is', null);

      if (fetchError) {
        console.error('❌ Error fetching imported listings:', fetchError.message);
      } else {
        console.log(`Found ${importedListings.length} listings with place_id\n`);

        for (let i = 0; i < importedListings.length; i++) {
          const listing = importedListings[i];
          process.stdout.write(`[${i + 1}/${importedListings.length}] ${listing.title.slice(0, 40).padEnd(40)} `);

          const details = await fetchPlaceDetails(listing.place_id);

          if (details) {
            const { error: updateError } = await supabase
              .from('listings')
              .update({
                google_place_details: details,
                place_details_updated_at: new Date().toISOString(),
              })
              .eq('airtable_id', listing.airtable_id);

            if (updateError) {
              console.log(`❌ DB error: ${updateError.message}`);
              fetchErrors++;
            } else {
              const rating = details.rating ? `⭐ ${details.rating}` : 'no rating';
              console.log(`✅ ${rating}`);
              fetched++;
            }
          } else {
            console.log('⚠️  No data');
            fetchErrors++;
          }

          await sleep(DELAY_MS);
        }

        console.log('\n📊 Place Details Summary:');
        console.log(`   Fetched: ${fetched}`);
        console.log(`   Errors: ${fetchErrors}`);
      }
    }
  } else {
    console.log('─'.repeat(60));
    console.log(`\n📊 Would import ${listings.length} records`);
    console.log('\nRun with --import to actually import these records.');
    console.log('Run with --import --fetch to also fetch Google Place details.');
  }
}

main().catch(console.error);
