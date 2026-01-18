/**
 * Re-fetch Unsplash images for East Bay Regional Park events
 *
 * This script:
 * 1. Finds all EBRP events with duplicate/problematic images
 * 2. Clears their image field
 * 3. Re-fetches using the new title-first search strategy
 *
 * Usage:
 *   node scripts/refetch-ebparks-images.js           # Re-fetch all duplicates
 *   node scripts/refetch-ebparks-images.js --dry-run # Preview only (no changes)
 *   node scripts/refetch-ebparks-images.js --limit 20 # Process only 20 events
 *
 * Note: Unsplash demo API has a rate limit of 50 requests/hour.
 * Process in batches of 15-20 to avoid hitting limits.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

// Parse --limit option
const limitIndex = process.argv.indexOf('--limit');
const LIMIT = limitIndex !== -1 && process.argv[limitIndex + 1]
  ? parseInt(process.argv[limitIndex + 1], 10)
  : null;

// Tags that don't help with image search specificity
const UNHELPFUL_TAGS = [
  'East Bay Regional Park District',
  'Outdoor',
  'Nature',
  'Drop-in',
  'Free',
  'Kids',
  'Eventbrite',
  'years old',
  'Friendly',
  'English',
  'Spanish',
  'Bilingual',
  'All Ages',
  'Educational',
];

/**
 * Detect event category from title for smart image search
 */
function detectEventCategory(listing) {
  const title = listing.title.toLowerCase();
  const text = `${listing.title} ${listing.tags || ''}`.toLowerCase();

  // Animals & Wildlife (check specific animals first)
  if (title.includes('fish') || title.includes('gills')) {
    return 'children fish aquarium';
  }
  if (title.includes('duck') || title.includes('goose') || title.includes('waterfowl')) {
    return 'ducks pond wildlife';
  }
  if (title.includes('bird') || title.includes('wings') || title.includes('wetland')) {
    return 'children birdwatching nature';
  }
  if (title.includes('newt') || title.includes('salamander') || title.includes('amphibian')) {
    return 'salamander nature pond';
  }
  if (title.includes('animal feeding') || title.includes('feed the')) {
    return 'children feeding farm animals';
  }
  if (text.includes('animal') || text.includes('farm') || text.includes('chicken') || text.includes('goat')) {
    return 'farm animals children petting';
  }

  // Nature & Outdoors
  if (title.includes('hike') || title.includes('walk') || title.includes('trail')) {
    return 'family hiking nature trail';
  }
  if (title.includes('lake') || title.includes('lakeside') || title.includes('pond')) {
    return 'children lake nature';
  }
  if (title.includes('creek') || title.includes('stream') || title.includes('water')) {
    return 'children creek nature exploration';
  }
  if (title.includes('marsh') || title.includes('wetland')) {
    return 'wetland marsh nature';
  }
  if (title.includes('mushroom') || title.includes('fungus') || title.includes('fungi')) {
    return 'mushroom foraging nature';
  }
  if (title.includes('canyon') || title.includes('valley')) {
    return 'hiking canyon nature family';
  }

  // Marine & Prehistoric
  if (title.includes('shark') || title.includes('megalodon')) {
    return 'shark ocean prehistoric';
  }
  if (title.includes('dinosaur') || title.includes('fossil')) {
    return 'dinosaur fossil children museum';
  }
  if (title.includes('delta') || title.includes('discovery')) {
    return 'nature discovery children outdoors';
  }

  // Arts & Crafts
  if (title.includes('puppet')) {
    return 'puppet show children';
  }
  if (title.includes('embroidery') || title.includes('sewing') || title.includes('needle')) {
    return 'children sewing craft';
  }
  if (title.includes('felting') || title.includes('felt')) {
    return 'felt craft children';
  }
  if (text.includes('craft') || text.includes('art')) {
    return 'kids arts crafts';
  }

  // Reading & Stories
  if (text.includes('storytime') || text.includes('story time') || text.includes('reading') || text.includes('book')) {
    return 'children reading books storytime';
  }

  // Activities
  if (text.includes('yoga') || text.includes('tai chi') || text.includes('exercise')) {
    return 'kids yoga exercise';
  }
  if (text.includes('steam') || text.includes('maker') || text.includes('engineering') || text.includes('science')) {
    return 'kids science hands-on activities';
  }
  if (text.includes('music') || text.includes('sing') || text.includes('dance')) {
    return 'kids music dance';
  }
  if (text.includes('game') || text.includes('play')) {
    return 'kids playing games';
  }
  if (text.includes('food') || text.includes('cooking') || text.includes('meal')) {
    return 'kids cooking food';
  }
  if (text.includes('library')) {
    return 'kids library activities';
  }
  if (text.includes('tot') || text.includes('toddler') || text.includes('little')) {
    return 'toddlers outdoor play nature';
  }

  return null;
}

/**
 * Extract meaningful keywords from title
 */
function extractTitleKeywords(title) {
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'good', 'great', 'fun', 'night', 'day', 'time', 'area', 'what', 'whats'
  ];

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 4)
    .join(' ');
}

/**
 * Get meaningful tags (filter out unhelpful generic tags)
 */
function getMeaningfulTags(tags) {
  if (!tags) return [];

  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => {
      if (tag.length === 0) return false;
      return !UNHELPFUL_TAGS.some(unhelpful =>
        tag.toLowerCase().includes(unhelpful.toLowerCase())
      );
    });
}

/**
 * Build search terms with TITLE as primary priority
 */
function buildSearchTerms(listing) {
  const searchTerms = [];

  // PRIORITY 1: Title keywords (most important!)
  const titleKeywords = extractTitleKeywords(listing.title);
  if (titleKeywords) {
    searchTerms.push(titleKeywords + ' children');
  }

  // PRIORITY 2: Smart category detection from title
  const category = detectEventCategory(listing);
  if (category) {
    searchTerms.push(category);
  }

  // PRIORITY 3: Meaningful tags only (filtered)
  const meaningfulTags = getMeaningfulTags(listing.tags);
  if (meaningfulTags.length > 0) {
    searchTerms.push(meaningfulTags[0] + ' kids');
    if (meaningfulTags.length > 1) {
      searchTerms.push(meaningfulTags.slice(0, 2).join(' ') + ' children');
    }
  }

  // PRIORITY 4: Park-specific fallbacks
  searchTerms.push('children nature outdoors');
  searchTerms.push('family park activities');
  searchTerms.push('kids outdoor exploration');

  return [...new Set(searchTerms)];
}

/**
 * Get set of already-used Unsplash photo IDs
 */
async function getUsedPhotoIds() {
  const { data, error } = await supabase
    .from('listings')
    .select('unsplash_photo_id')
    .not('unsplash_photo_id', 'is', null);

  if (error) {
    console.error(`⚠️  Error fetching used photo IDs: ${error.message}`);
    return new Set();
  }

  return new Set(data.map(row => row.unsplash_photo_id));
}

/**
 * Search Unsplash API
 */
async function searchUnsplash(searchTerm) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=30&orientation=landscape&content_filter=high`,
    {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }
  );

  const data = await response.json();
  return data.results || [];
}

/**
 * Randomly select from an array
 */
function randomSelect(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fetch image from Unsplash with new strategy
 */
async function fetchUnsplashImage(listing, usedPhotoIds) {
  const searchTerms = buildSearchTerms(listing);

  console.log(`   Search terms: ${searchTerms.slice(0, 3).join(' | ')}`);

  for (let i = 0; i < searchTerms.length; i++) {
    const searchTerm = searchTerms[i];

    try {
      const results = await searchUnsplash(searchTerm);

      if (results.length > 0) {
        const unusedPhotos = results.filter(photo => !usedPhotoIds.has(photo.id));

        if (unusedPhotos.length > 0) {
          const selectedPhoto = randomSelect(unusedPhotos);
          const imageUrl = selectedPhoto.urls.regular;
          const photographer = selectedPhoto.user.name;
          const photoId = selectedPhoto.id;

          console.log(`   ✅ Found: "${searchTerm}" → ${photographer} (${unusedPhotos.length}/${results.length} unused)`);

          if (!DRY_RUN) {
            const { error } = await supabase
              .from('listings')
              .update({
                image: imageUrl,
                unsplash_photo_id: photoId
              })
              .eq('id', listing.id);

            if (error) {
              console.error(`   ❌ Error updating: ${error.message}`);
              return { success: false };
            }
          }

          usedPhotoIds.add(photoId);
          return { success: true, searchTerm, photographer, photoId };
        }
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`   ❌ No unused images found`);
  return { success: false };
}

async function main() {
  console.log('🖼️  Re-fetching images for East Bay Regional Park events\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  if (LIMIT) {
    console.log(`📊 Processing limit: ${LIMIT} events\n`);
  }

  // Get today's date at midnight for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  console.log(`📅 Only processing events from ${today.toLocaleDateString()} onwards\n`);

  // Get all EBRP events that are today or in the future, sorted by date
  const { data: ebparksEvents, error } = await supabase
    .from('listings')
    .select('id, airtable_id, title, tags, organizer, image, unsplash_photo_id, start_date')
    .like('airtable_id', 'ebparks%')
    .gte('start_date', todayISO)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching EBRP events:', error.message);
    return;
  }

  console.log(`Found ${ebparksEvents.length} EBRP events\n`);

  // Find duplicate photo IDs
  const photoIdCounts = {};
  ebparksEvents.forEach(event => {
    if (event.unsplash_photo_id) {
      photoIdCounts[event.unsplash_photo_id] = (photoIdCounts[event.unsplash_photo_id] || 0) + 1;
    }
  });

  const duplicatePhotoIds = new Set(
    Object.entries(photoIdCounts)
      .filter(([id, count]) => count > 1)
      .map(([id]) => id)
  );

  console.log(`Found ${duplicatePhotoIds.size} duplicate photo IDs\n`);

  // Get events with duplicate images
  let eventsToRefetch = ebparksEvents.filter(event =>
    event.unsplash_photo_id && duplicatePhotoIds.has(event.unsplash_photo_id)
  );

  // Apply limit if specified
  if (LIMIT && eventsToRefetch.length > LIMIT) {
    console.log(`Limiting to first ${LIMIT} of ${eventsToRefetch.length} events\n`);
    eventsToRefetch = eventsToRefetch.slice(0, LIMIT);
  }

  console.log(`Will re-fetch images for ${eventsToRefetch.length} events\n`);
  console.log('─'.repeat(60) + '\n');

  // Get used photo IDs (excluding ones we're about to clear)
  const usedPhotoIds = await getUsedPhotoIds();

  // Remove the duplicate IDs from the used set (we're replacing them)
  duplicatePhotoIds.forEach(id => usedPhotoIds.delete(id));

  let successCount = 0;
  let errorCount = 0;

  for (const event of eventsToRefetch) {
    const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No date';
    console.log(`📸 [${eventDate}] ${event.title}`);
    console.log(`   Old photo: ${event.unsplash_photo_id}`);

    // Clear the old image first (if not dry run)
    if (!DRY_RUN) {
      await supabase
        .from('listings')
        .update({ image: null, unsplash_photo_id: null })
        .eq('id', event.id);
    }

    const result = await fetchUnsplashImage(event, usedPhotoIds);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }

    console.log('');

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  if (DRY_RUN) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
