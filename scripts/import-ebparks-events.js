/**
 * East Bay Regional Park District Event Import Script
 *
 * This script:
 * 1. Scrapes the EBRPD calendar listing pages with pagination support
 * 2. Extracts event information from each listing card
 * 3. Uses Playwright to scrape event detail pages for full descriptions and images
 * 4. Creates/updates Supabase records with complete event information
 *
 * Usage: node scripts/import-ebparks-events.js
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY for service role)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CALENDAR_BASE_URL = 'https://www.ebparks.org/calendar';
const MAX_PAGES = 10; // Limit to avoid excessive scraping

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
 * Fetch a single calendar page and extract events
 */
async function fetchCalendarPage(pageNumber = 0) {
  const url = pageNumber === 0 ? CALENDAR_BASE_URL : `${CALENDAR_BASE_URL}?page=${pageNumber}`;
  console.log(`🔍 Fetching calendar page ${pageNumber + 1}...`);

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

    console.log(`✓ Found ${events.length} events on page ${pageNumber + 1}`);
    return events;

  } catch (error) {
    console.error(`❌ Error fetching calendar page ${pageNumber + 1}:`, error.message);
    return [];
  }
}

/**
 * Scrape event detail page using Playwright for full description and images
 */
async function scrapeEventDetails(browser, event) {
  let page;

  try {
    page = await browser.newPage();
    console.log(`  🔍 Loading detail page...`);

    // Navigate to the event URL
    await page.goto(event.eventUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for content to load - the page is a React SPA
    await page.waitForTimeout(3000);

    // Use the title from the calendar listing - it's more reliable than the detail page
    const detailTitle = event.title;

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

        console.log(`  ✓ Extracted description (${description.length} chars)`);
      }

      // Fallback: if no description found, try paragraph-based extraction
      if (!description || description.length < 50) {
        const bodyText = await page.locator('body').innerText();
        const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Look for lines that seem like description content
        const descriptionLines = [];
        let foundStart = false;

        for (const line of lines) {
          // Start capturing after we see the event name or description keyword
          if (line.includes(event.title) || line.match(/description/i)) {
            foundStart = true;
            continue;
          }

          // Stop at common footer/navigation elements
          if (line.match(/sign in|create an account|privacy policy|©/i)) {
            break;
          }

          // Collect meaningful content lines
          if (foundStart && line.length > 30 && line.length < 1000) {
            descriptionLines.push(line);
            if (descriptionLines.length >= 10) break; // Reasonable limit
          }
        }

        if (descriptionLines.length > 0) {
          description = descriptionLines.join('\n\n');
          console.log(`  ✓ Extracted description via fallback (${description.length} chars)`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️  Could not extract description: ${e.message}`);
    }

    // If no description found, use a default
    if (!description) {
      description = event.isDropIn
        ? 'Drop-in program - no registration required. Visit the East Bay Regional Park District website for more details.'
        : 'Visit the East Bay Regional Park District website for full event details and registration information.';
    }

    // Skip image extraction - will be filled by Unsplash script
    const detailImage = null;
    console.log(`  📷 Image: Will be filled by Unsplash script`);

    // Extract price/fee information
    let price = event.isDropIn ? 'Free' : 'See website';
    try {
      const bodyText = await page.locator('body').textContent();
      const lowerText = bodyText.toLowerCase();

      if (lowerText.includes('free') && (lowerText.includes('admission') || lowerText.includes('no fee'))) {
        price = 'Free';
      } else if (lowerText.includes('$')) {
        // Try to extract price
        const priceMatch = bodyText.match(/\$\s*\d+(?:\.\d{2})?/);
        if (priceMatch) {
          price = priceMatch[0];
        }
      }
    } catch (e) {
      // Keep default price
    }

    // Extract age range if available
    let ageRange = null;
    try {
      const bodyText = await page.locator('body').textContent();

      // Look for age patterns
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

      // Check for family-friendly indicators
      if (!ageRange && (bodyText.toLowerCase().includes('all ages') ||
          bodyText.toLowerCase().includes('family'))) {
        ageRange = 'All ages';
      }
    } catch (e) {
      // No age range found
    }

    return {
      ...event,
      title: detailTitle,
      description,
      image: detailImage,
      price,
      ageRange
    };

  } catch (error) {
    console.error(`  ❌ Error scraping detail page:`, error.message);

    // Return basic event info as fallback
    return {
      ...event,
      description: event.isDropIn
        ? 'Drop-in program - no registration required. Visit the East Bay Regional Park District website for more details.'
        : 'Visit the East Bay Regional Park District website for full event details and registration information.',
      price: event.isDropIn ? 'Free' : 'See website',
      ageRange: null
    };
  } finally {
    // Ensure page is always closed
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Parse date text to ISO format
 */
function parseDateText(dateText) {
  if (!dateText) return null;

  try {
    // Format: "Wednesday, Dec. 31, 2025, 9:30 AM"
    // Remove day of week and parse the rest
    const datePattern = /([A-Za-z]+\.?\s+\d{1,2},\s+\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i;
    const match = dateText.match(datePattern);

    if (match) {
      const dateStr = match[1]; // "Dec. 31, 2025"
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      const period = match[4].toUpperCase();

      // Parse date
      const parsedDate = new Date(dateStr);

      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      parsedDate.setHours(hour24, minutes, 0, 0);

      // Return ISO string (Supabase handles timestamps)
      return parsedDate.toISOString();
    }
  } catch (error) {
    console.error(`  ⚠️  Could not parse date: ${dateText}`);
  }

  return null;
}

/**
 * Parse location text to extract park name, city, and state
 */
function parseLocation(locationText) {
  if (!locationText) {
    return {
      locationName: 'East Bay Regional Park',
      city: 'East Bay',
      state: 'CA'
    };
  }

  // Format is usually "Park Name, City" or just "Park Name"
  const parts = locationText.split(',').map(p => p.trim());

  return {
    locationName: parts[0] || 'East Bay Regional Park',
    city: parts[1] || 'East Bay',
    state: 'CA'
  };
}

/**
 * Generate tags based on event information
 */
function generateTags(event) {
  const tags = ['East Bay Regional Park District', 'Outdoor', 'Nature'];

  if (event.isDropIn) {
    tags.push('Drop-in', 'Free');
  }

  // Add tags based on title keywords
  const title = event.title.toLowerCase();

  if (title.includes('hike') || title.includes('walk')) {
    tags.push('Hiking');
  }
  if (title.includes('bird') || title.includes('wildlife')) {
    tags.push('Wildlife');
  }
  if (title.includes('kids') || title.includes('family') || title.includes('children')) {
    tags.push('Family-Friendly');
  }
  if (title.includes('bike') || title.includes('cycling')) {
    tags.push('Biking');
  }
  if (title.includes('camp')) {
    tags.push('Camping');
  }
  if (title.includes('farm')) {
    tags.push('Farm', 'Educational');
  }
  if (title.includes('art') || title.includes('craft')) {
    tags.push('Arts & Crafts');
  }

  return tags;
}

/**
 * Generate a unique ID for an event based on its URL
 */
function generateUniqueId(url) {
  // Extract event ID from URL (e.g., "57722" from "Activity_Search/57722")
  const match = url.match(/Activity_Search\/(\d+)/);
  if (match) {
    return `ebparks_${match[1]}`;
  }
  // Fallback: use a hash of the URL
  const hash = Buffer.from(url).toString('base64').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
  return `ebparks_${hash}`;
}

/**
 * Map scraped event data to Supabase fields
 */
function mapEventToSupabase(event) {
  const location = parseLocation(event.locationText);
  const startDate = parseDateText(event.dateText);
  const tags = generateTags(event);

  return {
    airtable_id: generateUniqueId(event.eventUrl),
    title: event.title,
    type: 'Activity',
    description: event.description,
    start_date: startDate,
    location_name: location.locationName,
    city: location.city,
    state: location.state,
    organizer: 'East Bay Regional Park District',
    website: event.eventUrl,
    image: event.image,
    price: event.price,
    age_range: event.ageRange,
    tags: tags.join(', '),
    place_type: 'Park',
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

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('listings')
        .update({
          ...eventData,
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
        .insert(eventData)
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
  console.log('🚀 Starting East Bay Regional Park District event import...\n');

  // Launch browser
  console.log('🌐 Launching browser...\n');
  const browser = await chromium.launch({
    headless: true,
  });

  let allEvents = [];
  let currentPage = 0;

  // Fetch events from multiple pages
  while (currentPage < MAX_PAGES) {
    const pageEvents = await fetchCalendarPage(currentPage);

    if (pageEvents.length === 0) {
      console.log(`\n📄 No more events found. Stopping at page ${currentPage + 1}.`);
      break;
    }

    allEvents = allEvents.concat(pageEvents);
    currentPage++;

    // Rate limiting between page requests
    await delay(2000);
  }

  console.log(`\n✓ Total events found: ${allEvents.length}\n`);

  if (allEvents.length === 0) {
    console.log('❌ No events found to import');
    await browser.close();
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Process each event
  for (let i = 0; i < allEvents.length; i++) {
    const event = allEvents[i];
    const progress = `[${i + 1}/${allEvents.length}]`;

    console.log(`\n${progress} Processing event...`);
    console.log(`  📝 Title: ${event.title}`);
    console.log(`  📅 Date: ${event.dateText || 'Not found'}`);
    console.log(`  📍 Location: ${event.locationText || 'Not found'}`);

    // Skip if missing critical data
    if (!event.title) {
      console.log(`  ⏭️  Skipped (missing title)`);
      skipped++;
      await delay(1000);
      continue;
    }

    // Skip past events
    const startDate = parseDateText(event.dateText);
    if (startDate) {
      const eventDate = new Date(startDate);
      if (eventDate < new Date()) {
        console.log(`  ⏭️  Skipped (past event)`);
        skipped++;
        await delay(1000);
        continue;
      }
    }

    // Scrape detail page for full description and images
    const eventDetails = await scrapeEventDetails(browser, event);

    console.log(`  💰 Price: ${eventDetails.price}`);
    if (eventDetails.ageRange) {
      console.log(`  👶 Age range: ${eventDetails.ageRange}`);
    }
    console.log(`  📷 Image: ${eventDetails.image ? 'Found' : 'None'}`);

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

    // Rate limiting - 2 seconds between events (detail page scraping is slower)
    await delay(2000);
  }

  // Close browser
  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${created}`);
  console.log(`♻️  Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total processed: ${allEvents.length}`);
  console.log('='.repeat(50));
}

// Run the import
importEvents().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
