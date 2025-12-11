/**
 * Test script to verify unique image selection logic
 *
 * This script tests that the searchUnsplash function properly
 * filters out already-used images and selects unique ones.
 */

require('dotenv').config({ path: '.env.local' });

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_KEY) {
  console.error('❌ Missing UNSPLASH_ACCESS_KEY in .env.local');
  process.exit(1);
}

// Copy the searchUnsplash function from backfill-images.js
async function searchUnsplash(title, usedImages) {
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
      totalResults: data.results.length,
      availableResults: availableImages.length
    };
  } catch (error) {
    console.error(`Error fetching from Unsplash:`, error.message);
    return null;
  }
}

async function runTest() {
  console.log('🧪 Testing unique image selection...\n');

  const usedImages = new Set();
  const testTitle = 'Library Storytime';

  // Test 1: First search should return a unique image
  console.log('Test 1: First search (no used images)');
  const result1 = await searchUnsplash(testTitle, usedImages);

  if (result1) {
    console.log(`✅ Found image: ${result1.baseUrl.substring(0, 60)}...`);
    console.log(`   Photographer: ${result1.photographer}`);
    console.log(`   Total results: ${result1.totalResults}`);
    console.log(`   Available results: ${result1.availableResults}`);
    console.log(`   Was unique: ${result1.wasUnique}`);

    // Add to used set
    usedImages.add(result1.baseUrl);
  } else {
    console.log('❌ No image found');
    return;
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 2: Second search should return a different image
  console.log('Test 2: Second search (1 image marked as used)');
  const result2 = await searchUnsplash(testTitle, usedImages);

  if (result2) {
    console.log(`✅ Found image: ${result2.baseUrl.substring(0, 60)}...`);
    console.log(`   Photographer: ${result2.photographer}`);
    console.log(`   Available results: ${result2.availableResults}`);
    console.log(`   Was unique: ${result2.wasUnique}`);

    // Verify it's different
    if (result2.baseUrl === result1.baseUrl) {
      console.log('❌ ERROR: Got the same image as Test 1!');
    } else {
      console.log('✅ Image is different from Test 1');
    }

    usedImages.add(result2.baseUrl);
  } else {
    console.log('❌ No image found');
    return;
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 3: Third search
  console.log('Test 3: Third search (2 images marked as used)');
  const result3 = await searchUnsplash(testTitle, usedImages);

  if (result3) {
    console.log(`✅ Found image: ${result3.baseUrl.substring(0, 60)}...`);
    console.log(`   Available results: ${result3.availableResults}`);
    console.log(`   Was unique: ${result3.wasUnique}`);

    // Verify it's different from both previous
    if (usedImages.has(result3.baseUrl)) {
      console.log('⚠️  WARNING: This image was already used (expected if all available images are exhausted)');
    } else {
      console.log('✅ Image is unique');
    }
  } else {
    console.log('❌ No image found');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test complete!');
  console.log('═'.repeat(60));
}

runTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
