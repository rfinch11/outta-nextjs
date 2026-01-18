import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

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
 * Returns a search term optimized for finding relevant images
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectEventCategory(listing: any): string | null {
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
  if (
    text.includes('animal') ||
    text.includes('farm') ||
    text.includes('chicken') ||
    text.includes('goat')
  ) {
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
  if (
    text.includes('storytime') ||
    text.includes('story time') ||
    text.includes('reading') ||
    text.includes('book')
  ) {
    return 'children reading books storytime';
  }

  // Activities
  if (text.includes('yoga') || text.includes('tai chi') || text.includes('exercise')) {
    return 'kids yoga exercise';
  }
  if (
    text.includes('steam') ||
    text.includes('maker') ||
    text.includes('engineering') ||
    text.includes('science')
  ) {
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
 * Filters stop words and short words, keeps up to 4 keywords
 */
function extractTitleKeywords(title: string): string {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'good',
    'great',
    'fun',
    'night',
    'day',
    'time',
    'area',
    'what',
    'whats',
  ];

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 4)
    .join(' ');
}

/**
 * Get meaningful tags (filter out unhelpful generic tags)
 */
function getMeaningfulTags(tags: string | null): string[] {
  if (!tags) return [];

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (tag.length === 0) return false;
      return !UNHELPFUL_TAGS.some((unhelpful) =>
        tag.toLowerCase().includes(unhelpful.toLowerCase())
      );
    });
}

/**
 * Detect if this is a park/nature event based on organizer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isParkEvent(listing: any): boolean {
  const organizer = (listing.organizer || '').toLowerCase();
  return (
    organizer.includes('park') ||
    organizer.includes('regional') ||
    (listing.airtable_id && listing.airtable_id.startsWith('ebparks'))
  );
}

/**
 * Build search terms with TITLE as primary priority
 *
 * New priority order:
 * 1. Title keywords + 'children' (most specific to event)
 * 2. Event category (smart detection from title)
 * 3. Meaningful tags + 'kids' (filtered tags only)
 * 4. Source-appropriate fallbacks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSearchTerms(listing: any): string[] {
  const searchTerms: string[] = [];

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
    // Use first meaningful tag
    searchTerms.push(meaningfulTags[0] + ' kids');

    // If multiple meaningful tags, combine first two
    if (meaningfulTags.length > 1) {
      searchTerms.push(meaningfulTags.slice(0, 2).join(' ') + ' children');
    }
  }

  // PRIORITY 4: Source-appropriate fallbacks
  if (isParkEvent(listing)) {
    searchTerms.push('children nature outdoors');
    searchTerms.push('family park activities');
    searchTerms.push('kids outdoor exploration');
  } else {
    searchTerms.push('kids activities');
    searchTerms.push('children playing');
    searchTerms.push('family events');
  }

  // Remove duplicates while preserving order
  return [...new Set(searchTerms)];
}

/**
 * Get set of already-used Unsplash photo IDs to avoid duplicates
 */
async function getUsedPhotoIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('listings')
    .select('unsplash_photo_id')
    .not('unsplash_photo_id', 'is', null);

  if (error) {
    console.error(`   ⚠️  Error fetching used photo IDs: ${error.message}`);
    return new Set();
  }

  return new Set(data.map((row) => row.unsplash_photo_id));
}

/**
 * Search Unsplash API with a specific term
 * Returns up to 30 results for better variety
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchUnsplash(searchTerm: string): Promise<any[]> {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=30&orientation=landscape&content_filter=high`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  const data = await response.json();
  return data.results || [];
}

/**
 * Randomly select from an array
 */
function randomSelect<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fetch image from Unsplash with title-first search strategy
 * - Prioritizes title-based searches
 * - Randomly selects from unused results for variety
 * - Falls back progressively to broader terms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchUnsplashImage(listing: any, usedPhotoIds: Set<string>) {
  const searchTerms = buildSearchTerms(listing);

  console.log(`   Trying ${searchTerms.length} search strategies...`);

  for (let i = 0; i < searchTerms.length; i++) {
    const searchTerm = searchTerms[i];
    console.log(`   [${i + 1}/${searchTerms.length}] Searching: "${searchTerm}"`);

    try {
      const results = await searchUnsplash(searchTerm);

      if (results.length > 0) {
        // Filter to unused photos
        const unusedPhotos = results.filter((photo) => !usedPhotoIds.has(photo.id));

        let selectedPhoto = null;

        if (unusedPhotos.length > 0) {
          // Randomly select from unused photos for variety
          selectedPhoto = randomSelect(unusedPhotos);
          console.log(
            `   📊 ${unusedPhotos.length}/${results.length} results unused, randomly selecting`
          );
        } else {
          // All photos used, try next search term for better variety
          console.log(`   ⚠️  All ${results.length} results already used, trying next term...`);
          continue; // Try next search term instead of reusing
        }

        const imageUrl = selectedPhoto.urls.regular;
        const photographer = selectedPhoto.user.name;
        const photoId = selectedPhoto.id;

        console.log(`   ✅ Found image by ${photographer} (ID: ${photoId})`);

        const { error } = await supabase
          .from('listings')
          .update({
            image: imageUrl,
            unsplash_photo_id: photoId,
          })
          .eq('id', listing.id);

        if (error) {
          console.error(`   ❌ Error updating listing: ${error.message}`);
          return { success: false, error: error.message };
        }

        usedPhotoIds.add(photoId);

        console.log(`   ✅ Image added to: ${listing.title}`);
        return {
          success: true,
          imageUrl,
          photographer,
          photoId,
          searchTerm,
          attemptNumber: i + 1,
        };
      } else {
        console.log(`   ⚠️  No results, trying next fallback...`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`   ❌ Error searching: ${error.message}`);
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // If all search terms exhausted with no unused photos, pick from last successful search
  console.log(`   ⚠️  All terms exhausted, doing final fallback search...`);
  try {
    const lastResortResults = await searchUnsplash('children outdoor activities');
    if (lastResortResults.length > 0) {
      const selectedPhoto = randomSelect(lastResortResults);
      const imageUrl = selectedPhoto.urls.regular;
      const photographer = selectedPhoto.user.name;
      const photoId = selectedPhoto.id;

      const { error } = await supabase
        .from('listings')
        .update({
          image: imageUrl,
          unsplash_photo_id: photoId,
        })
        .eq('id', listing.id);

      if (!error) {
        usedPhotoIds.add(photoId);
        console.log(`   ✅ Final fallback: image by ${photographer}`);
        return {
          success: true,
          imageUrl,
          photographer,
          photoId,
          searchTerm: 'children outdoor activities (fallback)',
          attemptNumber: 'fallback',
        };
      }
    }
  } catch {
    // Ignore fallback errors
  }

  console.log(`   ❌ All ${searchTerms.length} search attempts failed`);
  return { success: false, error: 'All search attempts failed' };
}

/**
 * API Route Handler for Unsplash image fetching cron job
 */
export async function POST(request: NextRequest) {
  // Security: Check for cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('\n🖼️  Starting Unsplash image fetching...');

  try {
    // Get set of already-used photo IDs to avoid duplicates
    console.log('   Loading used photo IDs for deduplication...');
    const usedPhotoIds = await getUsedPhotoIds();
    console.log(`   Found ${usedPhotoIds.size} already-used Unsplash photos`);

    // Find all listings without images (include organizer for park detection)
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, airtable_id, title, tags, organizer, image, unsplash_photo_id')
      .is('image', null)
      .limit(50); // Process 50 at a time to avoid rate limits

    if (error) {
      console.error('❌ Error fetching listings:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`   Found ${listings.length} listings without images\n`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each listing
    for (const listing of listings) {
      console.log(`📸 Processing: ${listing.title}`);

      const result = await fetchUnsplashImage(listing, usedPhotoIds);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      results.push({
        listingId: listing.id,
        title: listing.title,
        ...result,
      });

      // Add a delay to respect Unsplash rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Images added: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Unique photos used: ${usedPhotoIds.size}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: listings.length,
      imagesAdded: successCount,
      errors: errorCount,
      uniquePhotosUsed: usedPhotoIds.size,
      results,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
