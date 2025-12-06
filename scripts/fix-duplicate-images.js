/**
 * Fix Duplicate Images Script
 *
 * This script finds listings that share the same image URL and re-fetches
 * new random images from Unsplash to ensure variety.
 *
 * Usage: node scripts/fix-duplicate-images.js
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

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchUnsplash(title) {
  const query = encodeURIComponent(`${title} children`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=30&orientation=landscape`;

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

    // Randomly select one of the results for variety
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const selectedImage = data.results[randomIndex];

    return {
      url: selectedImage.urls.regular,
      photographer: selectedImage.user.name
    };
  } catch (error) {
    console.error(`Error fetching from Unsplash:`, error.message);
    return null;
  }
}

async function updateAirtableImage(airtableId, imageUrl) {
  try {
    await airtable('Listings').update(airtableId, {
      'Image': imageUrl
    });
    return true;
  } catch (error) {
    console.error(`Error updating Airtable record ${airtableId}:`, error.message);
    return false;
  }
}

async function fixDuplicateImages() {
  console.log('🔍 Finding duplicate images...\n');

  // Get all listings with images
  const { data: listings, error } = await supabase
    .from('listings')
    .select('airtable_id, title, image')
    .not('image', 'is', null);

  if (error) {
    console.error('❌ Error fetching listings:', error);
    process.exit(1);
  }

  // Find duplicates
  const imageGroups = {};
  listings.forEach(listing => {
    if (!listing.image) return;

    if (!imageGroups[listing.image]) {
      imageGroups[listing.image] = [];
    }
    imageGroups[listing.image].push(listing);
  });

  // Filter to only groups with duplicates
  const duplicates = Object.entries(imageGroups)
    .filter(([url, listings]) => listings.length > 1)
    .map(([url, listings]) => ({ url, listings }));

  if (duplicates.length === 0) {
    console.log('✅ No duplicate images found!');
    return;
  }

  console.log(`📊 Found ${duplicates.length} images used by multiple listings:\n`);

  let totalFixed = 0;

  for (const group of duplicates) {
    console.log(`\n🖼️  Image used by ${group.listings.length} listings:`);
    console.log(`   ${group.url.substring(0, 60)}...`);

    // Keep the first one, re-fetch for the rest
    for (let i = 1; i < group.listings.length; i++) {
      const listing = group.listings[i];
      console.log(`\n   [${i}/${group.listings.length - 1}] ${listing.title}`);

      // Search for new image
      const newImage = await searchUnsplash(listing.title);

      if (!newImage) {
        console.log(`      ⚠️  No alternative image found`);
        continue;
      }

      if (newImage.url === group.url) {
        console.log(`      ⚠️  Got same image, trying again...`);
        await delay(1000);
        const retryImage = await searchUnsplash(listing.title);
        if (retryImage && retryImage.url !== group.url) {
          newImage.url = retryImage.url;
          newImage.photographer = retryImage.photographer;
        }
      }

      console.log(`      📸 New image by ${newImage.photographer}`);

      const success = await updateAirtableImage(listing.airtable_id, newImage.url);

      if (success) {
        console.log(`      ✅ Updated`);
        totalFixed++;
      } else {
        console.log(`      ❌ Failed to update`);
      }

      // Rate limiting
      if (i < group.listings.length - 1) {
        console.log(`      ⏳ Waiting 5 seconds...`);
        await delay(5000);
      }
    }
  }

  console.log('\n━'.repeat(50));
  console.log(`✅ Fixed ${totalFixed} duplicate images`);
  console.log('━'.repeat(50));
}

fixDuplicateImages()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
