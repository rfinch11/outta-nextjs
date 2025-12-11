const fs = require('fs');

async function exportEventbriteToCsv() {
  console.log('🔍 Fetching Eventbrite events...\n');

  try {
    // Fetch multiple pages to get more events
    const allEvents = [];
    const maxPages = 3; // Get first 3 pages (60 events)

    for (let page = 1; page <= maxPages; page++) {
      console.log(`📄 Fetching page ${page}...`);

      const searchUrl = `https://www.eventbrite.com/d/ca--san-francisco/kids--events/?page=${page}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch page ${page}`);
        break;
      }

      const html = await response.text();
      const match = html.match(/__SERVER_DATA__ = ({.*?});/s);

      if (!match) {
        console.error(`❌ Could not find data on page ${page}`);
        break;
      }

      const serverData = JSON.parse(match[1]);
      const events = serverData.search_data?.events?.results || [];

      console.log(`   Found ${events.length} events`);
      allEvents.push(...events);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Total events collected: ${allEvents.length}\n`);

    // Convert to CSV
    const csvRows = [];

    // Header
    csvRows.push([
      'Event Name',
      'Date',
      'Time',
      'Venue',
      'Address',
      'City',
      'State',
      'ZIP',
      'URL',
      'Image URL',
      'Summary',
      'Is Online',
      'Tags'
    ].join(','));

    // Data rows
    allEvents.forEach(event => {
      const venue = event.primary_venue || {};
      const address = venue.address || {};
      const tags = event.tags?.map(t => t.display_name).join('; ') || '';

      csvRows.push([
        `"${(event.name || '').replace(/"/g, '""')}"`,
        event.start_date || '',
        event.start_time || '',
        `"${(venue.name || '').replace(/"/g, '""')}"`,
        `"${(address.address_1 || '').replace(/"/g, '""')}"`,
        address.city || '',
        address.region || '',
        address.postal_code || '',
        event.url || '',
        event.image?.url || '',
        `"${(event.summary || '').replace(/"/g, '""')}"`,
        event.is_online_event ? 'Yes' : 'No',
        `"${tags.replace(/"/g, '""')}"`
      ].join(','));
    });

    const csv = csvRows.join('\n');
    const outputPath = '/tmp/eventbrite-sf-kids-events.csv';

    fs.writeFileSync(outputPath, csv);

    console.log(`✅ CSV exported to: ${outputPath}`);
    console.log(`📊 Total events: ${allEvents.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

exportEventbriteToCsv();
