/**
 * Backfill Images Script
 *
 * This script fetches all listings from Supabase with missing images,
 * searches Unsplash for relevant images, and updates Airtable records.
 *
 * Usage: node scripts/backfill-images.js
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - AIRTABLE_ACCESS_TOKEN (Personal Access Token)
 * - AIRTABLE_BASE_ID
 * - UNSPLASH_ACCESS_KEY
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing Airtable credentials in .env.local');
  console.log('Please add:');
  console.log('  AIRTABLE_ACCESS_TOKEN=your_token');
  console.log('  AIRTABLE_BASE_ID=your_base_id');
  process.exit(1);
}

if (!UNSPLASH_KEY) {
  console.error('❌ Missing Unsplash access key in .env.local');
  console.log('Please add: UNSPLASH_ACCESS_KEY=your_key');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

// Delay helper to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search Unsplash for an image based on title
 */
async function searchUnsplash(title) {
  const query = encodeURIComponent(`${title} children`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    return {
      url: data.results[0].urls.regular,
      photographer: data.results[0].user.name
    };
  } catch (error) {
    console.error(`Error fetching from Unsplash:`, error.message);
    return null;
  }
}

/**
 * Update Airtable record with image URL
 */
async function updateAirtableImage(airtableId, imageUrl) {
  try {
    // Image field is a URL field (text), not an attachment field
    await airtable('Listings').update(airtableId, {
      'Image': imageUrl
    });
    return true;
  } catch (error) {
    console.error(`Error updating Airtable record ${airtableId}:`, error.message);
    return false;
  }
}

/**
 * Main backfill function
 */
async function backfillImages() {
  console.log('🚀 Starting image backfill process...\n');

  // Fetch all listings with missing images from Supabase
  const { data: listings, error } = await supabase
    .from('listings')
    .select('airtable_id, title, image')
    .or('image.is.null,image.eq.');

  if (error) {
    console.error('❌ Error fetching listings from Supabase:', error);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ No listings found with missing images. All done!');
    return;
  }

  console.log(`📊 Found ${listings.length} listings with missing images\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each listing
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const progress = `[${i + 1}/${listings.length}]`;

    console.log(`${progress} Processing: ${listing.title}`);

    // Search Unsplash for image
    const image = await searchUnsplash(listing.title);

    if (!image) {
      console.log(`  ⚠️  No image found on Unsplash`);
      skipCount++;
    } else {
      console.log(`  📸 Found image by ${image.photographer}`);

      // Update Airtable
      const success = await updateAirtableImage(listing.airtable_id, image.url);

      if (success) {
        console.log(`  ✅ Updated Airtable record`);
        successCount++;
      } else {
        console.log(`  ❌ Failed to update Airtable`);
        errorCount++;
      }
    }

    // Rate limit: Unsplash allows 50 requests per hour for free tier
    // Wait 75 seconds between requests to be safe (48 requests/hour)
    if (i < listings.length - 1) {
      console.log(`  ⏳ Waiting 75 seconds before next request...\n`);
      await delay(75000);
    } else {
      console.log('');
    }
  }

  // Print summary
  console.log('━'.repeat(50));
  console.log('📊 Backfill Summary:');
  console.log(`  ✅ Successfully updated: ${successCount}`);
  console.log(`  ⚠️  Skipped (no image found): ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('━'.repeat(50));

  if (successCount > 0) {
    console.log('\n💡 Note: It may take a few minutes for the Airtable → Supabase sync to run');
    console.log('   and update the images in your Supabase database.');
  }
}

// Run the script
backfillImages()
  .then(() => {
    console.log('\n✅ Backfill process complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
