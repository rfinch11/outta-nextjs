require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

function detectEventCategory(listing) {
  const text = `${listing.title} ${listing.tags || ''}`.toLowerCase();

  if (text.includes('storytime') || text.includes('reading') || text.includes('book')) {
    return 'children reading books';
  }
  if (text.includes('yoga') || text.includes('tai chi') || text.includes('exercise')) {
    return 'kids yoga exercise';
  }
  if (text.includes('steam') || text.includes('maker') || text.includes('engineering') || text.includes('science')) {
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

function extractTitleKeywords(title) {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 3)
    .join(' ');
}

function buildSearchTerms(listing) {
  const searchTerms = [];
  const excludedTerms = ['years old', 'Friendly', 'English', 'Spanish', 'Bilingual', 'All Ages'];

  if (listing.tags) {
    const tags = listing.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => {
        if (tag.length === 0) return false;
        return !excludedTerms.some(term => tag.includes(term));
      });

    if (tags.length > 0) {
      searchTerms.push(tags.join(' ') + ' kids');
    }
  }

  if (listing.tags) {
    const firstTag = listing.tags.split(',')[0]?.trim();
    if (firstTag && !excludedTerms.some(term => firstTag.includes(term))) {
      searchTerms.push(firstTag + ' kids');
    }
  }

  const titleKeywords = extractTitleKeywords(listing.title);
  if (titleKeywords) {
    searchTerms.push(titleKeywords + ' kids');
  }

  const category = detectEventCategory(listing);
  if (category) {
    searchTerms.push(category);
  }

  searchTerms.push('kids activities');
  searchTerms.push('children playing');
  searchTerms.push('family events');

  return [...new Set(searchTerms)];
}

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

async function searchUnsplash(searchTerm) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape&content_filter=high`,
    {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }
  );

  const data = await response.json();
  return data.results || [];
}

async function fetchUnsplashImage(listing, usedPhotoIds) {
  const searchTerms = buildSearchTerms(listing);

  console.log(`   Trying ${searchTerms.length} search strategies...`);

  for (let i = 0; i < searchTerms.length; i++) {
    const searchTerm = searchTerms[i];
    console.log(`   [${i + 1}/${searchTerms.length}] Searching: "${searchTerm}"`);

    try {
      const results = await searchUnsplash(searchTerm);

      if (results.length > 0) {
        let selectedPhoto = null;

        for (const photo of results) {
          if (!usedPhotoIds.has(photo.id)) {
            selectedPhoto = photo;
            break;
          }
        }

        if (!selectedPhoto) {
          console.log(`   ⚠️  All ${results.length} results already used, picking first`);
          selectedPhoto = results[0];
        }

        const imageUrl = selectedPhoto.urls.regular;
        const photographer = selectedPhoto.user.name;
        const photoId = selectedPhoto.id;

        console.log(`   ✅ Found image by ${photographer} (ID: ${photoId})`);

        const { error } = await supabase
          .from('listings')
          .update({
            image: imageUrl,
            unsplash_photo_id: photoId
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
          attemptNumber: i + 1
        };
      } else {
        console.log(`   ⚠️  No results, trying next fallback...`);
      }

    } catch (error) {
      console.error(`   ❌ Error searching: ${error.message}`);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`   ❌ All ${searchTerms.length} search attempts failed`);
  return { success: false, error: 'All search attempts failed' };
}

(async () => {
  console.log('🖼️  Starting manual Unsplash image fetching...\n');

  const usedPhotoIds = await getUsedPhotoIds();
  console.log(`   Loaded ${usedPhotoIds.size} already-used photo IDs for deduplication\n`);

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, tags, image, unsplash_photo_id')
    .is('image', null)
    .limit(100);

  if (error) {
    console.error('❌ Error fetching listings:', error.message);
    return;
  }

  console.log(`Found ${listings.length} listings without images\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    console.log(`🖼️  Processing: ${listing.title}`);

    const result = await fetchUnsplashImage(listing, usedPhotoIds);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Rate limit: 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Images fetched: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
})();
