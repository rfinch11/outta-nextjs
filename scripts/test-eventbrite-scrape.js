const cheerio = require('cheerio');

async function testEventbriteScrape() {
  console.log('🔍 Testing Eventbrite search scraping...\n');

  try {
    // Test search: Kid-friendly events in San Francisco
    const searchUrl = 'https://www.eventbrite.com/d/ca--san-francisco/kids--events/';

    console.log(`Fetching: ${searchUrl}\n`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Eventbrite page');
      console.error('Status:', response.status);
      process.exit(1);
    }

    const html = await response.text();
    console.log(`✅ Page fetched (${html.length} bytes)\n`);

    // Save HTML for inspection
    const fs = require('fs');
    fs.writeFileSync('/tmp/eventbrite-test.html', html);
    console.log('💾 Saved HTML to /tmp/eventbrite-test.html for inspection\n');

    // Parse with Cheerio
    const $ = cheerio.load(html);

    console.log('🔎 Analyzing page structure...\n');

    // Try to find event cards/listings
    const possibleSelectors = [
      'article',
      '[data-testid*="event"]',
      '[class*="event"]',
      '[class*="EventCard"]',
      '[class*="SearchEvent"]',
      '.discover-search-desktop-card',
      '.search-event-card',
      'a[href*="/e/"]'
    ];

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
      }
    }

    console.log('\n📝 Examining first few event links...\n');

    // Find all event links
    const eventLinks = [];
    $('a[href*="/e/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/e/') && !href.includes('tickets')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.eventbrite.com${href}`;
        eventLinks.push(fullUrl);
      }
    });

    // Deduplicate
    const uniqueLinks = [...new Set(eventLinks)];
    console.log(`Found ${uniqueLinks.length} unique event links\n`);

    // Show first 5
    uniqueLinks.slice(0, 5).forEach((link, i) => {
      console.log(`${i + 1}. ${link}`);
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Inspect /tmp/eventbrite-test.html to understand page structure');
    console.log('2. Identify correct selectors for event data');
    console.log('3. Build parser to extract: title, date, location, URL, image');
    console.log('4. Optionally: scrape individual event pages for full details');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEventbriteScrape();
