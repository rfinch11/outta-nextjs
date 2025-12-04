/**
 * Check a specific listing in Airtable by website URL
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

const WEBSITE_URL = 'https://santacruzpl.libnet.info/event/14401160';

async function checkListing() {
  console.log(`🔍 Checking listing: ${WEBSITE_URL}\n`);

  try {
    const records = await airtable('Listings')
      .select({
        filterByFormula: `{Website} = '${WEBSITE_URL}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      console.log('❌ No record found with this website URL');
      return;
    }

    const record = records[0];

    console.log('✅ Found record:');
    console.log(`ID: ${record.id}`);
    console.log(`Title: ${record.get('Title')}`);
    console.log(`Description: ${record.get('Description')}`);
    console.log(`Description length: ${record.get('Description')?.length || 0} chars`);
    console.log(`Organizer: ${record.get('Organizer')}`);
    console.log(`Website: ${record.get('Website')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkListing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
