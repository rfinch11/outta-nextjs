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
  if (text.includes('yoga') || text.includes('meditation')) {
    return 'kids yoga';
  }
  if (text.includes('science') || text.includes('steam')) {
    return 'kids science activities';
  }
  if (text.includes('craft') || text.includes('art') || text.includes('felting')) {
    return 'kids arts crafts';
  }
  if (text.includes('music') || text.includes('sing')) {
    return 'kids music';
  }
  if (text.includes('animal') || text.includes('farm') || text.includes('chicken') || text.includes('feeding')) {
    return 'farm animals children';
  }
  if (text.includes('nature') || text.includes('hike') || text.includes('trail') || text.includes('bird')) {
    return 'kids nature hiking';
  }
  if (text.includes('water') || text.includes('fish') || text.includes('shore') || text.includes('kayak')) {
    return 'kids water activities';
  }
  if (text.includes('puppet')) {
    return 'puppet show children';
  }
  if (text.includes('newt') || text.includes('mushroom') || text.includes('fungus')) {
    return 'nature exploration children';
  }

  return 'kids outdoor activities';
}

async function searchUnsplash(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
    }
  });

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const photo = data.results[0];
    return {
      success: true,
      url: photo.urls.regular,
      photoId: photo.id
    };
  }
  return { success: false };
}

async function run() {
  console.log('Fetching listings without images...');

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, tags, image')
    .is('image', null)
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${listings.length} listings without images\n`);

  let success = 0, failed = 0;

  for (const listing of listings) {
    const searchTerm = detectEventCategory(listing);
    process.stdout.write(`${listing.title.substring(0, 35).padEnd(35)} [${searchTerm.substring(0, 20)}]... `);

    const result = await searchUnsplash(searchTerm);

    if (result.success) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          image: result.url,
          unsplash_photo_id: result.photoId
        })
        .eq('id', listing.id);

      if (updateError) {
        console.log('UPDATE FAILED');
        failed++;
      } else {
        console.log('OK');
        success++;
      }
    } else {
      console.log('NO IMAGE FOUND');
      failed++;
    }

    // Rate limit - Unsplash allows 50 requests per hour for demo apps
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

run();
