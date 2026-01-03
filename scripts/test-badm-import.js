/**
 * Test script for Bay Area Discovery Museum event import
 *
 * This script tests the scraper by processing only the first 3 events.
 * Use this to verify the scraper works before running the full import.
 *
 * Usage: node scripts/test-badm-import.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');
const cheerio = require('cheerio');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const EVENTS_URL = 'https://bayareadiscoverymuseum.org/events/';
const TEST_LIMIT = 3; // Only process first 3 events

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

    // Find all event links
    $('a[href*="/events/"]').each((i, elem) => {
      const href = $(elem).attr('href');

      if (href && href !== '/events/' && !href.endsWith('/events/') && href.includes('/events/')) {
        const fullUrl = href.startsWith('http') ? href : `https://bayareadiscoverymuseum.org${href}`;

        if (!eventUrls.includes(fullUrl)) {
          eventUrls.push(fullUrl);
        }
      }
    });

    // Limit to TEST_LIMIT events
    const limitedUrls = eventUrls.slice(0, TEST_LIMIT);

    console.log(`✓ Found ${eventUrls.length} total events`);
    console.log(`✓ Testing with first ${limitedUrls.length} events\n`);

    return limitedUrls;

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

    // Extract description
    let description = '';
    const contentBlocks = [];
    $('p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 50 && !text.includes('©') && !text.includes('Privacy Policy')) {
        contentBlocks.push(text);
      }
    });
    description = contentBlocks.slice(0, 3).join('\n\n');

    // Extract date and time
    let startDate = null;
    let dateText = '';
    const pageText = $('body').text();

    // Strategy 1: Look for date in ticket URL (most reliable)
    const ticketLinks = $('a[href*="date="]');
    if (ticketLinks.length > 0) {
      const ticketHref = ticketLinks.first().attr('href');
      const dateParam = ticketHref.match(/date=([^&]+)/);
      if (dateParam) {
        try {
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
        const h3DatePattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)|,?\s+\d{1,2}(?:AM|PM))?/i;
        if (h3DatePattern.test(h3Text)) {
          dateText = h3Text;

          try {
            const dateMatch = h3Text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i);
            const timeMatch = h3Text.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);

            if (dateMatch) {
              const currentYear = new Date().getFullYear();
              const dateStr = `${dateMatch[0]}, ${currentYear}`;
              const parsedDate = new Date(dateStr);

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

              const month = parsedDate.getMonth() + 1;
              const isDST = month >= 3 && month <= 10;
              const offset = isDST ? '-07:00' : '-08:00';

              const year = parsedDate.getFullYear();
              const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const hour = String(parsedDate.getHours()).padStart(2, '0');
              const minute = String(parsedDate.getMinutes()).padStart(2, '0');

              startDate = `${year}-${monthStr}-${day}T${hour}:${minute}:00${offset}`;
              return false;
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

    const ageRange = '0-10';
    const tags = ['Bay Area Discovery Museum', 'Museum', 'Educational'];

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
 * Main test function
 */
async function testImport() {
  console.log('🧪 Testing Bay Area Discovery Museum scraper...\n');

  // Fetch event URLs
  const eventUrls = await fetchEventUrls();

  if (eventUrls.length === 0) {
    console.log('❌ No events found to test');
    return;
  }

  // Process each event
  for (let i = 0; i < eventUrls.length; i++) {
    const eventUrl = eventUrls[i];
    const progress = `[${i + 1}/${eventUrls.length}]`;

    console.log(`\n${progress} Processing event...`);

    const eventDetails = await scrapeEventDetails(eventUrl);

    if (!eventDetails) {
      console.log(`  ⏭️  Could not scrape details`);
      await delay(2000);
      continue;
    }

    console.log(`  📝 Title: ${eventDetails.title}`);
    console.log(`  📅 Date: ${eventDetails.dateText || 'Not found'}`);
    console.log(`  📅 Parsed Date: ${eventDetails.startDate || 'Not parsed'}`);
    console.log(`  💰 Price: ${eventDetails.price}`);
    console.log(`  🏷️  Tags: ${eventDetails.tags.join(', ')}`);
    console.log(`  🖼️  Image: ${eventDetails.image ? 'Found' : 'Not found'}`);
    console.log(`  📝 Description preview: ${eventDetails.description.substring(0, 100)}...`);

    // Rate limiting
    await delay(2000);
  }

  console.log('\n✅ Test completed successfully!');
  console.log('\nTo import these events to Airtable, run:');
  console.log('node scripts/import-badm-events.js');
}

// Run the test
testImport().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
