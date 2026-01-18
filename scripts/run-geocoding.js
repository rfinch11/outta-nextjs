require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function buildAddress(listing) {
  const parts = [];

  if (listing.street) {
    parts.push(listing.street);
  } else if (listing.location_name) {
    parts.push(listing.location_name);
  }

  if (listing.city) parts.push(listing.city);
  if (listing.state) parts.push(listing.state);
  if (listing.zip) parts.push(listing.zip);

  if (parts.length >= 2) {
    return parts.join(', ');
  }

  if (listing.location_name) {
    return listing.location_name;
  }

  return null;
}

async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return { success: true, latitude: lat, longitude: lng };
  }
  return { success: false, error: data.status };
}

async function run() {
  console.log('Fetching listings without coordinates...');

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, street, city, state, zip, location_name')
    .or('latitude.is.null,longitude.is.null')
    .limit(250);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const toGeocode = listings.filter(l => buildAddress(l) !== null);
  console.log(`Found ${toGeocode.length} listings to geocode\n`);

  let success = 0, failed = 0;

  for (const listing of toGeocode) {
    const address = buildAddress(listing);
    process.stdout.write(`Geocoding: ${listing.title.substring(0, 40).padEnd(40)}... `);

    const result = await geocodeAddress(address);

    if (result.success) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ latitude: result.latitude, longitude: result.longitude })
        .eq('id', listing.id);

      if (updateError) {
        console.log('UPDATE FAILED');
        failed++;
      } else {
        console.log('OK');
        success++;
      }
    } else {
      console.log(`FAILED: ${result.error}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

run();
