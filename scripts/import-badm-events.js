/**
 * Bay Area Discovery Museum Event Import Script
 *
 * This script:
 * 1. Scrapes the BADM events listing page
 * 2. Extracts event detail page URLs
 * 3. Scrapes full event information from each detail page
 * 4. Creates/updates Supabase records with complete information
 *
 * Usage: node scripts/import-badm-events.js
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EVENTS_URL = 'https://bayareadiscoverymuseum.org/events/';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch the events listing page and extract event URLs
 */
async function fetchEventUrls() {
  console.log('🔍 Fetching events listing page...');

  try {
    const response = await fetch(EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events page (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const eventUrls = [];

    // Find all event links - looking for links that contain "/events/" and are not the main events page
    $('a[href*="/events/"]').each((i, elem) => {
      const href = $(elem).attr('href');

      // Filter out the main events page and ensure it's a full event URL
      if (href && href !== '/events/' && !href.endsWith('/events/') && href.includes('/events/')) {
        // Convert relative URLs to absolute
        const fullUrl = href.startsWith('http') ? href : `https://bayareadiscoverymuseum.org${href}`;

        // Only add unique URLs
        if (!eventUrls.includes(fullUrl)) {
          eventUrls.push(fullUrl);
        }
      }
    });

    console.log(`✓ Found ${eventUrls.length} event URLs\n`);
    return eventUrls;

  } catch (error) {
    console.error('❌ Error fetching events listing:', error.message);
    return [];
  }
}

/**
 * Scrape individual event page for full details
 */
async function scrapeEventDetails(eventUrl) {
  try {
    console.log(`  🔍 Scraping ${eventUrl}`);

    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`  ⚠️  Failed to fetch (${response.status})`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract event title
    const title = $('h1').first().text().trim() ||
                  $('title').text().replace(' - Bay Area Discovery Museum', '').trim();

    // Extract description - look for main content
    let description = '';

    // Try to find the main event description
    const contentBlocks = [];
    $('p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 50 && !text.includes('©') && !text.includes('Privacy Policy')) {
        contentBlocks.push(text);
      }
    });
    description = contentBlocks.slice(0, 3).join('\n\n');

    // Extract date and time - look for patterns
    let startDate = null;
    let dateText = '';

    // Strategy 1: Look for date in ticket URL (most reliable)
    const ticketLinks = $('a[href*="date="]');
    if (ticketLinks.length > 0) {
      const ticketHref = ticketLinks.first().attr('href');
      const dateParam = ticketHref.match(/date=([^&]+)/);
      if (dateParam) {
        try {
          // The date is already in ISO format, just use it
          startDate = decodeURIComponent(dateParam[1]);
          const parsedForDisplay = new Date(startDate);
          dateText = parsedForDisplay.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch (e) {
          console.log(`  ⚠️  Could not parse ticket date: ${dateParam[1]}`);
        }
      }
    }

    // Strategy 2: Look for h3 tag with date (fallback)
    if (!startDate) {
      const h3Elements = $('h3');
      h3Elements.each((i, elem) => {
        const h3Text = $(elem).text().trim();
        // Match "Wednesday, December 31, 9AM – 2PM" or similar
        const h3DatePattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)|,?\s+\d{1,2}(?:AM|PM))?/i;
        if (h3DatePattern.test(h3Text)) {
          dateText = h3Text;

          // Parse without year - assume current or next year
          try {
            const dateMatch = h3Text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i);
            const timeMatch = h3Text.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);

            if (dateMatch) {
              const currentYear = new Date().getFullYear();
              const dateStr = `${dateMatch[0]}, ${currentYear}`;
              const parsedDate = new Date(dateStr);

              // If the date is in the past, try next year
              if (parsedDate < new Date()) {
                parsedDate.setFullYear(currentYear + 1);
              }

              if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const period = timeMatch[3];

                let hour24 = hours;
                if (period.toUpperCase() === 'PM' && hours !== 12) hour24 += 12;
                if (period.toUpperCase() === 'AM' && hours === 12) hour24 = 0;

                parsedDate.setHours(hour24, minutes, 0, 0);
              }

              // Format as ISO string with Pacific timezone offset
              const month = parsedDate.getMonth() + 1;
              const isDST = month >= 3 && month <= 10;
              const offset = isDST ? '-07:00' : '-08:00';

              const year = parsedDate.getFullYear();
              const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const hour = String(parsedDate.getHours()).padStart(2, '0');
              const minute = String(parsedDate.getMinutes()).padStart(2, '0');

              startDate = `${year}-${monthStr}-${day}T${hour}:${minute}:00${offset}`;
              return false; // break the loop
            }
          } catch (e) {
            console.log(`  ⚠️  Could not parse h3 date: ${h3Text}`);
          }
        }
      });
    }

    // Extract price information
    let price = 'See website';
    const priceText = pageText.toLowerCase();

    if (priceText.includes('free') && priceText.includes('admission')) {
      price = 'Free';
    } else if (priceText.includes('members: $')) {
      // Extract member price as it's usually the lowest
      const memberMatch = pageText.match(/Members?:\s*\$(\d+)/i);
      if (memberMatch) {
        const publicMatch = pageText.match(/Public:\s*\$(\d+)/i);
        if (publicMatch) {
          price = `$${memberMatch[1]} members, $${publicMatch[1]} public`;
        } else {
          price = `$${memberMatch[1]} members`;
        }
      }
    }

    // Extract image
    let image = null;
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      image = ogImage.startsWith('http') ? ogImage : `https://bayareadiscoverymuseum.org${ogImage}`;
    } else {
      const firstImg = $('img').first().attr('src');
      if (firstImg && !firstImg.includes('logo')) {
        image = firstImg.startsWith('http') ? firstImg : `https://bayareadiscoverymuseum.org${firstImg}`;
      }
    }

    // Age range - BADM is generally for ages 0-10
    const ageRange = '0-10';

    // Tags
    const tags = ['Bay Area Discovery Museum', 'Museum', 'Educational'];

    // Add specific tags based on content
    if (title.toLowerCase().includes('art') || description.toLowerCase().includes('art')) {
      tags.push('Arts & Crafts');
    }
    if (title.toLowerCase().includes('music') || description.toLowerCase().includes('music')) {
      tags.push('Music');
    }
    if (title.toLowerCase().includes('science') || description.toLowerCase().includes('science')) {
      tags.push('STEM');
    }
    if (priceText.includes('free')) {
      tags.push('Free');
    }

    return {
      title,
      description,
      startDate,
      dateText,
      price,
      image,
      ageRange,
      tags,
      url: eventUrl
    };

  } catch (error) {
    console.error(`  ❌ Error scraping event:`, error.message);
    return null;
  }
}

/**
 * Map scraped event data to Supabase fields
 */
function mapEventToSupabase(event) {
  return {
    title: event.title,
    type: 'Activity',  // BADM events are activities at the museum
    description: event.description,
    start_date: event.startDate,
    location_name: 'Bay Area Discovery Museum',
    city: 'Sausalito',
    state: 'CA',
    street: '557 McReynolds Rd',
    zip: 94965,
    organizer: 'Bay Area Discovery Museum',
    website: event.url,
    image: event.image,
    price: event.price,
    age_range: event.ageRange,
    tags: event.tags.join(', '),
    place_type: 'Museum',
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
      console.error(`  ❌ Error checking if event exists:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`  ❌ Error checking if event exists:`, error.message);
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
        console.error(`  ❌ Error updating event:`, error.message);
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
        console.error(`  ❌ Error creating event:`, error.message);
        return { action: 'error', error: error.message };
      }

      return { action: 'created', id: data.id };
    }
  } catch (error) {
    console.error(`  ❌ Error creating/updating event:`, error.message);
    return { action: 'error', error: error.message };
  }
}

/**
 * Main import function
 */
async function importEvents() {
  console.log('🚀 Starting Bay Area Discovery Museum event import...\n');

  // Fetch event URLs from listing page
  const eventUrls = await fetchEventUrls();

  if (eventUrls.length === 0) {
    console.log('❌ No events found to import');
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Process each event
  for (let i = 0; i < eventUrls.length; i++) {
    const eventUrl = eventUrls[i];
    const progress = `[${i + 1}/${eventUrls.length}]`;

    console.log(`\n${progress} Processing event...`);

    // Scrape event details
    const eventDetails = await scrapeEventDetails(eventUrl);

    if (!eventDetails) {
      console.log(`  ⏭️  Skipped (could not scrape details)`);
      skipped++;
      await delay(2000);
      continue;
    }

    console.log(`  📝 Title: ${eventDetails.title}`);
    console.log(`  📅 Date: ${eventDetails.dateText || 'Not found'}`);
    console.log(`  💰 Price: ${eventDetails.price}`);

    // Skip if missing critical data
    if (!eventDetails.title) {
      console.log(`  ⏭️  Skipped (missing title)`);
      skipped++;
      await delay(2000);
      continue;
    }

    // Skip past events
    if (eventDetails.startDate) {
      const eventDate = new Date(eventDetails.startDate);
      if (eventDate < new Date()) {
        console.log(`  ⏭️  Skipped (past event)`);
        skipped++;
        await delay(2000);
        continue;
      }
    }

    // Map to Supabase format
    const eventData = mapEventToSupabase(eventDetails);

    // Create or update in Supabase
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

    // Rate limiting - 2 seconds between requests
    await delay(2000);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${created}`);
  console.log(`♻️  Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total processed: ${eventUrls.length}`);
  console.log('='.repeat(50));
}

// Run the import
importEvents().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
