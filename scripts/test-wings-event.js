/**
 * Test script to check Wings event description
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');

const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';

// Wings event UID (from previous test)
const WINGS_UID = '14442173';

async function testWingsDescription() {
  console.log('🔍 Testing Wings event description extraction...\n');

  const url = `${EVENT_PAGE_BASE_URL}${WINGS_UID}`;
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Full description - try multiple strategies
    let description = null;

    // Strategy 1: Look for event-description class or similar container
    const descriptionEl = $('.event-description, .description, [class*="description"]').first();

    if (descriptionEl.length > 0) {
      console.log('✅ Found description container');

      // Collect all paragraphs within the description container
      const paragraphs = [];
      descriptionEl.find('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          paragraphs.push(text);
          console.log(`  - Paragraph ${i + 1}: ${text.substring(0, 80)}...`);
        }
      });

      // If no <p> tags, just use the text content
      if (paragraphs.length === 0) {
        description = descriptionEl.text().trim();
        console.log('  Using container text directly');
      } else {
        description = paragraphs.join(' ');
        console.log(`  Combined ${paragraphs.length} paragraphs`);
      }
    } else {
      console.log('❌ No description container found');
    }

    // Strategy 2: If still no description or too short, collect ALL substantial paragraphs from main content
    if (!description || description.length < 100) {
      console.log('\n🔍 Trying strategy 2: collecting all relevant paragraphs...');

      const paragraphs = [];

      // Look for main content area first
      const mainContent = $('main, .main-content, .event-content, .content').first();
      const searchScope = mainContent.length > 0 ? mainContent : $('body');

      console.log(`  Search scope: ${mainContent.length > 0 ? 'main content area' : 'body'}`);

      searchScope.find('p').each((i, el) => {
        const text = $(el).text().trim();

        // Include paragraphs that:
        // - Are substantial (> 40 chars)
        // - Contain event-related content (keywords or specific patterns)
        // - Or contain contact/location info
        if (text.length > 40) {
          const hasEventKeywords = text.match(/join|program|event|storytime|activity|designed|help|learn|create|provides|service|hours|contact|information|welcome/i);
          const hasContactInfo = text.match(/email|phone|call|@|contact|voicemail|\d{3}[-.)]\d{3}[-.)]\d{4}/i);
          const hasLocationInfo = text.match(/located|library|branch|room|building|address/i);

          if (hasEventKeywords || hasContactInfo || hasLocationInfo) {
            paragraphs.push(text);
            console.log(`  ✓ Paragraph ${paragraphs.length}: ${text.substring(0, 80)}...`);
          }
        }
      });

      // Combine paragraphs with space separator
      if (paragraphs.length > 0) {
        description = paragraphs.join(' ');
        console.log(`\n  Combined ${paragraphs.length} paragraphs`);
      }
    }

    console.log('\n' + '━'.repeat(80));
    console.log('📝 FINAL DESCRIPTION:');
    console.log('━'.repeat(80));
    console.log(description);
    console.log('━'.repeat(80));
    console.log(`\nLength: ${description ? description.length : 0} characters\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWingsDescription()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
