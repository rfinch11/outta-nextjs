import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

/**
 * Detect event category from title and tags for smart fallbacks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectEventCategory(listing: any): string | null {
  const text = `${listing.title} ${listing.tags || ''}`.toLowerCase();

  if (text.includes('storytime') || text.includes('reading') || text.includes('book')) {
    return 'children reading books';
  }
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
  if (text.includes('sewing') || text.includes('craft') || text.includes('art')) {
    return 'kids arts crafts';
  }
  if (text.includes('music') || text.includes('sing') || text.includes('dance')) {
    return 'kids music dance';
  }
  if (text.includes('game') || text.includes('play')) {
    return 'kids playing games';
  }
  if (text.includes('food') || text.includes('cooking') || text.includes('meal')) {
    return 'kids healthy food';
  }
  if (text.includes('library')) {
    return 'kids library activities';
  }

  return null;
}

/**
 * Extract meaningful keywords from title
 */
function extractTitleKeywords(title: string): string {
  // Remove common words and extract key terms
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
  ];

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word))
    .slice(0, 3) // Take first 3 meaningful words
    .join(' ');
}

/**
 * Build progressive search terms with fallbacks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSearchTerms(listing: any): string[] {
  const searchTerms: string[] = [];

  // Excluded terms that don't help with image search
  const excludedTerms = ['years old', 'Friendly', 'English', 'Spanish', 'Bilingual', 'All Ages'];

  // Try 1: All tags + 'kids'
  if (listing.tags) {
    const tags = listing.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => {
        if (tag.length === 0) return false;
        return !excludedTerms.some((term) => tag.includes(term));
      });

    if (tags.length > 0) {
      searchTerms.push(tags.join(' ') + ' kids');
    }
  }

  // Try 2: First tag + 'kids'
  if (listing.tags) {
    const firstTag = listing.tags.split(',')[0]?.trim();
    if (firstTag && !excludedTerms.some((term) => firstTag.includes(term))) {
      searchTerms.push(firstTag + ' kids');
    }
  }

  // Try 3: Title keywords + 'kids'
  const titleKeywords = extractTitleKeywords(listing.title);
  if (titleKeywords) {
    searchTerms.push(titleKeywords + ' kids');
  }

  // Try 4: Event category (smart detection)
  const category = detectEventCategory(listing);
  if (category) {
    searchTerms.push(category);
  }

  // Try 5: Generic fallbacks (guaranteed to find something)
  searchTerms.push('kids activities');
  searchTerms.push('children playing');
  searchTerms.push('family events');

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
 * Search Unsplash with a specific term
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchUnsplash(searchTerm: string): Promise<any[]> {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape&content_filter=high`,
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
 * Fetch image from Unsplash for a single listing with progressive fallbacks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchUnsplashImage(listing: any, usedPhotoIds: Set<string>) {
  const searchTerms = buildSearchTerms(listing);

  console.log(`   Trying ${searchTerms.length} search strategies...`);

  // Try each search term progressively
  for (let i = 0; i < searchTerms.length; i++) {
    const searchTerm = searchTerms[i];
    console.log(`   [${i + 1}/${searchTerms.length}] Searching: "${searchTerm}"`);

    try {
      const results = await searchUnsplash(searchTerm);

      if (results.length > 0) {
        // Find the first photo that hasn't been used yet
        let selectedPhoto = null;

        for (const photo of results) {
          if (!usedPhotoIds.has(photo.id)) {
            selectedPhoto = photo;
            break;
          }
        }

        // If all photos are used, pick the least-used one (first result)
        if (!selectedPhoto) {
          console.log(`   ⚠️  All ${results.length} results already used, picking first`);
          selectedPhoto = results[0];
        }

        const imageUrl = selectedPhoto.urls.regular;
        const photographer = selectedPhoto.user.name;
        const photoId = selectedPhoto.id;

        console.log(`   ✅ Found image by ${photographer} (ID: ${photoId})`);

        // Update the listing with the image AND photo ID
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

        // Add this photo ID to the used set
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
      continue; // Try next search term
    }

    // Small delay between searches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // If we get here, all search terms failed (shouldn't happen with generic fallbacks)
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

    // Find all listings without images
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, place_type, tags, image, unsplash_photo_id')
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
