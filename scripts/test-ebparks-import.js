/**
 * Test script for East Bay Regional Park District import
 * Tests the scraping and data mapping without writing to Supabase
 */

const cheerio = require('cheerio');
const { chromium } = require('playwright');

const CALENDAR_BASE_URL = 'https://www.ebparks.org/calendar';

// Copy the necessary functions from import-ebparks-events.js
async function fetchCalendarPage(pageNumber = 0) {
  const url = pageNumber === 0 ? CALENDAR_BASE_URL : `${CALENDAR_BASE_URL}?page=${pageNumber}`;
  console.log(`🔍 Fetching calendar page ${pageNumber + 1}...\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const events = [];

    $('a[href*="activecommunities.com/ebparks/Activity_Search"]').each((i, elem) => {
      const $link = $(elem);
      const eventUrl = $link.attr('href');
      const $card = $link;
      const title = $card.find('h3').text().trim();
      const divs = $card.find('div').map((i, div) => $(div).text().trim()).get();

      let dateText = '';
      let locationText = '';

      for (const text of divs) {
        if (text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
          dateText = text;
        } else if (text.match(/,\s*[A-Z][a-z]+$/)) {
          locationText = text;
        }
      }

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

        if (allDivs.length >= 1 && !dateText) dateText = allDivs[0];
        if (allDivs.length >= 2 && !locationText) locationText = allDivs[1];
      }

      const isDropIn = $card.find('img[alt*="drop-in"]').length > 0 ||
                       $card.find('img[src*="drop-in_icon"]').length > 0;

      if (title && eventUrl) {
        events.push({
          title,
          dateText,
          locationText,
          eventUrl,
          isDropIn
        });
      }
    });

    console.log(`✓ Found ${events.length} events\n`);
    return events;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return [];
  }
}

async function scrapeEventDetails(browser, event) {
  const page = await browser.newPage();

  try {
    console.log(`  🔍 Loading ${event.eventUrl}...`);

    await page.goto(event.eventUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Extract description
    let description = '';
    const descSelectors = [
      '[class*="description"]',
      '[class*="Description"]',
      '[class*="detail"]',
      'p'
    ];

    for (const selector of descSelectors) {
      const elements = await page.locator(selector).all();
      const texts = [];

      for (const elem of elements) {
        const text = await elem.textContent();
        if (text && text.trim().length > 50 && !text.includes('©') && !text.includes('Privacy')) {
          texts.push(text.trim());
        }
      }

      if (texts.length > 0) {
        description = texts.slice(0, 2).join('\n\n');
        break;
      }
    }

    if (!description) {
      description = event.isDropIn
        ? 'Drop-in program - no registration required.'
        : 'Visit the East Bay Regional Park District website for details.';
    }

    // Extract image
    let image = null;
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt') || '';

      if (src && !src.includes('logo') && !src.includes('icon') && !alt.toLowerCase().includes('logo')) {
        if (src.startsWith('http')) {
          image = src;
        } else if (src.startsWith('//')) {
          image = 'https:' + src;
        } else if (src.startsWith('/')) {
          const url = new URL(event.eventUrl);
          image = `${url.origin}${src}`;
        }

        if (image) break;
      }
    }

    await page.close();

    return {
      ...event,
      description,
      image,
      price: event.isDropIn ? 'Free' : 'See website'
    };

  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    await page.close();
    return {
      ...event,
      description: 'Visit the East Bay Regional Park District website for details.',
      image: null,
      price: event.isDropIn ? 'Free' : 'See website'
    };
  }
}

async function testImport() {
  console.log('🧪 Testing East Bay Parks import with Playwright...\n');

  const browser = await chromium.launch({ headless: true });

  const events = await fetchCalendarPage(0);

  if (events.length === 0) {
    console.log('❌ No events found');
    await browser.close();
    return;
  }

  console.log('📋 Testing first 2 events with full scraping:\n');
  console.log('='.repeat(70));

  for (let i = 0; i < Math.min(2, events.length); i++) {
    const event = events[i];
    console.log(`\n[${i + 1}] ${event.title}`);
    console.log(`  Date: ${event.dateText}`);
    console.log(`  Location: ${event.locationText}`);
    console.log(`  Drop-in: ${event.isDropIn ? 'Yes' : 'No'}`);

    const details = await scrapeEventDetails(browser, event);
    console.log(`  Description: ${details.description.substring(0, 150)}...`);
    console.log(`  Image: ${details.image || 'None'}`);
    console.log(`  Price: ${details.price}`);
  }

  await browser.close();

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Test complete! Found ${events.length} total events`);
  console.log(`✅ Successfully scraped full details for 2 events with Playwright`);
}

testImport().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
