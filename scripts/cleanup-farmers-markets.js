/**
 * Cleanup farmers market listings - remove junk and out-of-area entries
 *
 * Usage:
 *   node scripts/cleanup-farmers-markets.js           # Preview only
 *   node scripts/cleanup-farmers-markets.js --delete  # Actually delete
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DELETE_MODE = process.argv.includes('--delete');

// Junk title patterns (descriptions that got parsed as titles)
const junkPatterns = [
  /^since \d+/i,
  /^a rare blend/i,
  /^and media/i,
  /^Civic Center BART/i,
  /^to promoting/i,
  /^Baked potatos/i,
  /^Timeout LA/i,
];

// Out of area cities/locations
const outOfAreaPatterns = [
  'Los Angeles',
  'Visalia',
  'San Dimas',
  'Rancho Santa Fe',
  'Pontiac',
  'Northridge',
  'Little Tokyo',
  'Mission Valley',
  'West New York',
];

async function main() {
  console.log('🧹 Cleanup Farmers Market Listings\n');

  if (!DELETE_MODE) {
    console.log('⚠️  DRY RUN MODE - No records will be deleted');
    console.log('   Run with --delete to actually remove records\n');
  } else {
    console.log('🗑️  DELETE MODE - Records will be permanently removed\n');
  }

  // Get all farmers market listings
  const { data, error } = await supabase
    .from('listings')
    .select('airtable_id, title, city, state')
    .like('airtable_id', 'farmersmarket_%')
    .order('city');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${data.length} farmers market listings\n`);

  const toDelete = [];

  data.forEach(listing => {
    // Check for junk titles
    const isJunk = junkPatterns.some(p => p.test(listing.title));

    // Check for out of area
    const isOutOfArea = outOfAreaPatterns.some(pattern =>
      (listing.city && listing.city.includes(pattern)) ||
      (listing.title && listing.title.includes(pattern))
    );

    // Check for non-California state
    const isNotCA = listing.state &&
      listing.state !== 'CA' &&
      listing.state !== 'California' &&
      listing.state !== null;

    if (isJunk || isOutOfArea || isNotCA) {
      toDelete.push({
        ...listing,
        reason: isJunk ? 'Junk title' : (isOutOfArea ? 'Out of area' : `Non-CA state: ${listing.state}`)
      });
    }
  });

  console.log('--- LISTINGS TO DELETE ---');
  toDelete.forEach(l => {
    console.log(`[${l.reason}] ${l.title}`);
    console.log(`   ID: ${l.airtable_id}`);
    console.log(`   Location: ${l.city || 'Unknown'}, ${l.state || 'Unknown'}`);
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log(`\nTotal to delete: ${toDelete.length}`);
  console.log(`Will remain: ${data.length - toDelete.length}`);

  if (DELETE_MODE && toDelete.length > 0) {
    console.log('\n🗑️  Deleting records...\n');

    const ids = toDelete.map(l => l.airtable_id);

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .in('airtable_id', ids);

    if (deleteError) {
      console.error('❌ Error deleting:', deleteError.message);
    } else {
      console.log(`✅ Deleted ${toDelete.length} records`);
    }
  } else if (!DELETE_MODE) {
    console.log('\nRun with --delete to actually remove these records.');
  }
}

main().catch(console.error);
