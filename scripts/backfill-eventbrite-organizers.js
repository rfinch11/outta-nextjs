#!/usr/bin/env node

/**
 * Backfill Eventbrite Organizers
 *
 * This script fetches the actual organizer name from Eventbrite event pages
 * and updates the organizer field in Supabase for existing Eventbrite events.
 *
 * Usage: node scripts/backfill-eventbrite-organizers.js
 *
 * Options:
 *   --all     Update all Eventbrite events, even those with non-default organizers
 *   --limit N Only process N events (for testing)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Rate limiting: 1 second between requests to be polite
const DELAY_MS = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract organizer name from HTML using multiple strategies
 */
function extractOrganizer(html) {
  // Strategy 1: From __SERVER_DATA__ organizer object
  const serverDataMatch = html.match(/__SERVER_DATA__ = ({.*?});/s);
  if (serverDataMatch) {
    try {
      const serverData = JSON.parse(serverDataMatch[1]);
      if (serverData?.organizer?.name) {
        return serverData.organizer.name;
      }
      if (serverData?.organizer?.displayOrganizationName) {
        return serverData.organizer.displayOrganizationName;
      }
    } catch (e) {
      // JSON parse failed, continue to next strategy
    }
  }

  // Strategy 2: From JSON in the page (handles __NEXT_DATA__ and other formats)
  const orgJsonMatch = html.match(/"organizer"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
  if (orgJsonMatch && orgJsonMatch[1]) {
    return orgJsonMatch[1];
  }

  // Strategy 3: From JSON-LD structured data
  const jsonLdMatch = html.match(/"organizer"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"([^"]+)"/);
  if (jsonLdMatch && jsonLdMatch[1]) {
    return jsonLdMatch[1];
  }

  return null;
}

/**
 * Fetch organizer from Eventbrite event page
 */
async function fetchOrganizer(eventUrl) {
  try {
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractOrganizer(html);
  } catch (error) {
    console.error(`    ⚠️  Error fetching:`, error.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const updateAll = args.includes('--all');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  console.log('🔄 Backfilling Eventbrite Organizers...');
  console.log(`   Update all: ${updateAll}`);
  console.log(`   Limit: ${limit || 'none'}`);
  console.log('');

  // Fetch Eventbrite events
  let query = supabase
    .from('listings')
    .select('id, title, website, organizer')
    .like('website', '%eventbrite.com%');

  if (!updateAll) {
    // Only fetch events with default "Eventbrite" organizer
    query = query.eq('organizer', 'Eventbrite');
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('❌ Error fetching listings:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${listings.length} Eventbrite events to process`);
  console.log('');

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const listing of listings) {
    processed++;

    if (!listing.website) {
      skipped++;
      continue;
    }

    const truncatedTitle = listing.title.slice(0, 45).padEnd(45);
    process.stdout.write(`[${processed}/${listings.length}] ${truncatedTitle} `);

    try {
      const organizer = await fetchOrganizer(listing.website);

      if (organizer && organizer !== 'Eventbrite') {
        const { error: updateError } = await supabase
          .from('listings')
          .update({ organizer })
          .eq('id', listing.id);

        if (updateError) {
          console.log(`❌ DB error: ${updateError.message}`);
          failed++;
        } else {
          console.log(`✅ ${organizer}`);
          updated++;
        }
      } else if (organizer === 'Eventbrite') {
        console.log(`⏭️  Already "Eventbrite"`);
        skipped++;
      } else {
        console.log(`⚠️  No organizer found`);
        skipped++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
