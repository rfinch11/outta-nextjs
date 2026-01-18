/**
 * Eventbrite Bay Area Event Import Script
 *
 * This script:
 * 1. Searches Eventbrite for kid-friendly events across the SF Bay Area
 * 2. Extracts event data from embedded JSON
 * 3. Creates/updates Supabase records with complete information
 *
 * Usage: node scripts/import-eventbrite-events.js
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 */

// Load environment variables from .env.local if running locally
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Bay Area cities to search
const BAY_AREA_CITIES = [
  'san-francisco',
  'oakland',
  'san-jose',
  'berkeley',
  'palo-alto',
  'mountain-view',
  'sunnyvale',
  'santa-clara',
  'fremont',
  'hayward',
  'san-mateo',
  'redwood-city',
  'cupertino',
  'santa-cruz',
  'sausalito',
  'mill-valley'
];

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  console.error('In GitHub Actions: Configure these as repository secrets');
  console.error('Locally: Set them in .env.local file');
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch events from Eventbrite for a specific city
 */
async function fetchEventbriteEvents(city, maxPages = 5) {
  console.log(`\n🔍 Searching ${city} for kid events...`);

  const allEvents = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const searchUrl = `https://www.eventbrite.com/d/ca--${city}/kids--events/?page=${page}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.log(`  ⚠️  Page ${page}: Failed to fetch (${response.status})`);
        break;
      }

      const html = await response.text();
      const match = html.match(/__SERVER_DATA__ = ({.*?});/s);

      if (!match) {
        console.log(`  ⚠️  Page ${page}: No data found`);
        break;
      }

      const serverData = JSON.parse(match[1]);
      const events = serverData.search_data?.events?.results || [];
      const pagination = serverData.search_data?.events?.pagination || {};

      if (events.length === 0) {
        console.log(`  ✓ No more events on page ${page}`);
        break;
      }

      console.log(`  ✓ Page ${page}: Found ${events.length} events`);
      allEvents.push(...events);

      // Check if we've reached the last page
      if (page >= pagination.page_count) {
        console.log(`  ✓ Reached last page (${pagination.page_count})`);
        break;
      }

      // Rate limiting - 2 second delay between pages
      await delay(2000);

    } catch (error) {
      console.error(`  ❌ Error on page ${page}:`, error.message);
      break;
    }
  }

  console.log(`  📊 Total events from ${city}: ${allEvents.length}`);
  return allEvents;
}

/**
 * Extract organizer name from HTML using multiple strategies
 */
function extractOrganizer(html, serverData = null) {
  // Strategy 1: From __SERVER_DATA__ organizer object
  if (serverData?.organizer?.name) {
    return serverData.organizer.name;
  }
  if (serverData?.organizer?.displayOrganizationName) {
    return serverData.organizer.displayOrganizationName;
  }

  // Strategy 2: From JSON in the page (handles __NEXT_DATA__ and other formats)
  // Look for "organizer":{"...","name":"OrgName"} pattern
  const orgJsonMatch = html.match(/"organizer"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
  if (orgJsonMatch && orgJsonMatch[1]) {
    return orgJsonMatch[1];
  }

  // Strategy 3: From JSON-LD structured data
  // Look for "organizer":{"@type":"Organization","name":"OrgName"} pattern
  const jsonLdMatch = html.match(/"organizer"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"([^"]+)"/);
  if (jsonLdMatch && jsonLdMatch[1]) {
    return jsonLdMatch[1];
  }

  return null;
}

/**
 * Extract price from HTML using multiple strategies
 */
function extractPrice(html, serverData = null) {
  // Strategy 1: Check isFree indicator in HTML
  const isFreeMatch = html.match(/"isFree"\s*:\s*(true|false)/i);
  if (isFreeMatch && isFreeMatch[1].toLowerCase() === 'true') {
    return 'Free';
  }

  // Strategy 2: Check is_free in serverData
  if (serverData?.is_free === true) {
    return 'Free';
  }

  // Strategy 3: From JSON-LD offers
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

  // Fallback
  return null;
}

/**
 * Extract description from HTML using multiple strategies
 */
function extractDescription(html, serverData = null) {
  // Strategy 1: From __SERVER_DATA__ structured content
  if (serverData) {
    const modules = serverData.components?.eventDescription?.structuredContent?.modules || [];
    let fullHtml = '';
    modules.forEach(module => {
      if (module.type === 'text' && module.text) {
        fullHtml += module.text + '\n\n';
      }
    });

    if (fullHtml) {
      return cleanHtmlToText(fullHtml);
    }

    // Fallback to summary
    if (serverData.components?.eventDescription?.summary) {
      return serverData.components.eventDescription.summary;
    }
  }

  // Strategy 2: From meta description tag
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaMatch && metaMatch[1]) {
    // Decode HTML entities
    return metaMatch[1]
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  return null;
}

/**
 * Convert HTML to formatted text
 */
function cleanHtmlToText(html) {
  let text = html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, '');  // Remove all remaining tags

  // Clean up whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .trim();

  // Remove hashtags
  text = text.replace(/#\w+/g, '').trim();

  return text || null;
}

/**
 * Scrape individual event page for full description, organizer, and price
 * @returns {Promise<{description: string|null, organizer: string|null, price: string|null}>}
 */
async function scrapeEventDetails(eventUrl) {
  try {
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return { description: null, organizer: null, price: null };
    }

    const html = await response.text();

    // Try to extract __SERVER_DATA__ JSON (older Eventbrite pages)
    let serverData = null;
    const serverDataMatch = html.match(/__SERVER_DATA__ = ({.*?});/s);
    if (serverDataMatch) {
      try {
        serverData = JSON.parse(serverDataMatch[1]);
      } catch (e) {
        // JSON parse failed, continue without serverData
      }
    }

    // Extract organizer, description, and price using multiple strategies
    const organizer = extractOrganizer(html, serverData);
    const description = extractDescription(html, serverData);
    const price = extractPrice(html, serverData);

    return { description, organizer, price };
  } catch (error) {
    console.error(`    ⚠️  Error scraping event details:`, error.message);
    return { description: null, organizer: null, price: null };
  }
}

/**
 * Map Eventbrite event to Supabase fields
 */
function mapEventToSupabase(event, fullDescription = null, organizerName = null, scrapedPrice = null) {
  const venue = event.primary_venue || {};
  const address = venue.address || {};

  // Extract age range from tags or description
  let ageRange = null;
  const allText = (event.name + ' ' + (event.summary || '')).toLowerCase();
  const ageMatch = allText.match(/ages?\s*(\d+)-(\d+)|(\d+)\+\s*years?|under\s*(\d+)|toddler|preschool|teen/i);
  if (ageMatch) {
    if (allText.includes('toddler')) ageRange = '1-3';
    else if (allText.includes('preschool')) ageRange = '3-5';
    else if (allText.includes('teen')) ageRange = '13-18';
    else ageRange = ageMatch[0];
  }

  // Extract tags
  const tags = [];

  // Add Eventbrite categories
  event.tags?.forEach(tag => {
    if (tag.prefix === 'EventbriteCategory' || tag.prefix === 'EventbriteSubCategory') {
      tags.push(tag.display_name);
    }
  });

  // Infer additional tags from title/description
  if (allText.match(/craft|art|paint|draw|create/)) tags.push('Arts & Crafts');
  if (allText.match(/music|concert|sing/)) tags.push('Music');
  if (allText.match(/workshop|class|learn/)) tags.push('Educational');
  if (allText.match(/outdoor|park|nature|hike/)) tags.push('Outdoor');
  if (allText.match(/storytime|story time|reading/)) tags.push('Storytime');
  if (allText.match(/holiday|christmas|halloween|easter/)) tags.push('Holiday');
  if (allText.match(/free/i)) tags.push('Free');

  // Always add "Eventbrite" source tag
  if (!tags.includes('Eventbrite')) {
    tags.push('Eventbrite');
  }

  // Determine place type
  let placeType = 'Other';
  const venueName = (venue.name || '').toLowerCase();
  if (venueName.includes('library')) placeType = 'Library';
  else if (venueName.includes('museum')) placeType = 'Museum';
  else if (venueName.includes('park')) placeType = 'Park';
  else if (venueName.includes('theater') || venueName.includes('theatre')) placeType = 'Theater';
  else if (venueName.includes('studio') || venueName.includes('maker')) placeType = 'Studio';
  else if (event.is_online_event) placeType = 'Online';

  // Price info - use scraped price first, then infer from title/description, fallback to "See website"
  let price = scrapedPrice;
  if (!price) {
    if (event.name.toLowerCase().includes('free') || (event.summary || '').toLowerCase().includes('free')) {
      price = 'Free';
    } else {
      price = 'See website';
    }
  }

  // Format datetime with Pacific timezone
  let startDate = null;
  if (event.start_date && event.start_time) {
    // Create date in Pacific timezone (UTC-8 for PST, UTC-7 for PDT)
    const dateStr = `${event.start_date}T${event.start_time}:00`;

    // Check if DST (rough approximation: March-November)
    const month = parseInt(event.start_date.split('-')[1]);
    const isDST = month >= 3 && month <= 10;
    const offset = isDST ? '-07:00' : '-08:00';

    startDate = `${dateStr}${offset}`;
  }

  return {
    title: event.name,
    type: 'Event',
    description: fullDescription || event.summary || null,
    start_date: startDate,
    location_name: venue.name || null,
    city: address.city || null,
    state: address.region || 'CA',
    street: address.address_1 || null,
    zip: address.postal_code ? parseInt(address.postal_code) : null,
    organizer: organizerName || 'Eventbrite',
    website: event.url,
    image: event.image?.url || null,
    price: price,
    age_range: ageRange,
    tags: tags.length > 0 ? tags.join(', ') : 'Kids',
    place_type: placeType,
  };
}

/**
 * Check if event already exists in Supabase by website URL
 */
async function eventExists(websiteUrl) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id')
      .eq('website', websiteUrl)
      .maybeSingle();

    if (error) {
      console.error(`Error checking if event exists:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error checking if event exists:`, error.message);
    return null;
  }
}

/**
 * Create or update Supabase record
 */
async function createOrUpdateEvent(eventData) {
  try {
    const existing = await eventExists(eventData.website);

    // Remove null/undefined values
    const cleanData = {};
    Object.keys(eventData).forEach(key => {
      if (eventData[key] !== null && eventData[key] !== undefined) {
        cleanData[key] = eventData[key];
      }
    });

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('listings')
        .update({
          ...cleanData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`Error updating event:`, error.message);
        return { action: 'error', error: error.message };
      }

      return { action: 'updated', id: existing.id };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('listings')
        .insert(cleanData)
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating event:`, error.message);
        return { action: 'error', error: error.message };
      }

      return { action: 'created', id: data.id };
    }
  } catch (error) {
    console.error(`Error creating/updating event:`, error.message);
    return { action: 'error', error: error.message };
  }
}

/**
 * Main import function
 */
async function importEvents() {
  console.log('🚀 Starting Eventbrite Bay Area event import...\n');
  console.log(`📍 Searching ${BAY_AREA_CITIES.length} Bay Area cities`);

  const allEvents = [];

  // Fetch events from all cities
  for (const city of BAY_AREA_CITIES) {
    const events = await fetchEventbriteEvents(city, 3); // 3 pages per city
    allEvents.push(...events);

    // Rate limiting between cities
    await delay(3000);
  }

  console.log(`\n📊 Total events collected: ${allEvents.length}`);

  // Deduplicate by URL
  const uniqueEvents = [];
  const seenUrls = new Set();

  allEvents.forEach(event => {
    if (!seenUrls.has(event.url)) {
      seenUrls.add(event.url);
      uniqueEvents.push(event);
    }
  });

  console.log(`📊 Unique events after deduplication: ${uniqueEvents.length}\n`);

  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Process each event
  for (let i = 0; i < uniqueEvents.length; i++) {
    const event = uniqueEvents[i];
    const progress = `[${i + 1}/${uniqueEvents.length}]`;

    console.log(`${progress} ${event.name}`);

    // Skip past events
    if (event.start_date) {
      const eventDate = new Date(event.start_date);
      if (eventDate < new Date()) {
        console.log(`  ⏭️  Skipped (past event)\n`);
        skipped++;
        continue;
      }
    }

    // Skip if missing critical data
    if (!event.name || !event.url) {
      console.log(`  ⏭️  Skipped (missing critical data)\n`);
      skipped++;
      continue;
    }

    // Scrape full description, organizer, and price from event page
    console.log(`  🔍 Fetching event details...`);
    const { description, organizer, price } = await scrapeEventDetails(event.url);

    // Map to Supabase format
    const eventData = mapEventToSupabase(event, description, organizer, price);

    // Create or update in Supabase
    const result = await createOrUpdateEvent(eventData);

    if (result.action === 'created') {
      console.log(`  ✅ Created (${eventData.price}) by ${organizer || 'Eventbrite'}`);
      created++;
    } else if (result.action === 'updated') {
      console.log(`  ♻️  Updated (${eventData.price}) by ${organizer || 'Eventbrite'}`);
      updated++;
    } else {
      console.log(`  ❌ Error: ${result.error}`);
      errors++;
    }

    console.log('');

    // Rate limiting - 1 second between Airtable operations
    await delay(1000);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${created}`);
  console.log(`♻️  Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total processed: ${uniqueEvents.length}`);
  console.log('='.repeat(50));
}

// Run the import
importEvents().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
