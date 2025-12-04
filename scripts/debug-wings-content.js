/**
 * Debug script to see ALL text content in Wings event
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');

const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';
const WINGS_UID = '14442173';

async function debugWingsContent() {
  console.log('🔍 Debugging Wings event content...\n');

  const url = `${EVENT_PAGE_BASE_URL}${WINGS_UID}`;
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('━'.repeat(80));
    console.log('CHECKING DIV ELEMENTS WITH TEXT:');
    console.log('━'.repeat(80));

    $('div').each((i, el) => {
      const $el = $(el);
      // Get direct text content (not nested)
      const text = $el.clone().children().remove().end().text().trim();

      if (text.length > 50) {
        console.log(`\n[DIV ${i + 1}]`);
        console.log(`Classes: ${$el.attr('class') || 'none'}`);
        console.log(`ID: ${$el.attr('id') || 'none'}`);
        console.log(`Text length: ${text.length}`);
        console.log(`Text: ${text.substring(0, 200)}`);
        console.log('-'.repeat(40));
      }
    });

    console.log('\n' + '━'.repeat(80));
    console.log('CHECKING SPAN ELEMENTS WITH TEXT:');
    console.log('━'.repeat(80));

    $('span').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();

      if (text.length > 50) {
        console.log(`\n[SPAN ${i + 1}]`);
        console.log(`Classes: ${$el.attr('class') || 'none'}`);
        console.log(`Text length: ${text.length}`);
        console.log(`Text: ${text.substring(0, 200)}`);
        console.log('-'.repeat(40));
      }
    });

    console.log('\n' + '━'.repeat(80));
    console.log('CHECKING JSON-LD FOR DESCRIPTION:');
    console.log('━'.repeat(80));

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html());
        console.log(`\n[JSON-LD ${i + 1}]`);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(`\n[JSON-LD ${i + 1}] - Parse error`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWingsContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
