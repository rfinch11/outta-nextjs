/**
 * Fix Duplicate Images Script
 *
 * This script finds listings that share the same Unsplash image URL and
 * re-fetches new unique images to ensure variety.
 *
 * Key features:
 * - Only processes Unsplash images (never touches library or provider images)
 * - Tracks all existing images to prevent creating new duplicates
 * - Uses event tags to create more varied and relevant search queries
 * - Keeps the first occurrence, replaces all duplicates with unique images
 *
 * Search strategy:
 * - If event has relevant tags: searches for "title + tags"
 * - If only generic tags (Kids, Free, Eventbrite): searches for "title + children"
 * - Filters generic tags to get more specific, varied results
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

async function searchUnsplash(title, usedImages, tags = null) {
  // Build search query from title and tags
  let searchTerms = title;

  if (tags) {
    // Parse tags (comma-separated) and use relevant ones for search
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    // Pick 1-2 relevant tags to add variety (avoid generic tags like "Kids")
    const relevantTags = tagList
      .filter(tag => !['Kids', 'Eventbrite', 'Free'].includes(tag))
      .slice(0, 2);

    if (relevantTags.length > 0) {
      searchTerms = `${title} ${relevantTags.join(' ')}`;
    } else {
      searchTerms = `${title} children`;
    }
  } else {
    searchTerms = `${title} children`;
  }

  const query = encodeURIComponent(searchTerms);
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

    // Filter out images that are already in use
    const availableImages = data.results.filter(img => {
      const imageUrl = img.urls.regular;
      const baseUrl = imageUrl.split('?')[0];
      return !usedImages.has(baseUrl);
    });

    // If all images are already used, fall back to all results
    const imagesToChooseFrom = availableImages.length > 0 ? availableImages : data.results;

    // Randomly select one of the available results
    const randomIndex = Math.floor(Math.random() * imagesToChooseFrom.length);
    const selectedImage = imagesToChooseFrom[randomIndex];

    const imageUrl = selectedImage.urls.regular;
    const baseUrl = imageUrl.split('?')[0];

    return {
      url: imageUrl,
      baseUrl: baseUrl,
      photographer: selectedImage.user.name,
      wasUnique: availableImages.length > 0,
      searchTerms: searchTerms
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
    .select('airtable_id, title, image, tags')
    .not('image', 'is', null);

  if (error) {
    console.error('❌ Error fetching listings:', error);
    process.exit(1);
  }

  // Build a set of all used images (for uniqueness checking)
  const usedImages = new Set();
  listings.forEach(listing => {
    if (listing.image && listing.image.includes('images.unsplash.com')) {
      const baseUrl = listing.image.split('?')[0];
      usedImages.add(baseUrl);
    }
  });

  console.log(`📋 Found ${usedImages.size} unique Unsplash images in database\n`);

  // Find duplicates - ONLY for Unsplash images
  const imageGroups = {};
  listings.forEach(listing => {
    if (!listing.image) return;

    // ONLY process Unsplash images - never touch library or other provider images
    if (!listing.image.includes('images.unsplash.com')) return;

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
  let duplicateWarnings = 0;

  for (const group of duplicates) {
    console.log(`\n🖼️  Image used by ${group.listings.length} listings:`);
    console.log(`   ${group.url.substring(0, 60)}...`);

    // Keep the first one, re-fetch for the rest
    for (let i = 1; i < group.listings.length; i++) {
      const listing = group.listings[i];
      console.log(`\n   [${i}/${group.listings.length - 1}] ${listing.title}`);

      // Search for new image, passing the set of used images and tags
      const newImage = await searchUnsplash(listing.title, usedImages, listing.tags);

      if (!newImage) {
        console.log(`      ⚠️  No alternative image found`);
        continue;
      }

      if (!newImage.wasUnique) {
        console.log(`      ⚠️  Warning: All available images were already in use`);
        duplicateWarnings++;
      }

      console.log(`      📸 New image by ${newImage.photographer}`);
      if (newImage.searchTerms !== `${listing.title} children`) {
        console.log(`      🔍 Search: "${newImage.searchTerms}"`);
      }

      const success = await updateAirtableImage(listing.airtable_id, newImage.url);

      if (success) {
        console.log(`      ✅ Updated`);
        // Add to used images set to prevent duplicates within this run
        usedImages.add(newImage.baseUrl);
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
  if (duplicateWarnings > 0) {
    console.log(`⚠️  Duplicate warnings: ${duplicateWarnings}`);
  }
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
