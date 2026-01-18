import type { Listing } from './supabase';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in miles, rounded to 1 decimal place
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return Math.round(R * c * 10) / 10;
}

/**
 * Filter events: today and future (in local time), within maxDistance, sorted by date then distance
 */
export function filterEvents(
  listings: Listing[],
  maxDistanceMiles: number = 50
): Listing[] {
  // Get start of today in LOCAL time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return listings
    .filter((l) => l.type === 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => {
      if (!l.start_date) return false;
      // Get the event date and normalize to start of day in LOCAL time
      const eventDate = new Date(l.start_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .filter((l) => (l.distance || 0) <= maxDistanceMiles)
    .sort((a, b) => {
      // Sort by date first
      const dateA = new Date(a.start_date!).getTime();
      const dateB = new Date(b.start_date!).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // Then by distance within same date
      return (a.distance || 0) - (b.distance || 0);
    });
}

/**
 * Filter listings by place_type, sorted by distance (closest first)
 * Excludes past events (listings with start_date before today in local time)
 */
export function filterByPlaceType(
  listings: Listing[],
  placeType: string
): Listing[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return listings
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.place_type?.toLowerCase() === placeType.toLowerCase())
    .filter((l) => {
      // Exclude past events (if it has a start_date and it's before today)
      if (l.start_date) {
        const eventDate = new Date(l.start_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }
      // Keep listings without start_date (activities, camps, etc.)
      return true;
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Get aggregated counts of listings by place_type, ordered by count descending
 * Excludes past events from counts
 */
export function getPlaceTypeCounts(
  listings: Listing[]
): Array<{ type: string; count: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();

  for (const listing of listings) {
    if (listing.place_type && listing.latitude && listing.longitude) {
      // Skip past events (before today in local time)
      if (listing.start_date) {
        const eventDate = new Date(listing.start_date);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          continue;
        }
      }
      counts.set(listing.place_type, (counts.get(listing.place_type) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get count of today's and future events within max distance
 */
export function getEventCount(
  listings: Listing[],
  maxDistanceMiles: number = 50
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return listings.filter((l) => {
    if (l.type !== 'Event' || !l.latitude || !l.longitude || !l.start_date) {
      return false;
    }
    const eventDate = new Date(l.start_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today && (l.distance || 0) <= maxDistanceMiles;
  }).length;
}

/**
 * Add distance to listings based on user location
 */
export function addDistanceToListings(
  listings: Listing[],
  userLat: number,
  userLng: number
): Listing[] {
  return listings.map((listing) => {
    let distance = 0;
    if (listing.latitude && listing.longitude) {
      distance = calculateDistance(
        userLat,
        userLng,
        listing.latitude,
        listing.longitude
      );
    }
    return { ...listing, distance };
  });
}

// ============================================
// Collection Filter Functions
// ============================================

/**
 * Upcoming events: type=Event, ≤30mi, today and future, earliest first, prioritize featured
 */
export function getUpcomingEvents(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return listings
    .filter((l) => l.type === 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => {
      if (!l.start_date) return false;
      const eventDate = new Date(l.start_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .filter((l) => (l.distance || 0) <= 30)
    .sort((a, b) => {
      // Prioritize featured (scout_pick) first
      if (a.scout_pick && !b.scout_pick) return -1;
      if (!a.scout_pick && b.scout_pick) return 1;
      // Then sort by date
      const dateA = new Date(a.start_date!).getTime();
      const dateB = new Date(b.start_date!).getTime();
      return dateA - dateB;
    })
    .slice(0, maxCount);
}

/**
 * For advanced planners: type=Event, ≤50mi, start_date > 6 days from now, featured only
 */
export function getAdvancedPlannerEvents(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  const sixDaysFromNow = new Date();
  sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

  return listings
    .filter((l) => l.type === 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.start_date && new Date(l.start_date) > sixDaysFromNow)
    .filter((l) => (l.distance || 0) <= 50)
    .filter((l) => l.scout_pick)
    .sort((a, b) => {
      const dateA = new Date(a.start_date!).getTime();
      const dateB = new Date(b.start_date!).getTime();
      return dateA - dateB;
    })
    .slice(0, maxCount);
}

/**
 * Get effective rating - prefer Google Places rating, fall back to listing rating
 */
function getEffectiveRating(listing: Listing): number {
  return listing.google_place_details?.rating ?? listing.rating ?? 0;
}

/**
 * Get review count from Google Places data
 */
function getReviewCount(listing: Listing): number {
  return listing.google_place_details?.userRatingsTotal ?? listing.reviews ?? 0;
}

const MIN_REVIEWS_FOR_RANKING = 5;

/**
 * Most loved playgrounds: place_type=Playground, ≤30mi, rating high→low, min 5 reviews, excludes events
 */
export function getMostLovedPlaygrounds(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  return listings
    .filter((l) => l.type !== 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.place_type?.toLowerCase() === 'playground')
    .filter((l) => (l.distance || 0) <= 30)
    .filter((l) => getReviewCount(l) >= MIN_REVIEWS_FOR_RANKING)
    .sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a))
    .slice(0, maxCount);
}

/**
 * Rainy day adventures: place_type=Indoor play, sorted by distance, excludes events
 */
export function getRainyDayAdventures(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  return listings
    .filter((l) => l.type !== 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.place_type?.toLowerCase() === 'indoor play')
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, maxCount);
}

/**
 * Favorite parks: place_type=Park, ≤30mi, rating high→low, min 5 reviews, excludes events
 */
export function getFavoriteParks(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  return listings
    .filter((l) => l.type !== 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.place_type?.toLowerCase() === 'park')
    .filter((l) => (l.distance || 0) <= 30)
    .filter((l) => getReviewCount(l) >= MIN_REVIEWS_FOR_RANKING)
    .sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a))
    .slice(0, maxCount);
}

/**
 * Top farmers markets: place_type=Farmers Market, ≤20mi, 4+ stars, >5 reviews, rating high→low
 */
export function getTopFarmersMarkets(
  listings: Listing[],
  maxCount: number = 6
): Listing[] {
  return listings
    .filter((l) => l.type !== 'Event')
    .filter((l) => l.latitude && l.longitude)
    .filter((l) => l.place_type?.toLowerCase() === 'farmers market')
    .filter((l) => (l.distance || 0) <= 20)
    .filter((l) => getEffectiveRating(l) >= 4)
    .filter((l) => getReviewCount(l) > 5)
    .sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a))
    .slice(0, maxCount);
}
