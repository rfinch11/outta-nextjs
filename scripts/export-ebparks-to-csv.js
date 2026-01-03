/**
 * Export East Bay Parks events to CSV
 * Scrapes events and outputs to CSV file
 */

const cheerio = require('cheerio');
const { chromium } = require('playwright');
const fs = require('fs');

const CALENDAR_BASE_URL = 'https://www.ebparks.org/calendar';
const MAX_PAGES = 10;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCalendarPage(pageNumber = 0) {
  const url = pageNumber === 0 ? CALENDAR_BASE_URL : `${CALENDAR_BASE_URL}?page=${pageNumber}`;
  console.log(`🔍 Fetching page ${pageNumber + 1}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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

    return events;
  } catch (error) {
    console.error(`Error:`, error.message);
    return [];
  }
}

async function scrapeEventDetails(browser, event) {
  let page;

  try {
    page = await browser.newPage();

    await page.goto(event.eventUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Extract description - target the catalog description body which has the full content
    let description = '';
    try {
      // Use the specific East Bay Parks description container
      const descLocator = page.locator('.catalog-description__body');

      if (await descLocator.count() > 0) {
        // Get the innerText which preserves line breaks
        const rawText = await descLocator.first().innerText();

        // Clean up the text by splitting on newlines and rejoining with double newlines
        description = rawText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n\n')
          .trim();
      }
    } catch (e) {
      // Ignore errors
    }

    if (!description || description.length < 50) {
      description = event.isDropIn ? 'Drop-in program' : 'See website for details';
    }

    // Extract image
    let image = null;
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
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

    // Extract price
    let price = event.isDropIn ? 'Free' : 'See website';
    const bodyText = await page.locator('body').textContent();
    const lowerText = bodyText.toLowerCase();

    if (lowerText.includes('free') && lowerText.includes('admission')) {
      price = 'Free';
    } else if (lowerText.includes('$')) {
      const priceMatch = bodyText.match(/\$\s*\d+(?:\.\d{2})?/);
      if (priceMatch) price = priceMatch[0];
    }

    // Extract age range
    let ageRange = 'All ages';
    const agePatterns = [
      /ages?\s+(\d+)[-–]\s*(\d+)/i,
      /(\d+)\s*[-–]\s*(\d+)\s+years?/i,
      /ages?\s+(\d+)\+/i,
    ];

    for (const pattern of agePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        if (match[2]) {
          ageRange = `${match[1]}-${match[2]}`;
        } else {
          ageRange = `${match[1]}+`;
        }
        break;
      }
    }

    return {
      ...event,
      description,
      image,
      price,
      ageRange
    };

  } catch (error) {
    console.error(`  ❌ Error scraping ${event.title}:`, error.message);
    return {
      ...event,
      description: 'Error scraping details',
      image: null,
      price: event.isDropIn ? 'Free' : 'See website',
      ageRange: 'All ages'
    };
  } finally {
    // Ensure page is closed
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

function parseDateText(dateText) {
  if (!dateText) return null;

  try {
    const datePattern = /([A-Za-z]+\.?\s+\d{1,2},\s+\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i;
    const match = dateText.match(datePattern);

    if (match) {
      const dateStr = match[1];
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      const period = match[4].toUpperCase();

      const parsedDate = new Date(dateStr);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      parsedDate.setHours(hour24, minutes, 0, 0);
      return parsedDate.toISOString();
    }
  } catch (error) {
    return null;
  }

  return null;
}

function parseLocation(locationText) {
  if (!locationText) return { park: '', city: '' };
  const parts = locationText.split(',').map(p => p.trim());
  return {
    park: parts[0] || '',
    city: parts[1] || ''
  };
}

function escapeCSV(str) {
  if (!str) return '';
  str = String(str);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

async function exportToCSV() {
  console.log('🚀 Starting East Bay Parks export to CSV...\n');

  const browser = await chromium.launch({ headless: true });

  let allEvents = [];
  let currentPage = 0;

  // Fetch events from all pages
  while (currentPage < MAX_PAGES) {
    const pageEvents = await fetchCalendarPage(currentPage);
    if (pageEvents.length === 0) break;
    allEvents = allEvents.concat(pageEvents);
    currentPage++;
    await delay(2000);
  }

  console.log(`\n✓ Found ${allEvents.length} events. Scraping details...\n`);

  const csvRows = [];
  csvRows.push('Title,Date/Time,Start Date (ISO),Park,City,Price,Age Range,Type,Description,Image URL,Event URL');

  // Process each event (limit to first 20 for reasonable runtime)
  const eventsToProcess = allEvents.slice(0, 20);

  for (let i = 0; i < eventsToProcess.length; i++) {
    const event = eventsToProcess[i];
    console.log(`[${i + 1}/${eventsToProcess.length}] Processing: ${event.title}`);

    const details = await scrapeEventDetails(browser, event);
    const location = parseLocation(event.locationText);
    const startDate = parseDateText(event.dateText);

    // Skip past events
    if (startDate && new Date(startDate) < new Date()) {
      console.log(`  ⏭️  Skipped (past event)`);
      continue;
    }

    csvRows.push([
      escapeCSV(details.title),
      escapeCSV(event.dateText),
      escapeCSV(startDate),
      escapeCSV(location.park),
      escapeCSV(location.city),
      escapeCSV(details.price),
      escapeCSV(details.ageRange),
      details.isDropIn ? 'Drop-in' : 'Activity',
      escapeCSV(details.description),
      escapeCSV(details.image),
      escapeCSV(event.eventUrl)
    ].join(','));

    await delay(2000);
  }

  await browser.close();

  // Write to file
  const csvContent = csvRows.join('\n');
  fs.writeFileSync('ebparks-events.csv', csvContent);

  console.log(`\n✅ Exported ${csvRows.length - 1} events to ebparks-events.csv`);
}

exportToCSV().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
