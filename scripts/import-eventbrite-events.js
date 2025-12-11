/**
 * Eventbrite Bay Area Event Import Script
 *
 * This script:
 * 1. Searches Eventbrite for kid-friendly events across the SF Bay Area
 * 2. Extracts event data from embedded JSON
 * 3. Creates/updates Airtable records with complete information
 *
 * Usage: node scripts/import-eventbrite-events.js
 *
 * Required environment variables:
 * - AIRTABLE_ACCESS_TOKEN
 * - AIRTABLE_BASE_ID
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');
const cheerio = require('cheerio');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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
if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing Airtable credentials in .env.local');
  process.exit(1);
}

// Initialize Airtable
const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

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
 * Scrape individual event page for full description
 */
async function scrapeEventDescription(eventUrl) {
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

    // Extract __SERVER_DATA__ JSON which has the complete description
    const match = html.match(/__SERVER_DATA__ = ({.*?});/s);

    if (!match) {
      return null;
    }

    const serverData = JSON.parse(match[1]);
    const modules = serverData.components?.eventDescription?.structuredContent?.modules || [];

    // Combine all text modules
    let fullHtml = '';
    modules.forEach(module => {
      if (module.type === 'text' && module.text) {
        fullHtml += module.text + '\n\n';
      }
    });

    if (!fullHtml) {
      // Fallback to summary if no structured content
      return serverData.components?.eventDescription?.summary || null;
    }

    // Convert HTML to formatted text
    let description = fullHtml
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

    if (description) {
      // Clean up whitespace
      description = description
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n /g, '\n')
        .trim();

      // Remove hashtags
      description = description.replace(/#\w+/g, '').trim();

      return description;
    }

    return null;
  } catch (error) {
    console.error(`    ⚠️  Error scraping description:`, error.message);
    return null;
  }
}

/**
 * Map Eventbrite event to Airtable fields
 */
function mapEventToAirtable(event, fullDescription = null) {
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

  // Price info
  let price = 'See website';
  if (event.name.toLowerCase().includes('free') || (event.summary || '').toLowerCase().includes('free')) {
    price = 'Free';
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
    organizer: 'Eventbrite',
    website: event.url,
    image: event.image?.url || null,
    price: price,
    age_range: ageRange,
    tags: tags.length > 0 ? tags.join(', ') : 'Kids',
    place_type: placeType,
  };
}

/**
 * Check if event already exists in Airtable by website URL
 */
async function eventExists(websiteUrl) {
  try {
    const records = await airtable('Listings')
      .select({
        filterByFormula: `{Website} = '${websiteUrl.replace(/'/g, "\\'")}'`,
        maxRecords: 1,
      })
      .firstPage();

    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error(`Error checking if event exists:`, error.message);
    return null;
  }
}

/**
 * Create or update Airtable record
 */
async function createOrUpdateEvent(eventData) {
  try {
    const existing = await eventExists(eventData.website);

    // Map field names to match Airtable columns exactly
    const fields = {
      'Title': eventData.title,
      'Type': eventData.type,
      'Description': eventData.description,
      'Start Date': eventData.start_date,
      'Location name': eventData.location_name,
      'City': eventData.city,
      'State': eventData.state,
      'Street': eventData.street,
      'ZIP': eventData.zip,
      'Organizer': eventData.organizer,
      'Website': eventData.website,
      'Image': eventData.image,
      'Price': eventData.price,
      'Age range': eventData.age_range,
      'Tags': eventData.tags,
      'Place type': eventData.place_type,
    };

    // Remove null/undefined values
    Object.keys(fields).forEach(key => {
      if (fields[key] === null || fields[key] === undefined) {
        delete fields[key];
      }
    });

    if (existing) {
      // Update existing record
      await airtable('Listings').update(existing.id, fields);
      return { action: 'updated', id: existing.id };
    } else {
      // Create new record
      const record = await airtable('Listings').create(fields);
      return { action: 'created', id: record.id };
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

    // Scrape full description from event page
    console.log(`  🔍 Fetching full description...`);
    const fullDescription = await scrapeEventDescription(event.url);

    // Map to Airtable format
    const eventData = mapEventToAirtable(event, fullDescription);

    // Create or update in Airtable
    const result = await createOrUpdateEvent(eventData);

    if (result.action === 'created') {
      console.log(`  ✅ Created new record`);
      created++;
    } else if (result.action === 'updated') {
      console.log(`  ♻️  Updated existing record`);
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
