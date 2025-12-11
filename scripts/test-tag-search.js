/**
 * Test script to verify tag-based image search
 *
 * This script tests that the searchUnsplash function uses tags
 * to create more varied search queries.
 */

require('dotenv').config({ path: '.env.local' });

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_KEY) {
  console.error('❌ Missing UNSPLASH_ACCESS_KEY in .env.local');
  process.exit(1);
}

// Copy the updated searchUnsplash function
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
      searchTerms: searchTerms,
      totalResults: data.results.length,
      availableResults: availableImages.length
    };
  } catch (error) {
    console.error(`Error fetching from Unsplash:`, error.message);
    return null;
  }
}

async function runTest() {
  console.log('🧪 Testing tag-based image search...\n');

  const usedImages = new Set();

  // Test 1: Generic title without tags
  console.log('Test 1: Generic title without tags');
  console.log('Title: "Day for DIY"');
  console.log('Tags: null');
  const result1 = await searchUnsplash('Day for DIY', usedImages, null);

  if (result1) {
    console.log(`✅ Search terms: "${result1.searchTerms}"`);
    console.log(`   Found image by ${result1.photographer}`);
    console.log(`   Total results: ${result1.totalResults}\n`);
  } else {
    console.log('❌ No image found\n');
  }

  console.log('─'.repeat(60) + '\n');

  // Test 2: Same title WITH tags
  console.log('Test 2: Same title WITH relevant tags');
  console.log('Title: "Day for DIY"');
  console.log('Tags: "Arts & Crafts, Educational, San Mateo County Libraries"');
  const result2 = await searchUnsplash('Day for DIY', usedImages, 'Arts & Crafts, Educational, San Mateo County Libraries');

  if (result2) {
    console.log(`✅ Search terms: "${result2.searchTerms}"`);
    console.log(`   Found image by ${result2.photographer}`);
    console.log(`   Total results: ${result2.totalResults}`);
    console.log(`   Different search? ${result1 && result1.searchTerms !== result2.searchTerms ? '✅ YES' : '❌ NO'}\n`);
  } else {
    console.log('❌ No image found\n');
  }

  console.log('─'.repeat(60) + '\n');

  // Test 3: Generic tags only
  console.log('Test 3: Title with only generic tags');
  console.log('Title: "Family Storytime"');
  console.log('Tags: "Kids, Free"');
  const result3 = await searchUnsplash('Family Storytime', usedImages, 'Kids, Free');

  if (result3) {
    console.log(`✅ Search terms: "${result3.searchTerms}"`);
    console.log(`   Falls back to "children": ${result3.searchTerms.includes('children') ? '✅ YES' : '❌ NO'}\n`);
  } else {
    console.log('❌ No image found\n');
  }

  console.log('─'.repeat(60) + '\n');

  // Test 4: Title with good tags
  console.log('Test 4: Title with specific, relevant tags');
  console.log('Title: "Musical Jamboree"');
  console.log('Tags: "Music, Performance, Kids, Free"');
  const result4 = await searchUnsplash('Musical Jamboree', usedImages, 'Music, Performance, Kids, Free');

  if (result4) {
    console.log(`✅ Search terms: "${result4.searchTerms}"`);
    console.log(`   Uses tags: ${result4.searchTerms.includes('Music') || result4.searchTerms.includes('Performance') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Found image by ${result4.photographer}\n`);
  } else {
    console.log('❌ No image found\n');
  }

  console.log('═'.repeat(60));
  console.log('✅ Test complete!');
  console.log('═'.repeat(60));
}

runTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
