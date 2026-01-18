#!/usr/bin/env node

/**
 * Manual script to refresh Google Place details for listings
 *
 * Usage:
 *   node scripts/refresh-place-details.js                    # Refresh all listings with place_id but no cached data
 *   node scripts/refresh-place-details.js --all              # Refresh ALL listings with place_id
 *   node scripts/refresh-place-details.js --stale            # Refresh listings with stale cache (>7 days)
 *   node scripts/refresh-place-details.js --place-id <id>    # Refresh specific place_id
 *   node scripts/refresh-place-details.js --limit 50         # Limit number of listings to refresh
 *
 * Requires: GOOGLE_MAPS_API_KEY and SUPABASE_SERVICE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  all: args.includes('--all'),
  stale: args.includes('--stale'),
  placeId: args.includes('--place-id') ? args[args.indexOf('--place-id') + 1] : null,
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 100,
  dryRun: args.includes('--dry-run'),
};

const STALE_THRESHOLD_DAYS = 7;

/**
 * Fetch place details from Google Places API
 */
async function fetchPlaceDetails(placeId) {
  const fields = [
    'photos',
    'opening_hours',
    'rating',
    'user_ratings_total',
    'reviews',
  ].join(',');

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`  Google API error for ${placeId}: ${data.status}`);
      return null;
    }

    const result = data.result;

    // Transform to our format
    return {
      photos: result.photos?.slice(0, 10).map((photo) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`,
        width: photo.width,
        height: photo.height,
      })) || [],
      openingHours: result.opening_hours
        ? {
            isOpen: result.opening_hours.open_now ?? null,
            weekdayText: result.opening_hours.weekday_text || [],
          }
        : null,
      rating: result.rating ?? null,
      userRatingsTotal: result.user_ratings_total ?? null,
      reviews: result.reviews?.slice(0, 5).map((review) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        relativeTimeDescription: review.relative_time_description,
      })) || [],
    };
  } catch (error) {
    console.error(`  Fetch error for ${placeId}:`, error.message);
    return null;
  }
}

/**
 * Get listings to refresh based on flags
 */
async function getListingsToRefresh() {
  let query = supabase
    .from('listings')
    .select('airtable_id, place_id, title, google_place_details, place_details_updated_at')
    .not('place_id', 'is', null);

  if (flags.placeId) {
    query = query.eq('place_id', flags.placeId);
  } else if (flags.all) {
    // Get all listings with place_id
  } else if (flags.stale) {
    // Get listings with stale cache
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS);
    query = query.or(`place_details_updated_at.is.null,place_details_updated_at.lt.${staleDate.toISOString()}`);
  } else {
    // Default: get listings with no cached data
    query = query.is('google_place_details', null);
  }

  query = query.limit(flags.limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

/**
 * Main function
 */
async function main() {
  console.log('=== Google Place Details Refresh ===\n');

  if (!GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_MAPS_API_KEY not set in .env.local');
    process.exit(1);
  }

  console.log('Flags:', flags);
  console.log('');

  const listings = await getListingsToRefresh();
  console.log(`Found ${listings.length} listings to refresh\n`);

  if (listings.length === 0) {
    console.log('No listings to refresh.');
    return;
  }

  if (flags.dryRun) {
    console.log('Dry run - would refresh:');
    listings.forEach((l) => console.log(`  - ${l.title} (${l.place_id})`));
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    console.log(`[${i + 1}/${listings.length}] ${listing.title}`);

    const details = await fetchPlaceDetails(listing.place_id);

    if (details) {
      const { error } = await supabase
        .from('listings')
        .update({
          google_place_details: details,
          place_details_updated_at: new Date().toISOString(),
        })
        .eq('airtable_id', listing.airtable_id);

      if (error) {
        console.error(`  Error updating: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ Updated (${details.photos?.length || 0} photos, rating: ${details.rating || 'N/A'})`);
        success++;
      }
    } else {
      failed++;
    }

    // Rate limit: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('\n=== Summary ===');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
