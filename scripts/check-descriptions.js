/**
 * Check descriptions in Airtable for recently imported events
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const airtable = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

async function checkDescriptions() {
  console.log('📝 Checking descriptions for recently imported events...\n');

  try {
    // Get the 3 most recent Santa Cruz Library events
    const records = await airtable('Listings')
      .select({
        filterByFormula: `{Organizer} = 'Santa Cruz Public Libraries'`,
        maxRecords: 3,
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .firstPage();

    records.forEach((record, i) => {
      const title = record.get('Title');
      const description = record.get('Description');
      const website = record.get('Website');

      console.log('━'.repeat(80));
      console.log(`[${i + 1}] ${title}`);
      console.log('━'.repeat(80));
      console.log(`Website: ${website}`);
      console.log(`Description length: ${description ? description.length : 0} chars`);
      console.log(`\nDescription:\n${description || 'N/A'}`);
      console.log('\n');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDescriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
