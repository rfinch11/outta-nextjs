require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEvents() {
  const now = new Date();

  // Get total events
  const { data: allEvents, error: allError } = await supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('type', 'Event');

  if (allError) {
    console.error('Error fetching all events:', allError);
    return;
  }

  // Count events with locations
  const withLocation = allEvents.filter(e => e.latitude && e.longitude);

  // Count future events
  const futureEvents = allEvents.filter(e => {
    if (!e.start_date) return false;
    return new Date(e.start_date) >= now;
  });

  // Count future events with location
  const futureWithLocation = futureEvents.filter(e => e.latitude && e.longitude);

  console.log('\n=== Event Statistics ===');
  console.log(`Total Events: ${allEvents.length}`);
  console.log(`Events with Location: ${withLocation.length}`);
  console.log(`Future Events (after ${now.toISOString()}): ${futureEvents.length}`);
  console.log(`Future Events with Location: ${futureWithLocation.length}`);

  // Show first few future events
  console.log('\n=== First 10 Future Events with Location ===');
  futureWithLocation.slice(0, 10).forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   Date: ${event.start_date}`);
    console.log(`   Location: ${event.city} (${event.latitude}, ${event.longitude})`);
  });

  // Check if there are events without dates
  const noDate = allEvents.filter(e => !e.start_date);
  console.log(`\n=== Events without start_date: ${noDate.length} ===`);
  if (noDate.length > 0) {
    noDate.slice(0, 5).forEach((event, i) => {
      console.log(`${i + 1}. ${event.title} (${event.city})`);
    });
  }
}

checkEvents();
