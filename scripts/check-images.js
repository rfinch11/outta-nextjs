require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkImages() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('airtable_id, title, image, type')
    .eq('type', 'Activity')
    .limit(20);

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  console.log('\n=== Image URL Check (First 20 Activities) ===\n');

  const broken = [];
  const working = [];

  for (const listing of listings) {
    const imageUrl = listing.image;

    if (!imageUrl || imageUrl === '' || imageUrl === 'null') {
      broken.push({
        id: listing.airtable_id,
        title: listing.title,
        image: imageUrl,
        reason: 'Empty or null URL'
      });
    } else if (!imageUrl.startsWith('http')) {
      broken.push({
        id: listing.airtable_id,
        title: listing.title,
        image: imageUrl,
        reason: 'Invalid URL (no http/https)'
      });
    } else {
      working.push({
        id: listing.airtable_id,
        title: listing.title,
        image: imageUrl
      });
    }
  }

  console.log(`✅ Working Images: ${working.length}`);
  console.log(`❌ Broken Images: ${broken.length}\n`);

  if (broken.length > 0) {
    console.log('=== Broken Images ===');
    broken.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   URL: ${item.image}`);
      console.log(`   Reason: ${item.reason}\n`);
    });
  }

  if (working.length > 0) {
    console.log('\n=== Sample Working Images ===');
    working.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   URL: ${item.image}\n`);
    });
  }

  // Check for placeholders needed
  const needsPlaceholder = broken.filter(b =>
    !b.image || b.image === '' || b.image === 'null'
  );

  console.log(`\n💡 ${needsPlaceholder.length} listings need placeholder images`);
}

checkImages();
