import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PlaceDetails } from '@/lib/googlePlaces';

// Use service key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * API Route: /api/place-details
 *
 * Returns cached Google Places details from Supabase.
 * Does NOT call Google Places API - data must be manually refreshed via script.
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
    // Return cached data from Supabase only - no Google API calls
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('google_place_details, place_details_updated_at')
      .eq('place_id', placeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching cached data:', fetchError);
    }

    const cachedData = listing?.google_place_details as PlaceDetails | null;

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // No cached data available
    return NextResponse.json({ error: 'No cached data available' }, { status: 404 });
  } catch (error) {
    console.error('Error in place-details route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
