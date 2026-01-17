import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedData, getListingsCacheKey } from '@/lib/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const type = searchParams.get('type') as 'Event' | 'Activity' | 'Camp' | null;
    const recommended = searchParams.get('recommended') === 'true';
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = parseInt(searchParams.get('offset') || '0');

    // User location for distance calculation (optional)
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    // Generate cache key
    const cacheKey = getListingsCacheKey({
      type: type || undefined,
      recommended: recommended ? 'true' : undefined,
      city: city || undefined,
      lat: userLat?.toString(),
      lng: userLng?.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });

    // Use cache
    const result = await getCachedData(cacheKey, async () => {
      let dbQuery = supabase.from('listings').select('*', { count: 'exact' });

      // Type filter
      if (type) {
        dbQuery = dbQuery.eq('type', type);
      }

      // Recommended filter
      if (recommended) {
        dbQuery = dbQuery.eq('recommended', true);
      }

      // City filter
      if (city) {
        dbQuery = dbQuery.eq('city', city);
      }

      // TODO: After running PostGIS migration, add distance filtering
      // if (userLat && userLng && maxDistance) {
      //   dbQuery = dbQuery.rpc('listings_within_distance', {
      //     lat: userLat,
      //     lng: userLng,
      //     distance_meters: maxDistance * 1609.34
      //   });
      // }

      // Sorting
      dbQuery = dbQuery
        .order('recommended', { ascending: false })
        .order('start_date', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        throw new Error(error.message);
      }

      // Calculate client-side distance if lat/lng provided
      // TODO: Replace with PostGIS distance calculation after migration
      const dataWithDistance = data?.map((listing) => {
        if (userLat && userLng && listing.latitude && listing.longitude) {
          const distance = calculateDistance(userLat, userLng, listing.latitude, listing.longitude);
          return { ...listing, distance };
        }
        return listing;
      });

      return {
        data: dataWithDistance,
        count,
        hasMore: count ? offset + limit < count : false,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Listings API unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Haversine formula for calculating distance between two points
// TODO: Remove after PostGIS migration (PostGIS is more accurate)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
