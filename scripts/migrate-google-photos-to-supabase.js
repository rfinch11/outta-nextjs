#!/usr/bin/env node

/**
 * Migrate Google Place photos to Supabase Storage
 *
 * Downloads 1 photo per listing from Google Places API and uploads to Supabase Storage.
 * Updates the listing's image column with the permanent Supabase URL.
 *
 * Usage:
 *   node scripts/migrate-google-photos-to-supabase.js --dry-run    # Preview what would be migrated
 *   node scripts/migrate-google-photos-to-supabase.js --limit 10   # Migrate 10 listings
 *   node scripts/migrate-google-photos-to-supabase.js              # Migrate all
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
};

/**
 * Get photo reference from Google Places API
 */
async function getPhotoReference(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.result?.photos?.[0]) {
    return null;
  }

  return data.result.photos[0].photo_reference;
}

/**
 * Download photo from Google Places Photo API
 */
async function downloadPhoto(photoReference, maxWidth = 800) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload photo to Supabase Storage
 */
async function uploadToSupabase(buffer, filename) {
  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Return public URL
  const { data: publicUrlData } = supabase.storage
    .from('listing-images')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

/**
 * Process a single listing
 */
async function processListing(listing) {
  const { airtable_id, title, place_id } = listing;

  console.log(`\nProcessing: ${title}`);
  console.log(`  Place ID: ${place_id}`);

  // Get photo reference
  const photoReference = await getPhotoReference(place_id);
  if (!photoReference) {
    console.log(`  ⚠️  No photos available from Google`);
    return { success: false, error: 'No photos available' };
  }

  // Download photo
  console.log(`  📥 Downloading photo...`);
  const photoBuffer = await downloadPhoto(photoReference);

  // Upload to Supabase
  const filename = `places/${airtable_id}.jpg`;
  console.log(`  📤 Uploading to Supabase...`);
  const publicUrl = await uploadToSupabase(photoBuffer, filename);

  // Update listing
  console.log(`  💾 Updating listing...`);
  const { error: updateError } = await supabase
    .from('listings')
    .update({ image: publicUrl })
    .eq('airtable_id', airtable_id);

  if (updateError) {
    console.log(`  ❌ Failed to update listing: ${updateError.message}`);
    return { success: false, error: updateError.message };
  }

  console.log(`  ✅ Done: ${publicUrl}`);
  return { success: true, url: publicUrl };
}

/**
 * Main function
 */
async function main() {
  console.log('=== Google Photos to Supabase Migration ===\n');

  if (!GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_MAPS_API_KEY not set');
    process.exit(1);
  }

  console.log('Flags:', flags);

  // Find listings with Google image URLs that need migration
  let query = supabase
    .from('listings')
    .select('airtable_id, title, place_id, image')
    .like('image', '%lh3.googleusercontent.com%')
    .not('place_id', 'is', null);

  if (flags.limit) {
    query = query.limit(flags.limit);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error.message);
    process.exit(1);
  }

  console.log(`\nFound ${listings.length} listings to migrate\n`);

  if (listings.length === 0) {
    console.log('Nothing to migrate!');
    return;
  }

  if (flags.dryRun) {
    console.log('Dry run - would migrate:');
    listings.forEach(l => console.log(`  - ${l.title}`));
    console.log(`\nEstimated cost: ~$${(listings.length * 0.04).toFixed(2)} (one-time)`);
    return;
  }

  // Process each listing
  let success = 0;
  let failed = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    console.log(`\n[${i + 1}/${listings.length}]`);

    try {
      const result = await processListing(listing);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      failed++;
    }

    // Rate limit: 100ms between requests
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n=== Summary ===');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
