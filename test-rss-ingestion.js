import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testRSSIngestion() {
  console.log('🧪 Testing RSS ingestion cron job...\n');
  console.log('   CRON_SECRET:', process.env.CRON_SECRET ? 'Found' : 'NOT FOUND');
  console.log('   Authorization header:', `Bearer ${process.env.CRON_SECRET?.substring(0, 10)}...`);

  try {
    const response = await fetch('https://www.outta.events/api/ingest-rss', {
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
      console.log('\n✅ RSS ingestion test completed successfully!');
    } else {
      console.log('\n❌ RSS ingestion test failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRSSIngestion();
