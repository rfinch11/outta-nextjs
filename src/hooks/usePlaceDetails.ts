import { useState, useEffect, useRef } from 'react';
import type { PlaceDetails } from '@/lib/googlePlaces';

interface UsePlaceDetailsResult {
  data: PlaceDetails | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch Google Place details for a given place_id
 * Returns photos, opening hours, rating, and reviews
 *
 * @param placeId - Google Place ID (optional)
 * @returns { data, isLoading, error }
 */
export function usePlaceDetails(placeId: string | null | undefined): UsePlaceDetailsResult {
  const [data, setData] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to track if we've already fetched for this placeId
  const fetchedPlaceId = useRef<string | null>(null);

  useEffect(() => {
    // Don't fetch if no placeId or if we've already fetched for this placeId
    if (!placeId || fetchedPlaceId.current === placeId) {
      return;
    }

    // Capture placeId as string for use in async function
    const currentPlaceId = placeId;

    // Reset state for new placeId
    setData(null);
    setError(null);
    setIsLoading(true);
    fetchedPlaceId.current = currentPlaceId;

    const controller = new AbortController();

    async function fetchPlaceDetails() {
      try {
        const response = await fetch(
          `/api/place-details?place_id=${encodeURIComponent(currentPlaceId)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch place details: ${response.status}`);
        }

        const json = await response.json();

        // Check if the response is an error object
        if (json.error) {
          throw new Error(json.error);
        }

        setData(json);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, don't update state
          return;
        }
        console.error('Error fetching place details:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaceDetails();

    return () => {
      controller.abort();
    };
  }, [placeId]);

  return { data, isLoading, error };
}
