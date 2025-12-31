import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

/**
 * Build address string from listing fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAddress(listing: any): string | null {
  const parts: string[] = [];

  // Add street if available
  if (listing.street) {
    parts.push(listing.street);
  }

  // Add city, state, zip
  if (listing.city) {
    parts.push(listing.city);
  }

  if (listing.state) {
    parts.push(listing.state);
  }

  if (listing.zip) {
    parts.push(listing.zip);
  }

  // If we have at least city or street, return the address
  if (parts.length > 0) {
    return parts.join(', ');
  }

  // Fallback to location_name if no address parts
  if (listing.location_name) {
    // Add city/state to location name for better geocoding
    const locationParts = [listing.location_name];
    if (listing.city) locationParts.push(listing.city);
    if (listing.state) locationParts.push(listing.state);
    return locationParts.join(', ');
  }

  return null;
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
async function geocodeAddress(address: string) {
  if (!address) {
    return { success: false, error: 'No address provided' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      return {
        success: true,
        latitude: lat,
        longitude: lng,
        formatted_address: result.formatted_address
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return { success: false, error: 'No results found' };
    } else {
      return { success: false, error: `Geocoding failed: ${data.status}` };
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Geocode a single listing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function geocodeListing(listing: any) {
  const address = buildAddress(listing);

  if (!address) {
    console.log(`   ⚠️  No address available for: ${listing.title}`);
    return { success: false, error: 'No address fields available' };
  }

  console.log(`   Geocoding: "${address}"`);

  const result = await geocodeAddress(address);

  if (result.success) {
    // Update the listing with coordinates
    const { error } = await supabase
      .from('listings')
      .update({
        latitude: result.latitude,
        longitude: result.longitude
      })
      .eq('id', listing.id);

    if (error) {
      console.error(`   ❌ Error updating listing: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`   ✅ Geocoded: ${result.latitude}, ${result.longitude}`);
    return {
      success: true,
      latitude: result.latitude,
      longitude: result.longitude,
      formatted_address: result.formatted_address,
      address_used: address
    };

  } else {
    console.log(`   ❌ Geocoding failed: ${result.error}`);
    return result;
  }
}

/**
 * API Route Handler for geocoding cron job
 */
export async function POST(request: NextRequest) {
  // Security: Check for cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('\n📍 Starting geocoding...');

  try {
    // Find all listings without coordinates but with address information
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, street, city, state, zip, location_name, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .order('id', { ascending: true })
      .limit(250); // Process 250 at a time to ensure we catch all

    if (error) {
      console.error('❌ Error fetching listings:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to only those with some address information
    const listingsToGeocode = listings.filter(listing => {
      const address = buildAddress(listing);
      return address !== null;
    });

    console.log(`   Found ${listings.length} listings without coordinates`);
    console.log(`   ${listingsToGeocode.length} have address information to geocode\n`);

    let successCount = 0;
    let errorCount = 0;
    const skippedCount = listings.length - listingsToGeocode.length;
    const results = [];

    // Process each listing
    for (const listing of listingsToGeocode) {
      console.log(`📍 Processing: ${listing.title}`);

      const result = await geocodeListing(listing);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      results.push({
        listingId: listing.id,
        title: listing.title,
        ...result
      });

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Geocoded: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped (no address): ${skippedCount}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: listings.length,
      geocoded: successCount,
      errors: errorCount,
      skipped: skippedCount,
      results
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
