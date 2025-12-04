/**
 * Debug script to see HTML structure of Wings event
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');

const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';
const WINGS_UID = '14442173';

async function debugWingsHTML() {
  console.log('🔍 Debugging Wings event HTML structure...\n');

  const url = `${EVENT_PAGE_BASE_URL}${WINGS_UID}`;
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('━'.repeat(80));
    console.log('ALL PARAGRAPHS ON PAGE:');
    console.log('━'.repeat(80));

    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 0) {
        console.log(`\n[Paragraph ${i + 1}] (${text.length} chars):`);
        console.log(text);
        console.log('-'.repeat(40));
      }
    });

    console.log('\n' + '━'.repeat(80));
    console.log('CHECKING FOR MAIN CONTENT AREA:');
    console.log('━'.repeat(80));

    const mainContent = $('main, .main-content, .event-content, .content').first();
    console.log(`Main content found: ${mainContent.length > 0 ? 'YES' : 'NO'}`);

    if (mainContent.length > 0) {
      console.log(`Tag: ${mainContent.prop('tagName')}`);
      console.log(`Classes: ${mainContent.attr('class') || 'none'}`);
      console.log(`\nParagraphs in main content: ${mainContent.find('p').length}`);
    }

    console.log('\n' + '━'.repeat(80));
    console.log('CHECKING FOR DESCRIPTION CONTAINER:');
    console.log('━'.repeat(80));

    const descEl = $('.event-description, .description, [class*="description"]').first();
    console.log(`Description container found: ${descEl.length > 0 ? 'YES' : 'NO'}`);

    if (descEl.length > 0) {
      console.log(`Tag: ${descEl.prop('tagName')}`);
      console.log(`Classes: ${descEl.attr('class')}`);
      console.log(`Text: ${descEl.text().trim().substring(0, 200)}...`);
    }

    console.log('\n' + '━'.repeat(80));
    console.log('ALL ELEMENTS WITH "description" IN CLASS:');
    console.log('━'.repeat(80));

    $('[class*="description"]').each((i, el) => {
      const $el = $(el);
      console.log(`\n[${i + 1}] ${$el.prop('tagName')}.${$el.attr('class')}`);
      console.log(`Text: ${$el.text().trim().substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWingsHTML()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
