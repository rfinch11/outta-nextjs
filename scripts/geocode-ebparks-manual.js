require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function buildAddress(listing) {
  const parts = [];
  if (listing.street) parts.push(listing.street);
  if (listing.city) parts.push(listing.city);
  if (listing.state) parts.push(listing.state);
  if (listing.zip) parts.push(listing.zip);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (listing.location_name) {
    const locationParts = [listing.location_name];
    if (listing.city) locationParts.push(listing.city);
    if (listing.state) locationParts.push(listing.state);
    return locationParts.join(', ');
  }

  return null;
}

async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      success: true,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address
    };
  }
  return { success: false, error: data.status };
}

(async () => {
  console.log('📍 Starting manual geocoding for East Bay Parks events...\n');

  // Get East Bay Parks events without coordinates
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, street, city, state, zip, location_name, latitude, longitude')
    .like('airtable_id', 'ebparks_%')
    .is('latitude', null)
    .limit(100);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${listings.length} East Bay Parks events without coordinates\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    const address = buildAddress(listing);
    if (!address) {
      console.log(`⚠️  No address for: ${listing.title}`);
      errorCount++;
      continue;
    }

    console.log(`📍 ${listing.title}`);
    console.log(`   Address: ${address}`);

    const result = await geocodeAddress(address);

    if (result.success) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          latitude: result.latitude,
          longitude: result.longitude
        })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`   ❌ Error updating: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${result.latitude}, ${result.longitude}`);
        successCount++;
      }
    } else {
      console.log(`   ❌ Geocoding failed: ${result.error}`);
      errorCount++;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Geocoded: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
})();
