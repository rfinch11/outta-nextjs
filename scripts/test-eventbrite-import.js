/**
 * TEST: Eventbrite Import (Limited to 5 events)
 *
 * This is a test version that only imports 5 events
 * to verify the Airtable integration works correctly.
 *
 * Usage: node scripts/test-eventbrite-import.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TEST_LIMIT = 5; // Only import 5 events for testing

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing Airtable credentials in .env.local');
  process.exit(1);
}

const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchEventbriteEvents() {
  console.log('🔍 Fetching San Francisco kid events (test)...\n');

  const searchUrl = 'https://www.eventbrite.com/d/ca--san-francisco/kids--events/';

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  const html = await response.text();
  const match = html.match(/__SERVER_DATA__ = ({.*?});/s);

  if (!match) {
    throw new Error('Could not extract event data');
  }

  const serverData = JSON.parse(match[1]);
  const events = serverData.search_data?.events?.results || [];

  console.log(`✅ Found ${events.length} events, using first ${TEST_LIMIT} for test\n`);

  return events.slice(0, TEST_LIMIT);
}

function mapEventToAirtable(event) {
  const venue = event.primary_venue || {};
  const address = venue.address || {};

  const allText = (event.name + ' ' + (event.summary || '')).toLowerCase();

  // Extract age range
  let ageRange = null;
  if (allText.includes('toddler')) ageRange = '1-3';
  else if (allText.includes('preschool')) ageRange = '3-5';
  else if (allText.includes('teen')) ageRange = '13-18';

  // Extract tags
  const tags = ['Eventbrite'];
  if (allText.match(/craft|art|paint/)) tags.push('Arts & Crafts');
  if (allText.match(/music/)) tags.push('Music');
  if (allText.match(/free/i)) tags.push('Free');

  // Price
  let price = 'See website';
  if (allText.includes('free')) price = 'Free';

  // Format datetime with Pacific timezone
  let startDate = null;
  if (event.start_date && event.start_time) {
    // Create date in Pacific timezone (UTC-8 for PST, UTC-7 for PDT)
    // Use the date and time to determine DST offset
    const dateStr = `${event.start_date}T${event.start_time}:00`;
    const date = new Date(dateStr + '-08:00'); // Assume PST

    // Check if DST (rough approximation: March-November)
    const month = parseInt(event.start_date.split('-')[1]);
    const isDST = month >= 3 && month <= 10;
    const offset = isDST ? '-07:00' : '-08:00';

    startDate = `${dateStr}${offset}`;
  }

  return {
    title: event.name,
    type: 'Event',
    description: event.summary || null,
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
    tags: tags.join(', '),
    place_type: 'Other',
  };
}

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
    console.error(`Error checking existence:`, error.message);
    return null;
  }
}

async function createOrUpdateEvent(eventData) {
  try {
    const existing = await eventExists(eventData.website);

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

    Object.keys(fields).forEach(key => {
      if (fields[key] === null || fields[key] === undefined) {
        delete fields[key];
      }
    });

    if (existing) {
      await airtable('Listings').update(existing.id, fields);
      return { action: 'updated', id: existing.id };
    } else {
      const record = await airtable('Listings').create(fields);
      return { action: 'created', id: record.id };
    }
  } catch (error) {
    console.error(`Error:`, error.message);
    return { action: 'error', error: error.message };
  }
}

async function testImport() {
  console.log('🧪 Starting Eventbrite TEST import...\n');
  console.log(`⚠️  This will import ${TEST_LIMIT} events to test the integration\n`);

  const events = await fetchEventbriteEvents();

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`[${i + 1}/${events.length}] ${event.name}`);
    console.log(`   📅 ${event.start_date} at ${event.start_time}`);
    console.log(`   📍 ${event.primary_venue?.name || 'TBD'}`);

    const eventData = mapEventToAirtable(event);
    const result = await createOrUpdateEvent(eventData);

    if (result.action === 'created') {
      console.log(`   ✅ Created new record (ID: ${result.id})`);
      created++;
    } else if (result.action === 'updated') {
      console.log(`   ♻️  Updated existing record (ID: ${result.id})`);
      updated++;
    } else {
      console.log(`   ❌ Error: ${result.error}`);
      errors++;
    }

    console.log('');
    await delay(1000);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${created}`);
  console.log(`♻️  Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50));

  if (errors === 0) {
    console.log('\n✅ Test successful! You can now run the full import with:');
    console.log('   node scripts/import-eventbrite-events.js');
  } else {
    console.log('\n⚠️  There were errors. Please check the output above.');
  }
}

testImport().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
