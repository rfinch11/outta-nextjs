const cheerio = require('cheerio');

async function testEventbriteScrape() {
  console.log('🔍 Testing Eventbrite JSON data extraction...\n');

  try {
    // Test search: Kid-friendly events in San Francisco
    const searchUrl = 'https://www.eventbrite.com/d/ca--san-francisco/kids--events/';

    console.log(`Fetching: ${searchUrl}\n`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Eventbrite page');
      console.error('Status:', response.status);
      process.exit(1);
    }

    const html = await response.text();
    console.log(`✅ Page fetched (${html.length} bytes)\n`);

    // Extract __SERVER_DATA__ JSON
    const match = html.match(/__SERVER_DATA__ = ({.*?});/s);

    if (!match) {
      console.error('❌ Could not find __SERVER_DATA__ in page');
      process.exit(1);
    }

    const serverData = JSON.parse(match[1]);
    const events = serverData.search_data?.events?.results || [];
    const pagination = serverData.search_data?.events?.pagination || {};

    console.log('✅ Successfully extracted event data!\n');
    console.log(`📊 Total events: ${pagination.object_count}`);
    console.log(`📄 Page ${pagination.page_number} of ${pagination.page_count}`);
    console.log(`📦 Events on this page: ${events.length}\n`);

    // Show first 5 events
    console.log('🎉 Sample events:\n');
    events.slice(0, 5).forEach((event, index) => {
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   📅 Date: ${event.start_date} at ${event.start_time}`);
      console.log(`   📍 Location: ${event.primary_venue?.name || 'TBD'}`);
      console.log(`   🏙️  City: ${event.primary_venue?.address?.city || 'N/A'}`);
      console.log(`   🔗 URL: ${event.url}`);
      console.log(`   🖼️  Image: ${event.image?.url || 'No image'}`);
      console.log(`   💰 Price: ${event.tickets_by || 'N/A'}`);

      // Check for kid-related tags
      const kidTags = event.tags?.filter(t =>
        t.display_name?.toLowerCase().includes('kid') ||
        t.display_name?.toLowerCase().includes('child') ||
        t.display_name?.toLowerCase().includes('family')
      );
      if (kidTags && kidTags.length > 0) {
        console.log(`   🏷️  Tags: ${kidTags.map(t => t.display_name).join(', ')}`);
      }
      console.log('');
    });

    console.log('\n✅ Success! We can scrape Eventbrite event data.');
    console.log('\n🎯 Next steps:');
    console.log('1. Create full scraper that handles pagination');
    console.log('2. Add filtering for Bay Area cities');
    console.log('3. Map data to Airtable schema');
    console.log('4. Add deduplication logic');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEventbriteScrape();
