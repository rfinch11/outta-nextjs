/**
 * Debug Preschool Storytime event to see why description is short
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');

const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';
const EVENT_UID = '14401160'; // Preschool Storytime

async function debugEvent() {
  console.log('🔍 Debugging Preschool Storytime event...\n');

  const url = `${EVENT_PAGE_BASE_URL}${EVENT_UID}`;
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
      }
    });

    console.log('\n' + '━'.repeat(80));
    console.log('JSON-LD DATA:');
    console.log('━'.repeat(80));

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html());
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Parse error');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugEvent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
