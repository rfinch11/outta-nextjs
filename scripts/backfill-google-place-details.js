#!/usr/bin/env node

/**
 * Backfill Google Place Details for all listings with a place_id
 *
 * This script fetches Google Places data (photos, hours, rating, reviews)
 * for listings that don't have cached data yet.
 *
 * Usage: node scripts/backfill-google-place-details.js
 *
 * Options:
 *   --all     Refresh all listings, even those with cached data
 *   --limit N Only process N listings (for testing)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ||
                       process.env.GOOGLE_MAPS_API_KEY ||
                       process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Rate limiting: Google Places API has a limit of ~100 requests per second
// We'll be conservative with 100ms between requests
const DELAY_MS = 100;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPlaceDetails(placeId) {
  const fields = 'photos,opening_hours,rating,user_ratings_total,reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

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
}

async function main() {
  const args = process.argv.slice(2);
  const refreshAll = args.includes('--all');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  console.log('🔄 Backfilling Google Place Details...');
  console.log(`   Refresh all: ${refreshAll}`);
  console.log(`   Limit: ${limit || 'none'}`);
  console.log('');

  if (!GOOGLE_API_KEY) {
    console.error('❌ No Google API key found. Set GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_API_KEY, or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    process.exit(1);
  }

  // Fetch listings with place_id
  let query = supabase
    .from('listings')
    .select('airtable_id, title, place_id, google_place_details')
    .not('place_id', 'is', null);

  if (!refreshAll) {
    // Only fetch listings without cached data
    query = query.is('google_place_details', null);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('❌ Error fetching listings:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${listings.length} listings to process`);
  console.log('');

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const listing of listings) {
    processed++;

    if (!listing.place_id) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${processed}/${listings.length}] ${listing.title.slice(0, 40).padEnd(40)} `);

    try {
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
          failed++;
        } else {
          const rating = details.rating ? `⭐ ${details.rating}` : 'no rating';
          console.log(`✅ ${rating}`);
          succeeded++;
        }
      } else {
        console.log('⚠️  No data from Google');
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Skipped: ${skipped}`);
}

main().catch(console.error);
