/**
 * Check Google Places cache status for all listings
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  // Get counts
  const { count: totalWithPlaceId } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .not('place_id', 'is', null);

  const { count: totalWithDetails } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .not('google_place_details', 'is', null);

  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .or('hidden.is.null,hidden.eq.false');

  console.log('=== Google Places Data Status ===');
  console.log('Total visible listings:', totalListings);
  console.log('Listings with place_id:', totalWithPlaceId);
  console.log('Listings with cached google_place_details:', totalWithDetails);
  console.log('');
  console.log('MISSING cached data:', totalWithPlaceId - totalWithDetails);

  // Break down by place_type
  const { data: byType } = await supabase
    .from('listings')
    .select('place_type, place_id, google_place_details')
    .not('place_id', 'is', null);

  const stats = {};
  byType.forEach(l => {
    const type = l.place_type || 'Unknown';
    if (!stats[type]) stats[type] = { total: 0, cached: 0 };
    stats[type].total++;
    if (l.google_place_details) stats[type].cached++;
  });

  console.log('');
  console.log('=== By Place Type ===');
  Object.entries(stats)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([type, data]) => {
      const missing = data.total - data.cached;
      console.log(`${type}: ${data.cached}/${data.total} cached${missing > 0 ? ` (MISSING ${missing})` : ''}`);
    });
}

main().catch(console.error);
