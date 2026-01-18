#!/usr/bin/env node

/**
 * Backfill Eventbrite Prices
 *
 * This script fetches actual price information from Eventbrite event pages
 * and updates the price field in Supabase for existing Eventbrite events.
 *
 * Usage: node scripts/backfill-eventbrite-prices.js
 *
 * Options:
 *   --all     Update all Eventbrite events, even those with non-default prices
 *   --limit N Only process N events (for testing)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Rate limiting: 1 second between requests
const DELAY_MS = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract price from HTML using multiple strategies
 */
function extractPrice(html) {
  // Strategy 1: Check isFree indicator in HTML
  const isFreeMatch = html.match(/"isFree"\s*:\s*(true|false)/i);
  if (isFreeMatch && isFreeMatch[1].toLowerCase() === 'true') {
    return 'Free';
  }

  // Strategy 2: From JSON-LD offers
  const offersMatch = html.match(/"offers"\s*:\s*\[([^\]]+)\]/);
  if (offersMatch) {
    const offersStr = offersMatch[1];

    // Look for lowPrice and highPrice (can be quoted string or unquoted number)
    const lowPriceMatch = offersStr.match(/"lowPrice"\s*:\s*"?(\d+(?:\.\d+)?)(?:"|,|\})/);
    const highPriceMatch = offersStr.match(/"highPrice"\s*:\s*"?(\d+(?:\.\d+)?)(?:"|,|\})/);

    if (lowPriceMatch) {
      const lowPrice = parseFloat(lowPriceMatch[1]);
      const highPrice = highPriceMatch ? parseFloat(highPriceMatch[1]) : lowPrice;

      // Check if free (price is 0)
      if (lowPrice === 0 && highPrice === 0) {
        return 'Free';
      }

      // Format price (round to nearest dollar)
      if (lowPrice === highPrice) {
        return `$${Math.round(lowPrice)}`;
      } else {
        return `$${Math.round(lowPrice)} - $${Math.round(highPrice)}`;
      }
    }
  }

  return null;
}

/**
 * Fetch price from Eventbrite event page
 */
async function fetchPrice(eventUrl) {
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
    return extractPrice(html);
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

  console.log('🔄 Backfilling Eventbrite Prices...');
  console.log(`   Update all: ${updateAll}`);
  console.log(`   Limit: ${limit || 'none'}`);
  console.log('');

  // Fetch Eventbrite events
  let query = supabase
    .from('listings')
    .select('id, title, website, price')
    .like('website', '%eventbrite.com%');

  if (!updateAll) {
    // Only fetch events with default "See website" price
    query = query.eq('price', 'See website');
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
      const price = await fetchPrice(listing.website);

      if (price && price !== 'See website') {
        const { error: updateError } = await supabase
          .from('listings')
          .update({ price })
          .eq('id', listing.id);

        if (updateError) {
          console.log(`❌ DB error: ${updateError.message}`);
          failed++;
        } else {
          console.log(`✅ ${price}`);
          updated++;
        }
      } else {
        console.log(`⚠️  No price found`);
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
