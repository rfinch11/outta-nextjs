import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import he from 'he';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const parser = new Parser({
  customFields: {
    item: [
      ['bc:start_date_local', 'startDateLocal'],
      ['bc:location', 'bcLocation', { keepArray: false }],
      ['category', 'category'],
      ['enclosure', 'enclosure'],
    ],
  },
});

// RSS Feed configurations
const RSS_FEEDS = [
  {
    name: 'Palo Alto Library',
    url: 'https://gateway.bibliocommons.com/v2/libraries/paloalto/rss/events',
    organizer: 'Palo Alto Library',
    price: 'Free',
    type: 'Event',
    age_range: 'All',
  },
  {
    name: 'San Mateo County Library',
    url: 'https://gateway.bibliocommons.com/v2/libraries/smcl/rss/events',
    organizer: 'San Mateo County Library',
    price: 'Free',
    type: 'Event',
    age_range: 'All',
  },
  {
    name: 'Santa Clara County Library',
    url: 'https://gateway.bibliocommons.com/v2/libraries/sccl/rss/events?audiences=5b28181c4727c7344c796675,5b2a5dcb2c1d736b168c62ac,5b28181c4727c7344c796679,5b28181c4727c7344c796678,5b28181c4727c7344c796677,5b28181c4727c7344c796676',
    organizer: 'Santa Clara County Library',
    price: 'Free',
    type: 'Event',
    age_range: 'All',
  },
];

/**
 * Clean HTML and decode entities from description text
 */
function cleanDescription(rawDescription?: string): string | null {
  if (!rawDescription) return null;

  // Strip HTML tags and decode HTML entities
  return he.decode(
    rawDescription
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim()
  );
}

/**
 * Maps RSS item fields to Supabase listings table columns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRSSToListing(item: any, feedConfig: any) {
  // Extract BiblioCommons location data (fields come as arrays, take first element)
  const bcLoc = item.bcLocation || {};
  const locationName = Array.isArray(bcLoc['bc:name'])
    ? bcLoc['bc:name'][0]
    : bcLoc['bc:name'] || null;
  const locationNumber = Array.isArray(bcLoc['bc:number'])
    ? bcLoc['bc:number'][0]
    : bcLoc['bc:number'] || '';
  const locationStreet = Array.isArray(bcLoc['bc:street'])
    ? bcLoc['bc:street'][0]
    : bcLoc['bc:street'] || '';
  const locationCity = Array.isArray(bcLoc['bc:city'])
    ? bcLoc['bc:city'][0]
    : bcLoc['bc:city'] || null;
  const locationState = Array.isArray(bcLoc['bc:state'])
    ? bcLoc['bc:state'][0]
    : bcLoc['bc:state'] || null;
  const locationZip = Array.isArray(bcLoc['bc:zip']) ? bcLoc['bc:zip'][0] : bcLoc['bc:zip'] || null;
  const locationLat = Array.isArray(bcLoc['bc:latitude'])
    ? bcLoc['bc:latitude'][0]
    : bcLoc['bc:latitude'] || null;
  const locationLng = Array.isArray(bcLoc['bc:longitude'])
    ? bcLoc['bc:longitude'][0]
    : bcLoc['bc:longitude'] || null;

  // Concatenate street address from number + street
  const street = [locationNumber, locationStreet].filter(Boolean).join(' ').trim() || null;

  // Extract image URL from enclosure
  const imageUrl = item.enclosure?.url || item.enclosure || null;

  // Parse start date - prioritize bc:start_date_local, then fallback to standard fields
  let startDate = null;
  if (item.startDateLocal) {
    // bc:start_date_local format: 2025-12-31T13:30 (Pacific Time)
    // Parse as Pacific Time and convert to ISO with correct timezone
    const dt = DateTime.fromISO(item.startDateLocal, { zone: 'America/Los_Angeles' });
    startDate = dt.toISO(); // Converts to ISO with proper timezone offset
  } else if (item.isoDate) {
    startDate = item.isoDate;
  } else if (item.pubDate) {
    startDate = new Date(item.pubDate).toISOString();
  }

  return {
    // Deduplication fields
    rss_guid: item.guid || item.link || null,
    source_name: feedConfig.name,

    // Core fields from RSS mapping
    title: item.title || null,
    description: cleanDescription(item.content || item.description || item.summary),
    start_date: startDate,
    website: item.link || null,
    image: imageUrl,

    // Location fields from bc:location
    location_name: locationName,
    street: street,
    city: locationCity,
    state: locationState,
    zip: locationZip ? parseInt(locationZip) : null,
    latitude: locationLat ? parseFloat(locationLat) : null,
    longitude: locationLng ? parseFloat(locationLng) : null,

    // Tags from category
    tags: item.category || item.categories?.join(', ') || null,

    // Manual data from feed config
    organizer: feedConfig.organizer,
    price: feedConfig.price,
    type: feedConfig.type,
    age_range: feedConfig.age_range || null,

    // Set airtable_id to null since this is from RSS (not Airtable)
    // We'll use a generated value instead
    airtable_id: `rss-${feedConfig.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
}

/**
 * Fetch and process a single RSS feed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processFeed(feedConfig: any) {
  console.log(`\n📡 Fetching feed: ${feedConfig.name}`);
  console.log(`   URL: ${feedConfig.url}`);

  try {
    // Fetch and parse RSS feed
    const feed = await parser.parseURL(feedConfig.url);
    console.log(`   Found ${feed.items.length} items in feed`);

    let newCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each item
    for (const item of feed.items) {
      try {
        // Check if this item already exists
        const guid = item.guid || item.link;

        if (!guid) {
          console.log(`   ⚠️  Skipping item without GUID: ${item.title}`);
          skippedCount++;
          continue;
        }

        const { data: existing } = await supabase
          .from('listings')
          .select('id')
          .eq('rss_guid', guid)
          .single();

        if (existing) {
          skippedCount++;
          continue; // Already imported
        }

        // Map RSS fields to listing format
        const listing = mapRSSToListing(item, feedConfig);

        // Insert new listing
        const { error } = await supabase.from('listings').insert(listing).select();

        if (error) {
          console.error(`   ❌ Error inserting "${item.title}":`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Imported: ${item.title}`);
          newCount++;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (itemError: any) {
        console.error(`   ❌ Error processing item:`, itemError.message);
        errorCount++;
      }
    }

    return {
      feed: feedConfig.name,
      total: feed.items.length,
      new: newCount,
      skipped: skippedCount,
      errors: errorCount,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`❌ Error fetching feed ${feedConfig.name}:`, error.message);
    return {
      feed: feedConfig.name,
      error: error.message,
    };
  }
}

/**
 * API Route Handler for RSS ingestion cron job
 */
export async function POST(request: NextRequest) {
  // Security: Check for cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('\n🚀 Starting RSS feed ingestion...');
  console.log(`   Processing ${RSS_FEEDS.length} feed(s)`);

  const results = [];

  // Process each feed sequentially
  for (const feedConfig of RSS_FEEDS) {
    const result = await processFeed(feedConfig);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Ingestion Summary:');
  const totals = results.reduce(
    (acc, r) => ({
      new: acc.new + (r.new || 0),
      skipped: acc.skipped + (r.skipped || 0),
      errors: acc.errors + (r.errors || 0),
    }),
    { new: 0, skipped: 0, errors: 0 }
  );

  console.log(`   New: ${totals.new}`);
  console.log(`   Skipped: ${totals.skipped}`);
  console.log(`   Errors: ${totals.errors}`);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    feeds: results,
    totals,
  });
}
