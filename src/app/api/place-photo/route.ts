import { NextRequest, NextResponse } from 'next/server';
import { getPlacePhotoUrlByPlaceId } from '@/lib/googlePlaces';

/**
 * API Route: /api/place-photo
 *
 * Fetches Google Places photos using place_id
 * This proxies the request to hide the API key from the client
 *
 * Query params:
 * - place_id: Google Place ID
 * - width: Image width (default: 800, max: 1600)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');
  const width = parseInt(searchParams.get('width') || '800');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  if (width > 1600) {
    return NextResponse.json({ error: 'Max width is 1600' }, { status: 400 });
  }

  try {
    const photoUrl = await getPlacePhotoUrlByPlaceId(placeId, width);

    if (!photoUrl) {
      return NextResponse.json({ error: 'No photo found for this place' }, { status: 404 });
    }

    // Redirect to the Google Places photo URL
    // This way the browser loads the image directly from Google
    return NextResponse.redirect(photoUrl);
  } catch (error) {
    console.error('Error fetching place photo:', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
