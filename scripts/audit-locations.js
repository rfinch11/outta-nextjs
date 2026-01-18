/**
 * Audit script to analyze listings with missing location data
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  // Specifically look at EBRP events
  const { data, error } = await supabase
    .from('listings')
    .select('airtable_id, title, street, city, state, zip, latitude, longitude, location_name, website')
    .like('airtable_id', 'ebparks%')
    .limit(300);

  if (error) { console.log('Error:', error); return; }

  // Categorize by what's missing
  const noLatLng = data.filter(l => !l.latitude || !l.longitude);
  const noCity = data.filter(l => !l.city);
  const noStreet = data.filter(l => !l.street);
  const noLocationName = data.filter(l => !l.location_name);
  const hasAll = data.filter(l => l.latitude && l.longitude && l.city && l.location_name);

  console.log('=== EBRP EVENTS LOCATION ANALYSIS ===\n');
  console.log('Total EBRP events:', data.length);
  console.log('Has lat/lng:', data.length - noLatLng.length);
  console.log('Missing lat/lng:', noLatLng.length);
  console.log('Missing city:', noCity.length);
  console.log('Missing street:', noStreet.length, '(expected for parks)');
  console.log('Missing location_name:', noLocationName.length);
  console.log('Has all key fields:', hasAll.length);

  console.log('\n--- MISSING LAT/LNG (first 15) ---');
  noLatLng.slice(0, 15).forEach(l => {
    console.log('Title:', l.title);
    console.log('City:', l.city || 'null', '| Location:', l.location_name || 'null');
    console.log('Website:', l.website ? l.website.substring(0, 60) + '...' : 'null');
    console.log('---');
  });

  // Check unique location_names that are missing lat/lng
  console.log('\n--- UNIQUE LOCATIONS MISSING LAT/LNG ---');
  const missingLocations = {};
  noLatLng.forEach(l => {
    const key = (l.location_name || 'Unknown') + ' | ' + (l.city || 'Unknown');
    missingLocations[key] = (missingLocations[key] || 0) + 1;
  });
  Object.entries(missingLocations).sort((a,b) => b[1] - a[1]).forEach(([loc, count]) => {
    console.log(loc + ':', count);
  });
})();
