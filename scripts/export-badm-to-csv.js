/**
 * Export Bay Area Discovery Museum events to CSV
 *
 * Usage: node scripts/export-badm-to-csv.js
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');
const fs = require('fs');

const EVENTS_URL = 'https://bayareadiscoverymuseum.org/events/';
const OUTPUT_FILE = '/tmp/badm-events.csv';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch event URLs
 */
async function fetchEventUrls() {
  console.log('🔍 Fetching events listing page...');

  const response = await fetch(EVENTS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const eventUrls = [];

  $('a[href*="/events/"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href && href !== '/events/' && !href.endsWith('/events/') && href.includes('/events/')) {
      const fullUrl = href.startsWith('http') ? href : `https://bayareadiscoverymuseum.org${href}`;
      if (!eventUrls.includes(fullUrl)) {
        eventUrls.push(fullUrl);
      }
    }
  });

  console.log(`✓ Found ${eventUrls.length} events\n`);
  return eventUrls;
}

/**
 * Scrape event details
 */
async function scrapeEventDetails(eventUrl) {
  try {
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() ||
                  $('title').text().replace(' - Bay Area Discovery Museum', '').trim();

    let description = '';
    const contentBlocks = [];
    $('p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 50 && !text.includes('©') && !text.includes('Privacy Policy')) {
        contentBlocks.push(text);
      }
    });
    description = contentBlocks.slice(0, 3).join(' ');

    let startDate = null;
    let dateText = '';
    const pageText = $('body').text();

    // Try ticket URL first
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
          // ignore
        }
      }
    }

    // Fallback to h3
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
            // ignore
          }
        }
      });
    }

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

    let image = null;
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      image = ogImage.startsWith('http') ? ogImage : `https://bayareadiscoverymuseum.org${ogImage}`;
    }

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

    return {
      title,
      description: description.substring(0, 200), // Truncate for CSV
      startDate,
      dateText,
      price,
      image,
      ageRange: '0-10',
      tags: tags.join(', '),
      url: eventUrl,
      locationType: 'Activity',
      locationName: 'Bay Area Discovery Museum',
      city: 'Sausalito',
      state: 'CA',
      street: '557 McReynolds Rd',
      zip: '94965',
      organizer: 'Bay Area Discovery Museum',
      placeType: 'Museum'
    };
  } catch (error) {
    console.error(`Error scraping ${eventUrl}:`, error.message);
    return null;
  }
}

/**
 * Escape CSV field
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Main export function
 */
async function exportToCSV() {
  console.log('📊 Exporting Bay Area Discovery Museum events to CSV...\n');

  const eventUrls = await fetchEventUrls();
  const events = [];

  for (let i = 0; i < eventUrls.length; i++) {
    const eventUrl = eventUrls[i];
    console.log(`[${i + 1}/${eventUrls.length}] Scraping ${eventUrl.split('/').pop()}...`);

    const eventData = await scrapeEventDetails(eventUrl);
    if (eventData) {
      events.push(eventData);
    }

    await delay(2000);
  }

  // Create CSV
  const headers = [
    'Title',
    'Type',
    'Description',
    'Start Date',
    'Date Text',
    'Location Name',
    'Street',
    'City',
    'State',
    'ZIP',
    'Price',
    'Age Range',
    'Organizer',
    'Website',
    'Image',
    'Tags',
    'Place Type'
  ];

  let csv = headers.join(',') + '\n';

  events.forEach(event => {
    const row = [
      escapeCSV(event.title),
      escapeCSV(event.locationType),
      escapeCSV(event.description),
      escapeCSV(event.startDate),
      escapeCSV(event.dateText),
      escapeCSV(event.locationName),
      escapeCSV(event.street),
      escapeCSV(event.city),
      escapeCSV(event.state),
      escapeCSV(event.zip),
      escapeCSV(event.price),
      escapeCSV(event.ageRange),
      escapeCSV(event.organizer),
      escapeCSV(event.url),
      escapeCSV(event.image),
      escapeCSV(event.tags),
      escapeCSV(event.placeType)
    ];
    csv += row.join(',') + '\n';
  });

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, csv);

  console.log('\n✅ CSV export complete!');
  console.log(`📁 File saved to: ${OUTPUT_FILE}`);
  console.log(`📊 Total events: ${events.length}`);

  // Also print to console
  console.log('\n' + '='.repeat(80));
  console.log('CSV PREVIEW:');
  console.log('='.repeat(80));
  console.log(csv);
}

exportToCSV().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
