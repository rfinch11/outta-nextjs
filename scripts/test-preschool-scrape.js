/**
 * Test scraping Preschool Storytime event specifically
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');

const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';
const EVENT_UID = '14401160'; // Preschool Storytime

async function testScrape() {
  console.log('🔍 Testing Preschool Storytime scrape...\n');

  const url = `${EVENT_PAGE_BASE_URL}${EVENT_UID}`;
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

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
          console.log(`✓ Found description in JSON-LD: "${description}"\n`);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Strategy 2: Look for substantial paragraph elements (this is the main content)
    // Collect ALL paragraphs that look like event descriptions
    const paragraphs = [];

    console.log('━'.repeat(80));
    console.log('CHECKING PARAGRAPHS:');
    console.log('━'.repeat(80));

    $('p').each((i, el) => {
      const text = $(el).text().trim();

      // Include paragraphs that are substantial (> 50 chars)
      if (text.length > 50) {
        // Exclude navigation/UI text and metadata
        const isNavText = text.match(/sign up|newsletter|donate|volunteer|email us|suggest a purchase|we're open|today's hours|age group:|event type:/i);

        console.log(`\n[Paragraph ${i + 1}] (${text.length} chars)`);
        console.log(`Text: ${text.substring(0, 100)}...`);
        console.log(`Is nav text: ${isNavText ? 'YES (excluded)' : 'NO (included)'}`);

        if (!isNavText) {
          paragraphs.push(text);
        }
      }
    });

    // If we found substantial paragraphs, use them (joined with space)
    if (paragraphs.length > 0) {
      description = paragraphs.join(' ');
    }

    console.log('\n' + '━'.repeat(80));
    console.log('FINAL DESCRIPTION:');
    console.log('━'.repeat(80));
    console.log(`Length: ${description ? description.length : 0} chars`);
    console.log(`Text: ${description || 'NULL'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testScrape()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
