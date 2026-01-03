import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testUnsplashImages() {
  console.log('🧪 Testing Unsplash images cron job...\n');

  try {
    const response = await fetch('https://www.outta.events/api/fetch-unsplash-images', {
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
      console.log('\n✅ Unsplash images test completed successfully!');
    } else {
      console.log('\n❌ Unsplash images test failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUnsplashImages();
