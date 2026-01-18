/**
 * Hide stale events that have already passed
 *
 * This script:
 * 1. Finds all events with start_date in the past
 * 2. Sets hidden=true for those events
 *
 * Usage:
 *   node scripts/hide-stale-events.js           # Preview only (dry run)
 *   node scripts/hide-stale-events.js --update  # Actually update records
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UPDATE_MODE = process.argv.includes('--update');

async function main() {
  console.log('🙈 Hide stale events\n');

  if (!UPDATE_MODE) {
    console.log('⚠️  DRY RUN MODE - No records will be updated');
    console.log('   Run with --update to actually hide records\n');
  } else {
    console.log('✏️  UPDATE MODE - Records will be marked as hidden\n');
  }

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  console.log(`📅 Finding events that started before ${today.toLocaleDateString()}\n`);

  // Find all events that are past and not already hidden
  // Use pagination to get all records (Supabase default limit is 1000)
  let allStaleEvents = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch, error: batchError } = await supabase
      .from('listings')
      .select('id, airtable_id, title, start_date, type, organizer')
      .lt('start_date', todayISO)
      .or('hidden.is.null,hidden.eq.false')
      .order('start_date', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (batchError) {
      console.error('❌ Error fetching listings:', batchError.message);
      return;
    }

    if (!batch || batch.length === 0) break;
    allStaleEvents = allStaleEvents.concat(batch);
    if (batch.length < pageSize) break;
    page++;
  }

  const staleEvents = allStaleEvents;
  const error = null;

  if (error) {
    console.error('❌ Error fetching listings:', error.message);
    return;
  }

  console.log(`Found ${staleEvents.length} stale events to hide\n`);

  if (staleEvents.length === 0) {
    console.log('✅ No stale events to hide!');
    return;
  }

  // Group by type for summary
  const byType = {};
  staleEvents.forEach(event => {
    const type = event.type || 'Unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  console.log('--- BY TYPE ---');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

  // Group by source
  const bySource = {};
  staleEvents.forEach(event => {
    let source = 'Unknown';
    if (event.airtable_id?.startsWith('rec')) {
      source = 'Legacy Airtable';
    } else if (event.airtable_id?.startsWith('ebparks')) {
      source = 'East Bay Parks';
    } else if (event.airtable_id?.startsWith('eventbrite')) {
      source = 'Eventbrite';
    } else if (event.airtable_id?.startsWith('badm')) {
      source = 'Bay Area Discovery Museum';
    } else if (event.airtable_id?.startsWith('santacruz')) {
      source = 'Santa Cruz Library';
    } else if (event.organizer) {
      source = event.organizer.substring(0, 30);
    }
    bySource[source] = (bySource[source] || 0) + 1;
  });

  console.log('\n--- BY SOURCE ---');
  Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });

  console.log('\n--- MOST RECENT STALE EVENTS (first 10) ---');
  staleEvents.slice(0, 10).forEach(event => {
    const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No date';
    console.log(`[${startDate}] ${event.title}`);
  });

  if (UPDATE_MODE) {
    console.log('\n' + '─'.repeat(60));
    console.log('\n✏️  Updating records...\n');

    // Update in batches of 500
    const batchSize = 500;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < staleEvents.length; i += batchSize) {
      const batch = staleEvents.slice(i, i + batchSize);
      const ids = batch.map(e => e.id);

      const { error: updateError } = await supabase
        .from('listings')
        .update({ hidden: true })
        .in('id', ids);

      if (updateError) {
        console.error(`❌ Error updating batch ${Math.floor(i / batchSize) + 1}: ${updateError.message}`);
        errorCount += batch.length;
      } else {
        updatedCount += batch.length;
        console.log(`✅ Hidden batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Hidden: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
  } else {
    console.log('\n' + '─'.repeat(60));
    console.log(`\n📊 Would hide ${staleEvents.length} records`);
    console.log('\nRun with --update to actually hide these records.');
  }
}

main().catch(console.error);
