/**
 * Cleanup script to delete past events with no location data
 *
 * This script:
 * 1. Finds listings with missing lat/lng (no geocodable address)
 * 2. Filters to only past events (already ended)
 * 3. Deletes them from Supabase
 *
 * Usage:
 *   node scripts/cleanup-stale-events.js           # Preview only (dry run)
 *   node scripts/cleanup-stale-events.js --delete  # Actually delete records
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DELETE_MODE = process.argv.includes('--delete');

async function main() {
  console.log('🧹 Cleanup: Past events with no location data\n');

  if (!DELETE_MODE) {
    console.log('⚠️  DRY RUN MODE - No records will be deleted');
    console.log('   Run with --delete to actually remove records\n');
  } else {
    console.log('🗑️  DELETE MODE - Records will be permanently removed\n');
  }

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  console.log(`📅 Finding events that started before ${today.toLocaleDateString()}\n`);

  // Find all listings with no lat/lng that are past events
  const { data: staleListings, error } = await supabase
    .from('listings')
    .select('id, airtable_id, title, start_date, city, location_name, organizer')
    .or('latitude.is.null,longitude.is.null')
    .lt('start_date', todayISO)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching listings:', error.message);
    return;
  }

  console.log(`Found ${staleListings.length} stale events with no location data\n`);

  if (staleListings.length === 0) {
    console.log('✅ No stale events to clean up!');
    return;
  }

  // Group by source for summary
  const bySource = {};
  staleListings.forEach(listing => {
    let source = 'Unknown';
    if (listing.airtable_id?.startsWith('rec')) {
      source = 'Legacy Airtable';
    } else if (listing.airtable_id?.startsWith('ebparks')) {
      source = 'East Bay Parks';
    } else if (listing.airtable_id?.startsWith('eventbrite')) {
      source = 'Eventbrite';
    } else if (listing.organizer) {
      source = listing.organizer.substring(0, 30);
    }
    bySource[source] = (bySource[source] || 0) + 1;
  });

  console.log('--- BY SOURCE ---');
  Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });

  console.log('\n--- SAMPLE RECORDS (first 10) ---');
  staleListings.slice(0, 10).forEach(listing => {
    const startDate = listing.start_date ? new Date(listing.start_date).toLocaleDateString() : 'No date';
    console.log(`[${startDate}] ${listing.title}`);
    console.log(`   ID: ${listing.airtable_id || listing.id}`);
    console.log(`   Location: ${listing.location_name || 'null'} | ${listing.city || 'null'}`);
  });

  if (DELETE_MODE) {
    console.log('\n─'.repeat(60));
    console.log('\n🗑️  Deleting records...\n');

    // Delete in batches of 100
    const batchSize = 100;
    let deletedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < staleListings.length; i += batchSize) {
      const batch = staleListings.slice(i, i + batchSize);
      const ids = batch.map(l => l.id);

      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}: ${deleteError.message}`);
        errorCount += batch.length;
      } else {
        deletedCount += batch.length;
        console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    }

    console.log('\n─'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Deleted: ${deletedCount}`);
    console.log(`   Errors: ${errorCount}`);
  } else {
    console.log('\n─'.repeat(60));
    console.log(`\n📊 Would delete ${staleListings.length} records`);
    console.log('\nRun with --delete to actually remove these records.');
  }
}

main().catch(console.error);
