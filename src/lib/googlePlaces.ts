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

/**
 * Types for Google Place Details
 */
export interface PlacePhoto {
  url: string;
  width: number;
  height: number;
}

export interface PlaceOpeningHours {
  isOpen: boolean | null;
  weekdayText: string[];
}

export interface PlaceReview {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
}

export interface PlaceDetails {
  photos: PlacePhoto[];
  openingHours: PlaceOpeningHours | null;
  rating: number | null;
  userRatingsTotal: number | null;
  reviews: PlaceReview[];
}

/**
 * Get detailed information for a Google Place including photos, hours, rating, and reviews
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
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
    const fields = 'photos,opening_hours,rating,user_ratings_total,reviews';
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return null;
    }

    const result = data.result;

    // Build photo URLs with pre-constructed URLs
    const photos: PlacePhoto[] = (result.photos || []).slice(0, 10).map(
      (photo: { photo_reference: string; width: number; height: number }) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`,
        width: photo.width,
        height: photo.height,
      })
    );

    // Parse opening hours
    const openingHours: PlaceOpeningHours | null = result.opening_hours
      ? {
          isOpen: result.opening_hours.open_now ?? null,
          weekdayText: result.opening_hours.weekday_text || [],
        }
      : null;

    // Parse reviews
    const reviews: PlaceReview[] = (result.reviews || []).slice(0, 5).map(
      (review: {
        author_name: string;
        rating: number;
        text: string;
        relative_time_description: string;
      }) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        relativeTimeDescription: review.relative_time_description,
      })
    );

    return {
      photos,
      openingHours,
      rating: result.rating ?? null,
      userRatingsTotal: result.user_ratings_total ?? null,
      reviews,
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Get only opening hours for a place (used for partial cache refresh)
 */
export async function getPlaceHoursOnly(
  placeId: string
): Promise<PlaceOpeningHours | null> {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.result?.opening_hours) {
      return null;
    }

    return {
      isOpen: data.result.opening_hours.open_now ?? null,
      weekdayText: data.result.opening_hours.weekday_text || [],
    };
  } catch (error) {
    console.error('Error fetching place hours:', error);
    return null;
  }
}
