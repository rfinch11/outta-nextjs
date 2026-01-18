/**
 * Fix East Bay Regional Park District event times
 *
 * Problem: Events imported from GitHub Actions (UTC timezone) have times stored
 * as if Pacific time was UTC. For example, "9:30 AM Pacific" was stored as
 * "09:30 UTC" instead of "17:30 UTC", causing display as 1:30 AM Pacific.
 *
 * Solution: Only fix events that display before 7 AM Pacific (clearly wrong for
 * kid activities). Add 8 hours to correct the PST offset.
 *
 * Events imported locally (correct) are left unchanged.
 *
 * Usage: node scripts/fix-ebparks-times.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');

// Only fix events that display before this hour in Pacific time
// (no legitimate kid events start before 7 AM)
const EARLY_HOUR_THRESHOLD = 7;

async function fixTimes() {
  console.log('🔧 Fixing East Bay Regional Park District event times...');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  console.log(`   Only fixing events displaying before ${EARLY_HOUR_THRESHOLD} AM Pacific\n`);

  // Get all EBRPD events with start_date
  const { data: events, error } = await supabase
    .from('listings')
    .select('id, title, start_date')
    .eq('organizer', 'East Bay Regional Park District')
    .not('start_date', 'is', null);

  if (error) {
    console.error('❌ Error fetching events:', error.message);
    return;
  }

  console.log(`   Found ${events.length} EBRPD events with start_date\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    const oldDate = new Date(event.start_date);

    // Get the hour in Pacific time
    const pacificHour = parseInt(oldDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false
    }));

    // Skip events that already have reasonable times (7 AM or later)
    if (pacificHour >= EARLY_HOUR_THRESHOLD) {
      skipped++;
      continue;
    }

    // Add 8 hours to correct the timezone offset (PST is UTC-8)
    const newDate = new Date(oldDate.getTime() + (8 * 60 * 60 * 1000));

    const oldPacific = oldDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const newPacific = newDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    console.log(`${event.title.substring(0, 40).padEnd(40)} | ${oldPacific.padStart(8)} → ${newPacific.padStart(8)}`);

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ start_date: newDate.toISOString() })
        .eq('id', event.id);

      if (updateError) {
        console.log(`   ❌ Error updating: ${updateError.message}`);
        errors++;
      } else {
        fixed++;
      }
    } else {
      fixed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${DRY_RUN ? 'Would fix' : 'Fixed'}: ${fixed} events`);
  console.log(`⏭️  Skipped (already correct): ${skipped} events`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`);
  }
  console.log('='.repeat(60));
}

fixTimes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
