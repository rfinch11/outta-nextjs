/**
 * Test Backfill Script (First 3 listings only)
 *
 * This is a test version that only processes the first 3 listings
 * to verify the script works before running on all listings.
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
  process.exit(1);
}

if (!UNSPLASH_KEY) {
  console.error('❌ Missing Unsplash access key in .env.local');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search Unsplash for an image
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
    // Try updating with just the URL string (in case it's a URL field, not attachment)
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
 * Test function - only process first 3 listings
 */
async function testBackfill() {
  console.log('🧪 TEST MODE: Processing first 3 listings only\n');
  console.log('🚀 Starting image backfill test...\n');

  // Fetch listings with missing images from Supabase (limit to 3)
  const { data: listings, error } = await supabase
    .from('listings')
    .select('airtable_id, title, image')
    .or('image.is.null,image.eq.')
    .limit(3);

  if (error) {
    console.error('❌ Error fetching listings from Supabase:', error);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ No listings found with missing images. All done!');
    return;
  }

  console.log(`📊 Found ${listings.length} listings with missing images (showing first 3)\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each listing
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const progress = `[${i + 1}/${listings.length}]`;

    console.log(`${progress} Processing: ${listing.title}`);
    console.log(`  Airtable ID: ${listing.airtable_id}`);

    // Search Unsplash for image
    const image = await searchUnsplash(listing.title);

    if (!image) {
      console.log(`  ⚠️  No image found on Unsplash`);
      skipCount++;
    } else {
      console.log(`  📸 Found image by ${image.photographer}`);
      console.log(`  🔗 URL: ${image.url}`);

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

    // Wait between requests (shorter delay for testing)
    if (i < listings.length - 1) {
      console.log(`  ⏳ Waiting 5 seconds before next request...\n`);
      await delay(5000);
    } else {
      console.log('');
    }
  }

  // Print summary
  console.log('━'.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`  ✅ Successfully updated: ${successCount}`);
  console.log(`  ⚠️  Skipped (no image found): ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('━'.repeat(50));

  if (successCount > 0) {
    console.log('\n💡 Test successful! You can now run the full backfill with:');
    console.log('   node scripts/backfill-images.js');
    console.log('\n💡 Note: It may take a few minutes for the Airtable → Supabase sync');
    console.log('   to run and update the images in your Supabase database.');
  }
}

// Run the test
testBackfill()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
