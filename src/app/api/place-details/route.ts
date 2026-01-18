import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getPlaceDetails,
  getPlaceHoursOnly,
  PlaceDetails,
} from '@/lib/googlePlaces';

// Use service key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache TTLs in hours
const HOURS_CACHE_TTL = 48; // 48 hours for opening hours
const FULL_CACHE_TTL = 168; // 7 days for photos, rating, reviews

/**
 * API Route: /api/place-details
 *
 * Fetches Google Places details including photos, hours, rating, and reviews
 * Implements caching via Supabase to minimize API costs
 *
 * Query params:
 * - place_id: Google Place ID (required)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  try {
    // Check cache in Supabase
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('google_place_details, place_details_updated_at')
      .eq('place_id', placeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching cached data:', fetchError);
    }

    const cachedData = listing?.google_place_details as PlaceDetails | null;
    const updatedAt = listing?.place_details_updated_at;

    if (cachedData && updatedAt) {
      const hoursSinceUpdate =
        (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);

      const hoursStale = hoursSinceUpdate > HOURS_CACHE_TTL;
      const fullStale = hoursSinceUpdate > FULL_CACHE_TTL;

      if (!hoursStale && !fullStale) {
        // Cache is fully fresh
        return NextResponse.json(cachedData);
      }

      if (!fullStale) {
        // Only hours need refresh, keep photos/rating/reviews from cache
        const freshHours = await getPlaceHoursOnly(placeId);
        if (freshHours) {
          const updatedData = { ...cachedData, openingHours: freshHours };

          // Update cache with new hours
          await supabase
            .from('listings')
            .update({
              google_place_details: updatedData,
              place_details_updated_at: new Date().toISOString(),
            })
            .eq('place_id', placeId);

          return NextResponse.json(updatedData);
        }
        // If hours fetch failed, return cached data
        return NextResponse.json(cachedData);
      }
    }

    // Full refresh needed (cache miss or stale)
    const freshData = await getPlaceDetails(placeId);

    if (!freshData) {
      // If we have stale cached data, return it rather than failing
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
      return NextResponse.json(
        { error: 'Failed to fetch place details' },
        { status: 500 }
      );
    }

    // Update cache in Supabase
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        google_place_details: freshData,
        place_details_updated_at: new Date().toISOString(),
      })
      .eq('place_id', placeId);

    if (updateError) {
      console.error('Error updating cache:', updateError);
      // Still return the data even if cache update failed
    }

    return NextResponse.json(freshData);
  } catch (error) {
    console.error('Error in place-details route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
