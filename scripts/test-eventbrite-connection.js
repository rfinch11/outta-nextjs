require('dotenv').config({ path: '.env.local' });

async function testEventbriteConnection() {
  const token = process.env.EVENTBRITE_API_TOKEN;

  if (!token || token === 'YOUR_EVENTBRITE_TOKEN_HERE') {
    console.error('❌ EVENTBRITE_API_TOKEN not set in .env.local');
    process.exit(1);
  }

  console.log('🔑 Testing Eventbrite API connection...\n');

  try {
    // Test 1: Get user info to verify token
    const userResponse = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ API Authentication Failed');
      console.error('Status:', userResponse.status);
      console.error('Error:', errorText);
      process.exit(1);
    }

    const userData = await userResponse.json();
    console.log('✅ Authentication successful!');
    console.log(`   User: ${userData.name || userData.emails?.[0]?.email || 'Unknown'}`);
    console.log('');

    // Test 2: Search for events in SF Bay Area
    console.log('🔍 Testing event search for SF Bay Area kid events...\n');

    const searchParams = new URLSearchParams({
      'location.latitude': '37.7749',  // San Francisco coordinates
      'location.longitude': '-122.4194',
      'location.within': '50mi',  // 50 mile radius to cover Bay Area
      'q': 'kids',  // Search keyword
      'expand': 'venue,organizer',
      'start_date.range_start': new Date().toISOString(),
      'page_size': '5'  // Just test with 5 events
    });

    const searchResponse = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Event search failed');
      console.error('Status:', searchResponse.status);
      console.error('Error:', errorText);
      process.exit(1);
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Found ${searchData.pagination.object_count} total events in SF Bay Area`);
    console.log(`   Showing ${searchData.events.length} sample events:\n`);

    searchData.events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name.text}`);
      console.log(`      Date: ${new Date(event.start.local).toLocaleString()}`);
      console.log(`      Location: ${event.venue?.name || 'TBD'}, ${event.venue?.address?.city || 'N/A'}`);
      console.log(`      URL: ${event.url}`);
      console.log('');
    });

    console.log('✅ All tests passed! Eventbrite API is ready to use.');

  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
    process.exit(1);
  }
}

testEventbriteConnection();
