/**
 * Test pagination for East Bay Regional Park District scraper
 */

const cheerio = require('cheerio');

const CALENDAR_BASE_URL = 'https://www.ebparks.org/calendar';

async function fetchCalendarPage(pageNumber = 0) {
  const url = pageNumber === 0 ? CALENDAR_BASE_URL : `${CALENDAR_BASE_URL}?page=${pageNumber}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const eventCount = $('a[href*="activecommunities.com/ebparks/Activity_Search"]').length;

    return eventCount;

  } catch (error) {
    console.error(`Error:`, error.message);
    return 0;
  }
}

async function testPagination() {
  console.log('🧪 Testing pagination...\n');

  for (let i = 0; i < 3; i++) {
    const count = await fetchCalendarPage(i);
    console.log(`Page ${i + 1}: ${count} events`);

    if (count === 0) {
      console.log(`\n❌ No events found on page ${i + 1}. Stopping.`);
      break;
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Pagination test complete');
}

testPagination();
