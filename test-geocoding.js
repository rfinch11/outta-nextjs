import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGeocoding() {
  console.log('🧪 Testing geocoding cron job...\n');

  try {
    const response = await fetch('https://www.outta.events/api/geocode-listings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Geocoding test completed successfully!');
    } else {
      console.log('\n❌ Geocoding test failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGeocoding();
