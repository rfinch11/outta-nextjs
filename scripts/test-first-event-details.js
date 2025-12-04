/**
 * Test script to get detailed info about first upcoming event
 */

require('dotenv').config({ path: '.env.local' });
const ICAL = require('ical.js');
const cheerio = require('cheerio');

const ICAL_FEED_URL = 'https://santacruzpl.libnet.info/feeds?data=eyJmZWVkVHlwZSI6ImljYWwiLCJmaWx0ZXJzIjp7ImxvY2F0aW9uIjpbImFsbCJdLCJhZ2VzIjpbIkZhbWlseSIsIkJhYnkgMC0yIHllYXJzIiwiS2lkcyAwLTMgeWVhcnMiLCJLaWRzIDMtNSB5ZWFycyIsIktpZHMgNi0xMSB5ZWFycnMiLCJUd2VlbnMgOC0xMiB5ZWFycyIsIlRlZW5zIDEyLTE4IHllYXJzIl0sInR5cGVzIjpbImFsbCJdLCJ0YWdzIjpbXSwidGVybSI6IiIsImRheXMiOjF9fQ';
const EVENT_PAGE_BASE_URL = 'https://santacruzpl.libnet.info/event/';

async function testFirstEvent() {
  console.log('📡 Fetching iCal feed...\n');

  const response = await fetch(ICAL_FEED_URL);
  const icalData = await response.text();

  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  console.log(`Total events: ${vevents.length}\n`);

  // Get first upcoming event
  const event = new ICAL.Event(vevents[0]);

  console.log('━'.repeat(80));
  console.log('FIRST EVENT INFO:');
  console.log('━'.repeat(80));
  console.log(`UID: ${event.uid}`);
  console.log(`Title: ${event.summary}`);
  console.log(`Start: ${event.startDate.toJSDate()}`);
  console.log(`Location: ${event.location}`);
  console.log(`URL: ${EVENT_PAGE_BASE_URL}${event.uid}`);
  console.log(`\niCal Description:\n${event.description}`);

  // Now scrape the page
  console.log('\n' + '━'.repeat(80));
  console.log('SCRAPING EVENT PAGE...');
  console.log('━'.repeat(80));

  const url = `${EVENT_PAGE_BASE_URL}${event.uid}`;
  const pageResponse = await fetch(url);
  const html = await pageResponse.text();
  const $ = cheerio.load(html);

  // Check for different content structures
  console.log('\nTitle (h2): ' + $('h2').first().text().trim());
  console.log('\nAll text in .content div:');
  console.log($('.content').first().text().trim().substring(0, 500));

  console.log('\n\nAll elements with substantial text (>100 chars):');
  $('*').each((i, el) => {
    const $el = $(el);
    const text = $el.clone().children().remove().end().text().trim();

    if (text.length > 100 && text.length < 1000) {
      console.log(`\n[${$el.prop('tagName')}.${$el.attr('class') || 'no-class'}]`);
      console.log(`Text length: ${text.length}`);
      console.log(`Text: ${text.substring(0, 300)}...`);
    }
  });
}

testFirstEvent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
