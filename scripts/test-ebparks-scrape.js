/**
 * Test script for East Bay Regional Park District scraper
 * Tests the scraping functionality without writing to Airtable
 */

const cheerio = require('cheerio');

const CALENDAR_BASE_URL = 'https://www.ebparks.org/calendar';

/**
 * Fetch a single calendar page and extract events
 */
async function fetchCalendarPage(pageNumber = 0) {
  const url = pageNumber === 0 ? CALENDAR_BASE_URL : `${CALENDAR_BASE_URL}?page=${pageNumber}`;
  console.log(`🔍 Fetching calendar page ${pageNumber + 1}: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar page (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const events = [];

    // Find all event links - they link to activecommunities.com
    $('a[href*="activecommunities.com/ebparks/Activity_Search"]').each((i, elem) => {
      const $link = $(elem);
      const eventUrl = $link.attr('href');

      // Extract event details from the card
      const $card = $link;

      // Get title from h3
      const title = $card.find('h3').text().trim();

      // Get date and location from divs
      // Structure: <a><div><img></div><div>Drop-in Program</div><h3>Title</h3><div>Date</div><div>Location</div></a>
      const divs = $card.find('div').map((i, div) => $(div).text().trim()).get();

      let dateText = '';
      let locationText = '';

      // Find the date (contains day of week and time)
      for (const text of divs) {
        if (text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
          dateText = text;
        } else if (text.match(/,\s*[A-Z][a-z]+$/)) {
          // Location typically ends with ", CityName"
          locationText = text;
        }
      }

      // Alternative: Get all divs after h3
      if (!dateText || !locationText) {
        const allDivs = [];
        let foundH3 = false;
        $card.children().each((i, child) => {
          if ($(child).is('h3')) {
            foundH3 = true;
          } else if (foundH3 && $(child).is('div')) {
            const text = $(child).text().trim();
            if (text && text !== 'Drop-in Program') {
              allDivs.push(text);
            }
          }
        });

        // First div after h3 is usually date, second is location
        if (allDivs.length >= 1 && !dateText) {
          dateText = allDivs[0];
        }
        if (allDivs.length >= 2 && !locationText) {
          locationText = allDivs[1];
        }
      }

      // Extract image if available
      let image = null;
      const $img = $card.find('img');
      if ($img.length > 0) {
        const imgSrc = $img.attr('src');
        if (imgSrc && !imgSrc.includes('drop-in_icon')) {
          // Convert relative URLs to absolute
          image = imgSrc.startsWith('http') ? imgSrc : `https://www.ebparks.org${imgSrc}`;
        }
      }

      // Check if it's a drop-in program
      const isDropIn = $card.find('img[alt*="drop-in"]').length > 0 ||
                       $card.find('img[src*="drop-in_icon"]').length > 0;

      if (title && eventUrl) {
        events.push({
          title,
          dateText,
          locationText,
          eventUrl,
          image,
          isDropIn
        });
      }
    });

    console.log(`✓ Found ${events.length} events\n`);
    return events;

  } catch (error) {
    console.error(`❌ Error fetching calendar page:`, error.message);
    return [];
  }
}

/**
 * Test the scraper
 */
async function testScraper() {
  console.log('🧪 Testing East Bay Regional Park District scraper...\n');

  const events = await fetchCalendarPage(0);

  if (events.length === 0) {
    console.log('❌ No events found');
    return;
  }

  console.log('📋 Sample Events:\n');
  console.log('='.repeat(70));

  // Show first 5 events
  events.slice(0, 5).forEach((event, index) => {
    console.log(`\nEvent ${index + 1}:`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Date: ${event.dateText}`);
    console.log(`  Location: ${event.locationText}`);
    console.log(`  URL: ${event.eventUrl}`);
    console.log(`  Drop-in: ${event.isDropIn ? 'Yes' : 'No'}`);
    console.log(`  Image: ${event.image || 'None'}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Successfully scraped ${events.length} events from page 1`);
}

// Run the test
testScraper().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
