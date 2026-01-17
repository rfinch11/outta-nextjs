/**
 * Google Places API utilities for fetching place photos
 */

/**
 * Get the photo reference for a Google Place
 * This requires calling the Places API with the place_id
 */
export async function getPlacePhotoReference(placeId: string): Promise<string | null> {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error(
      'GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_API_KEY, or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not configured'
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.result?.photos?.[0]) {
      return null;
    }

    return data.result.photos[0].photo_reference;
  } catch (error) {
    console.error('Error fetching place photo reference:', error);
    return null;
  }
}

/**
 * Construct a Google Places Photo URL from a photo reference
 * Max dimensions: 1600x1600 for Basic/no API key, 4800x4800 for Premium
 */
export function getPlacePhotoUrl(photoReference: string, maxWidth: number = 800): string {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Get a direct photo URL for a place_id
 * This combines both steps: getting the photo reference and constructing the URL
 */
export async function getPlacePhotoUrlByPlaceId(
  placeId: string,
  maxWidth: number = 800
): Promise<string | null> {
  const photoReference = await getPlacePhotoReference(placeId);

  if (!photoReference) {
    return null;
  }

  return getPlacePhotoUrl(photoReference, maxWidth);
}
