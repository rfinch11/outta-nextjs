/**
 * Santa Cruz Library Event Import Script
 *
 * This script:
 * 1. Fetches the iCal feed to get list of upcoming events
 * 2. Scrapes each event page for full details
 * 3. Creates/updates Airtable records with complete information
 *
 * Usage: node scripts/import-santa-cruz-library.js
 *
 * Required environment variables:
 * - AIRTABLE_ACCESS_TOKEN
 * - AIRTABLE_BASE_ID
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');
const ICAL = require('ical.js');
const cheerio = require('cheerio');

// Configuration
const ICAL_FEED_URL = 'https://santacruzpl.libnet.info/feeds?data=eyJmZWVkVHlwZSI6ImljYWwiLCJmaWx0ZXJzIjp7ImxvY2F0aW9uIjpbImFsbCJdLCJhZ2VzIjpbIkZhbWlseSIsIkJhYnkgMC0yIHllYXJzIiwiS2lkcyAwLTMgeWVhcnMiLCJLaWRzIDMtNSB5ZWFycyIsIktpZHMgNi0xMSB5ZWFycnMiLCJUd2VlbnMgOC0xMiB5ZWFycyIsIlRlZW5zIDEyLTE4IHllYXJzIl0sInR5cGVzIjpbImFsbCJdLCJ0YWdzIjpbXSwidGVybSI6IiIsImRheXMiOjF9fQ';
const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';
const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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
 * Fetch and parse iCal feed
 */
async function fetchICalFeed() {
  console.log('📡 Fetching iCal feed...');

  try {
    const response = await fetch(ICAL_FEED_URL);
    const icalData = await response.text();

    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    console.log(`✅ Found ${vevents.length} events in feed\n`);

    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        uid: event.uid,
        summary: event.summary,
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate(),
        location: event.location,
        description: event.description,
        geo: vevent.getFirstPropertyValue('geo'),
      };
    });
  } catch (error) {
    console.error('❌ Error fetching iCal feed:', error.message);
    throw error;
  }
}

/**
 * Scrape event page for full details
 */
async function scrapeEventPage(uid) {
  const url = `${EVENT_PAGE_BASE_URL}${uid}`;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract event details from the page
    const eventData = {
      uid,
      url,
    };

    // Title - try h2 first (Santa Cruz uses h2 for event titles), then h1, then JSON-LD
    eventData.title = $('h2').first().text().trim() || $('h1').first().text().trim() || null;

    // Fallback to JSON-LD if no title found
    if (!eventData.title) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          if (jsonData.name) {
            eventData.title = jsonData.name.replace(/&amp;/g, '&');
            return false; // break
          }
        } catch (e) {}
      });
    }

    // Full description - try multiple strategies
    let description = null;

    // Strategy 1: Check JSON-LD structured data for description
    $('script[type="application/ld+json"]').each((i, el) => {
      if (description) return false; // already found
      try {
        const jsonData = JSON.parse($(el).html());
        // JSON-LD often has short descriptions like "For ages 0-5", so we'll use this as fallback
        if (jsonData.description && jsonData.description.length > 20) {
          description = jsonData.description.replace(/&amp;/g, '&');
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Strategy 2: Look for substantial paragraph elements (this is the main content)
    // Collect ALL paragraphs that look like event descriptions
    const paragraphs = [];

    $('p').each((i, el) => {
      const text = $(el).text().trim();

      // Include paragraphs that are substantial (> 50 chars)
      if (text.length > 50) {
        // Exclude navigation/UI text and metadata
        const isNavText = text.match(/sign up|newsletter|donate|volunteer|email us|suggest a purchase|we're open|today's hours|age group:|event type:/i);

        if (!isNavText) {
          paragraphs.push(text);
        }
      }
    });

    // If we found substantial paragraphs, use them (joined with space)
    if (paragraphs.length > 0) {
      description = paragraphs.join(' ');
    }

    eventData.description = description || null;

    // Image
    const imageEl = $('img[src*="event"], img[src*="storytime"], .event-image img').first();
    eventData.image = imageEl.attr('src')
      ? (imageEl.attr('src').startsWith('http')
          ? imageEl.attr('src')
          : `https://santacruzpl.libnet.info${imageEl.attr('src')}`)
      : null;

    // Location details - use first occurrence only to avoid duplicates
    const locationEl = $('.location, .venue, [class*="location"]').first();
    const locationText = locationEl.text().trim();

    // Location name (branch) - clean up trailing dashes
    eventData.location_name = locationText ? locationText.replace(/\s*-\s*$/, '').trim() : null;

    // Try to extract address from schema.org structured data first (most reliable)
    let addressFound = false;
    $('script[type="application/ld+json"]').each((i, el) => {
      if (addressFound) return;
      try {
        const jsonData = JSON.parse($(el).html());
        if (jsonData.location && jsonData.location.address) {
          const addr = jsonData.location.address;
          if (addr.streetAddress) {
            eventData.street = addr.streetAddress.trim();
            eventData.city = addr.addressLocality?.trim() || 'Santa Cruz';
            eventData.state = addr.addressRegion?.trim() || 'CA';
            eventData.zip = addr.postalCode ? parseInt(addr.postalCode) : null;
            addressFound = true;
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Fallback: Try to extract address from page elements
    if (!addressFound) {
      const addressEl = $('.address, [class*="address"], a[href*="maps.google.com"]');
      const fullAddress = addressEl.text().trim() || null;

      // Parse address if available (format: "Street, City, State ZIP")
      if (fullAddress) {
        const addressMatch = fullAddress.match(/^(.+?),\s*([^,]+?),\s*([A-Z]{2}),?\s*(\d{5})/);
        if (addressMatch) {
          eventData.street = addressMatch[1].trim();
          eventData.city = addressMatch[2].trim();
          eventData.state = addressMatch[3].trim();
          eventData.zip = parseInt(addressMatch[4]);
          addressFound = true;
        }
      }
    }

    // If still no address, try to extract city from text
    if (!eventData.city) {
      const text = $('body').text();
      const cityMatch = text.match(/Santa Cruz|Aptos|Capitola|Scotts Valley|Felton|Boulder Creek|Live Oak/);
      if (cityMatch) {
        eventData.city = cityMatch[0];
        eventData.state = 'CA';
      }
    }

    // Age range
    const ageText = $('.age, [class*="age"]').text().trim();
    const ageMatch = ageText.match(/(\d+)-(\d+)\s*years?|ages?\s*(\d+)-(\d+)|under\s*(\d+)|(\d+)\+/i);
    if (ageMatch) {
      eventData.age_range = ageText;
    } else if (eventData.description) {
      // Try to extract from description
      const descAgeMatch = eventData.description.match(/for ages? (\d+)-(\d+)|ages? (\d+)-(\d+)|under (\d+)|(\d+)\+/i);
      if (descAgeMatch) {
        eventData.age_range = descAgeMatch[0];
      }
    }

    // Categories/Tags - Extract from event type/description
    const categories = [];

    // Look for category elements
    $('.category, .tag, [class*="category"], [class*="tag"]').each((i, el) => {
      const cat = $(el).text().trim();
      if (cat) categories.push(cat);
    });

    // If no tags found, infer from title and description
    if (categories.length === 0) {
      const titleAndDesc = ((eventData.title || '') + ' ' + (eventData.description || '')).toLowerCase();

      // Common library event tags
      if (titleAndDesc.match(/storytime|story time/)) categories.push('Storytime');
      if (titleAndDesc.match(/craft|art|make|create/)) categories.push('Arts & Crafts');
      if (titleAndDesc.match(/teen|tween/)) categories.push('Teens');
      if (titleAndDesc.match(/baby|babies|toddler|preschool/)) categories.push('Early Childhood');
      if (titleAndDesc.match(/spanish|bilingual|russian|japanese/)) categories.push('Multilingual');
      if (titleAndDesc.match(/book club|reading/)) categories.push('Book Club');
      if (titleAndDesc.match(/tech|computer|digital/)) categories.push('Technology');
      if (titleAndDesc.match(/game|gaming/)) categories.push('Games');
      if (titleAndDesc.match(/music/)) categories.push('Music');
      if (titleAndDesc.match(/yoga|fitness|exercise/)) categories.push('Wellness');
    }

    // Always add "Library Events" tag
    if (!categories.includes('Library Events')) {
      categories.push('Library Events');
    }

    eventData.tags = categories.length > 0 ? categories.join(', ') : 'Library Events';

    // Phone
    const phoneEl = $('a[href^="tel:"]');
    eventData.phone = phoneEl.text().trim() || null;

    return eventData;
  } catch (error) {
    console.error(`❌ Error scraping event ${uid}:`, error.message);
    return null;
  }
}

/**
 * Merge iCal and scraped data
 */
function mergeEventData(icalEvent, scrapedData) {
  if (!scrapedData) return null;

  // Parse location from iCal
  let city = 'Santa Cruz';
  let locationName = icalEvent.location;

  if (icalEvent.location) {
    // iCal format is "Branch Name - " (with trailing dash)
    const locationParts = icalEvent.location.split(' - ');
    if (locationParts.length > 0) {
      locationName = locationParts[0].trim();
    }
  }

  // Override with scraped location name if available and cleaner
  if (scrapedData.location_name) {
    // Remove duplicate text and trailing dashes
    let cleanLocation = scrapedData.location_name
      .replace(/\s*-\s*$/g, '') // Remove trailing dash
      .trim();

    // If location name appears twice, keep only first occurrence
    const parts = cleanLocation.split(/\s*-\s*/);
    if (parts.length >= 2 && parts[0] === parts[1]) {
      cleanLocation = parts[0];
    }

    locationName = cleanLocation;
  }

  // Parse geo coordinates
  let latitude = null;
  let longitude = null;
  if (icalEvent.geo && Array.isArray(icalEvent.geo)) {
    latitude = parseFloat(icalEvent.geo[0]);
    longitude = parseFloat(icalEvent.geo[1]);
  }

  return {
    // Store UID in website URL for deduplication
    uid: icalEvent.uid,

    // Basic info
    title: scrapedData.title || icalEvent.summary,
    type: 'Event',
    description: scrapedData.description || icalEvent.description,

    // Date/time
    start_date: icalEvent.startDate.toISOString(),

    // Location
    location_name: scrapedData.location_name || locationName,
    city: scrapedData.city || city,
    state: scrapedData.state || 'CA',
    street: scrapedData.street || null,
    zip: scrapedData.zip || null,
    latitude: latitude,
    longitude: longitude,

    // Details
    organizer: 'Santa Cruz Public Libraries',
    website: scrapedData.url,
    image: scrapedData.image,
    price: 'Free',
    age_range: scrapedData.age_range || 'All',
    tags: scrapedData.tags,
    phone: scrapedData.phone,
  };
}

/**
 * Check if event already exists in Airtable by website URL
 */
async function eventExists(websiteUrl) {
  try {
    const records = await airtable('Listings')
      .select({
        filterByFormula: `{Website} = '${websiteUrl}'`,
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
      'Place type': 'Library', // Default to Library for all Santa Cruz Library events
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
  console.log('🚀 Starting Santa Cruz Library event import...\n');

  // Fetch iCal feed
  const icalEvents = await fetchICalFeed();

  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Process each event
  for (let i = 0; i < icalEvents.length; i++) {
    const icalEvent = icalEvents[i];
    const progress = `[${i + 1}/${icalEvents.length}]`;

    console.log(`${progress} Processing: ${icalEvent.summary}`);
    console.log(`  UID: ${icalEvent.uid}`);

    // Skip past events
    if (icalEvent.startDate < new Date()) {
      console.log(`  ⏭️  Skipped (past event)\n`);
      skipped++;
      continue;
    }

    // Scrape event page
    console.log(`  🔍 Scraping event page...`);
    const scrapedData = await scrapeEventPage(icalEvent.uid);

    if (!scrapedData) {
      console.log(`  ❌ Failed to scrape event page\n`);
      errors++;
      continue;
    }

    // Merge data
    const eventData = mergeEventData(icalEvent, scrapedData);

    if (!eventData) {
      console.log(`  ❌ Failed to merge event data\n`);
      errors++;
      continue;
    }

    console.log(`  📝 Event details:`);
    console.log(`     Location: ${eventData.city}`);
    console.log(`     Street: ${eventData.street || 'N/A'}`);
    console.log(`     ZIP: ${eventData.zip || 'N/A'}`);
    console.log(`     Date: ${new Date(eventData.start_date).toLocaleDateString()}`);
    if (eventData.image) console.log(`     Image: ✓`);

    // Create or update in Airtable
    const result = await createOrUpdateEvent(eventData);

    if (result.action === 'created') {
      console.log(`  ✅ Created new record\n`);
      created++;
    } else if (result.action === 'updated') {
      console.log(`  ✅ Updated existing record\n`);
      updated++;
    } else {
      console.log(`  ❌ Error: ${result.error}\n`);
      errors++;
    }

    // Rate limiting - wait 2 seconds between requests
    if (i < icalEvents.length - 1) {
      await delay(2000);
    }
  }

  // Print summary
  console.log('━'.repeat(50));
  console.log('📊 Import Summary:');
  console.log(`  ✅ Created: ${created}`);
  console.log(`  🔄 Updated: ${updated}`);
  console.log(`  ⏭️  Skipped (past events): ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('━'.repeat(50));

  if (created > 0 || updated > 0) {
    console.log('\n💡 Events added to Airtable!');
    console.log('   They will sync to Supabase via your existing pipeline.');
  }
}

// Run the import
importEvents()
  .then(() => {
    console.log('\n✅ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
