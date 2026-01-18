'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Drawer } from 'vaul';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { IoIosArrowBack } from 'react-icons/io';
import { LuMap, LuX, LuSlidersHorizontal, LuTag, LuUsers, LuClock3, LuArrowUpRight, LuCalendar } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import {
  addDistanceToListings,
  filterEvents,
  filterByPlaceType,
} from '@/lib/filterUtils';
import ClickableCard from './ClickableCard';
import Loader from './Loader';
import Footer from './Footer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { GoogleRating } from '@/components/place-details';
import type { PlaceOpeningHours } from '@/lib/googlePlaces';

// Helper component for inline open status badge
const OpenStatusBadge: React.FC<{ openingHours: PlaceOpeningHours }> = ({ openingHours }) => {
  const { weekdayText } = openingHours;

  const now = new Date();
  const dayIndex = now.getDay();
  const googleDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const todayHours = weekdayText[googleDayIndex];

  let isOpen = false;
  let statusText = 'Closed';

  if (todayHours && !todayHours.toLowerCase().includes('closed')) {
    if (todayHours.toLowerCase().includes('24 hours') || todayHours.toLowerCase().includes('open 24')) {
      isOpen = true;
      statusText = 'Open 24 hours';
    } else {
      const timeMatch = todayHours.match(
        /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i
      );

      if (timeMatch) {
        const [, openHour, openMin = '00', openPeriod, closeHour, closeMin = '00', closePeriod] = timeMatch;

        const parseTime = (hour: string, min: string, period: string) => {
          let h = parseInt(hour, 10);
          if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (period.toUpperCase() === 'AM' && h === 12) h = 0;
          return h * 60 + parseInt(min, 10);
        };

        const openTime = parseTime(openHour, openMin, openPeriod);
        const closeTime = parseTime(closeHour, closeMin, closePeriod);
        const currentTime = now.getHours() * 60 + now.getMinutes();

        isOpen = currentTime >= openTime && currentTime < closeTime;

        if (isOpen) {
          statusText = `Open · Closes ${closeHour}${closeMin !== '00' ? ':' + closeMin : ''} ${closePeriod}`;
        }
      }
    }
  }

  return isOpen ? (
    <span className="text-base text-emerald-600">{statusText}</span>
  ) : (
    <span className="text-base text-malibu-950/60">{statusText}</span>
  );
};

// Preview content component (needs to be separate to use hooks)
interface ListingPreviewProps {
  listing: Listing;
}

const ListingPreview: React.FC<ListingPreviewProps> = ({ listing }) => {
  // Use cached place details directly from the listing object
  const placeDetails = listing.google_place_details;

  const fullAddress = listing.street
    ? `${listing.street}, ${listing.city}, ${listing.state} ${listing.zip}`
    : null;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6">
      {/* Image */}
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4">
        <img
          src={listing.place_id ? `/api/place-photo?place_id=${listing.place_id}&width=400` : listing.image}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== listing.image) {
              target.src = listing.image;
            }
          }}
        />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-malibu-950 mb-2">{listing.title}</h3>

      {/* Google Rating */}
      {placeDetails?.rating && placeDetails?.userRatingsTotal && (
        <div className="mb-4">
          <GoogleRating
            rating={placeDetails.rating}
            reviewCount={placeDetails.userRatingsTotal}
          />
        </div>
      )}

      {/* Info Grid */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Date for Events */}
        {listing.type === 'Event' && listing.start_date && (
          <div className="flex items-center gap-3">
            <LuCalendar size={20} className="text-malibu-950/70 flex-shrink-0" />
            <span className="text-base text-malibu-950/90">
              {new Date(listing.start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Time for Events */}
        {listing.type === 'Event' && listing.start_date && (
          <div className="flex items-center gap-3">
            <LuClock3 size={20} className="text-malibu-950/70 flex-shrink-0" />
            <span className="text-base text-malibu-950/90">
              {new Date(listing.start_date).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}

        {/* Address */}
        {fullAddress ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 no-underline hover:opacity-70 transition-opacity"
          >
            <HiOutlineLocationMarker size={20} className="text-malibu-950/70 flex-shrink-0" />
            <span className="text-base text-malibu-950/90 truncate">{fullAddress}</span>
            <LuArrowUpRight size={16} className="text-malibu-950/70 flex-shrink-0 -ml-2" />
          </a>
        ) : listing.city && (
          <div className="flex items-center gap-3">
            <HiOutlineLocationMarker size={20} className="text-malibu-950/70 flex-shrink-0" />
            <span className="text-base text-malibu-950/90">{listing.city}</span>
          </div>
        )}

        {/* Open/Closed Status - for Activities only */}
        {listing.type !== 'Event' && placeDetails?.openingHours && placeDetails.openingHours.weekdayText.length > 0 && (
          <div className="flex items-center gap-3">
            <LuClock3 size={20} className="text-malibu-950/70 flex-shrink-0" />
            <OpenStatusBadge openingHours={placeDetails.openingHours} />
          </div>
        )}

        {/* Price */}
        {listing.price && (
          <div className="flex items-center gap-3">
            <LuTag size={20} className="text-emerald-600 flex-shrink-0" />
            <span className="text-base text-emerald-600 font-semibold">{listing.price}</span>
          </div>
        )}

        {/* Age Range */}
        {listing.age_range && (
          <div className="flex items-center gap-3">
            <LuUsers size={20} className="text-malibu-950/70 flex-shrink-0" />
            <span className="text-base text-malibu-950/90">{listing.age_range}</span>
          </div>
        )}
      </div>

      {/* View Details Button */}
      <Link
        href={`/listings/${listing.airtable_id}`}
        className="block w-full py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold text-center transition-colors hover:bg-malibu-900 no-underline"
      >
        View Details
      </Link>
    </div>
  );
};

interface FilterPageContentProps {
  filterType: string;
}

const FilterPageContent: React.FC<FilterPageContentProps> = ({ filterType }) => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(15);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [minDistanceFilter, setMinDistanceFilter] = useState<number>(0);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number>(50);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [priceFilter, setPriceFilter] = useState<string>('all');

  const isEventsPage = filterType === 'events';
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const isMediumScreen = useMediaQuery('(min-width: 768px)');

  // Check if any filters are active (not at default values)
  const hasActiveFilters =
    dateFilter !== 'all' ||
    minDistanceFilter !== 0 ||
    maxDistanceFilter !== 50 ||
    ratingFilter !== 0 ||
    priceFilter !== 'all';

  // Calculate histogram data for distance distribution (respects other active filters)
  const distanceHistogram = useMemo(() => {
    // Get the relevant listings based on filter type
    let relevantListings = isEventsPage
      ? allListings.filter((l) => l.type === 'Event')
      : allListings.filter((l) => l.place_type === filterType);

    // For events, apply date filter
    if (isEventsPage && dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      const thisSaturday = new Date(today);
      thisSaturday.setDate(thisSaturday.getDate() + (6 - thisSaturday.getDay()));
      const thisSunday = new Date(thisSaturday);
      thisSunday.setDate(thisSunday.getDate() + 1);
      const afterWeekend = new Date(thisSunday);
      afterWeekend.setDate(afterWeekend.getDate() + 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      relevantListings = relevantListings.filter((listing) => {
        if (!listing.start_date) return false;
        const eventDate = new Date(listing.start_date);
        switch (dateFilter) {
          case 'today':
            return eventDate >= today && eventDate < tomorrow;
          case 'tomorrow':
            return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
          case 'this-week':
            return eventDate >= today && eventDate < endOfWeek;
          case 'this-weekend':
            return eventDate >= thisSaturday && eventDate < afterWeekend;
          case 'this-month':
            return eventDate >= today && eventDate < endOfMonth;
          default:
            return true;
        }
      });
    }

    // For non-events, apply rating filter
    if (!isEventsPage && ratingFilter > 0) {
      relevantListings = relevantListings.filter((listing) => {
        return (listing.rating || 0) >= ratingFilter;
      });
    }

    // Create 20 buckets from 0 to 100 miles (5 miles each)
    const buckets = Array(20).fill(0);
    const bucketSize = 5;

    relevantListings.forEach((listing) => {
      const distance = listing.distance || 0;
      const bucketIndex = Math.min(Math.floor(distance / bucketSize), 19);
      buckets[bucketIndex]++;
    });

    // Find max for normalization
    const maxCount = Math.max(...buckets, 1);

    return buckets.map((count) => ({
      count,
      height: (count / maxCount) * 100,
    }));
  }, [allListings, filterType, isEventsPage, dateFilter, ratingFilter]);

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Get location from IP address
  const getIPLocation = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude };
      }
      throw new Error('No location data from IP service');
    } catch (error) {
      console.error('Error getting IP location:', error);
      // Fallback to San Francisco
      return { lat: 37.7749, lng: -122.4194 };
    }
  }, []);

  // Load location on mount
  useEffect(() => {
    const loadLocation = async () => {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        try {
          const location = JSON.parse(stored);
          setUserLocation({ lat: location.lat, lng: location.lng });
          return;
        } catch (e) {
          console.error('Error parsing stored location:', e);
        }
      }

      // Try browser geolocation, fallback to IP
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          async () => {
            const loc = await getIPLocation();
            setUserLocation(loc);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
      } else {
        const loc = await getIPLocation();
        setUserLocation(loc);
      }
    };

    loadLocation();
  }, [getIPLocation]);

  // Fetch listings when location is available
  useEffect(() => {
    if (!userLocation) return;

    const fetchListings = async () => {
      setLoading(true);
      try {
        // Fetch all listings in batches to bypass 1000 row limit
        const pageSize = 1000;
        let allData: Listing[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const { data: pageData, error: pageError } = await supabase
            .from('listings')
            .select('*')
            .or('hidden.is.null,hidden.eq.false')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (pageError) {
            console.error('Error fetching listings:', pageError);
            setLoading(false);
            return;
          }

          if (pageData && pageData.length > 0) {
            allData = [...allData, ...pageData];
            page++;
            hasMore = pageData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        if (allData.length === 0) {
          setLoading(false);
          return;
        }

        // Add distance to all listings
        const listingsWithDistance = addDistanceToListings(
          allData,
          userLocation.lat,
          userLocation.lng
        );

        setAllListings(listingsWithDistance);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchListings();
  }, [userLocation]);

  // Apply filtering when listings or filterType or filter states change
  useEffect(() => {
    if (allListings.length === 0) return;

    let filtered: Listing[];

    if (filterType === 'events') {
      // Events: future only, sorted by date then distance
      filtered = filterEvents(allListings, maxDistanceFilter);

      // Apply min distance filter
      filtered = filtered.filter((listing) => {
        return (listing.distance || 0) >= minDistanceFilter;
      });

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        // Get end of week (Sunday)
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

        // Get weekend (Saturday and Sunday)
        const thisSaturday = new Date(today);
        thisSaturday.setDate(thisSaturday.getDate() + (6 - thisSaturday.getDay()));
        const thisSunday = new Date(thisSaturday);
        thisSunday.setDate(thisSunday.getDate() + 1);
        const afterWeekend = new Date(thisSunday);
        afterWeekend.setDate(afterWeekend.getDate() + 1);

        // Get end of month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        filtered = filtered.filter((listing) => {
          if (!listing.start_date) return false;
          const eventDate = new Date(listing.start_date);

          switch (dateFilter) {
            case 'today':
              return eventDate >= today && eventDate < tomorrow;
            case 'tomorrow':
              return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
            case 'this-week':
              return eventDate >= today && eventDate < endOfWeek;
            case 'this-weekend':
              return eventDate >= thisSaturday && eventDate < afterWeekend;
            case 'this-month':
              return eventDate >= today && eventDate < endOfMonth;
            default:
              return true;
          }
        });
      }
    } else {
      // Place type: sorted by distance
      filtered = filterByPlaceType(allListings, filterType);

      // Apply distance filter (min and max)
      filtered = filtered.filter((listing) => {
        const distance = listing.distance || 0;
        return distance >= minDistanceFilter && distance <= maxDistanceFilter;
      });

      // Apply rating filter
      if (ratingFilter > 0) {
        filtered = filtered.filter((listing) => {
          return (listing.rating || 0) >= ratingFilter;
        });
      }
    }

    // Apply price filter (both events and non-events)
    if (priceFilter !== 'all') {
      filtered = filtered.filter((listing) => {
        const price = listing.price?.toLowerCase() || '';
        if (priceFilter === 'free') {
          return price === 'free' || price === '';
        } else if (priceFilter === 'paid') {
          return price !== 'free' && price !== '';
        }
        return true;
      });
    }

    setFilteredListings(filtered);
    setDisplayCount(15);
  }, [allListings, filterType, dateFilter, minDistanceFilter, maxDistanceFilter, ratingFilter, priceFilter]);

  const hasMore = filteredListings.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 15);
  };

  // Get display title
  const getTitle = () => {
    if (filterType === 'events') return 'Events';
    return filterType;
  };

  // Filter listings with valid coordinates for map
  const mappableListings = filteredListings.filter(
    (listing) => listing.latitude && listing.longitude
  );

  // Get map center
  const getMapCenter = useCallback(() => {
    if (userLocation) {
      return userLocation;
    }
    if (mappableListings.length > 0) {
      const avgLat =
        mappableListings.reduce((sum, l) => sum + (l.latitude || 0), 0) /
        mappableListings.length;
      const avgLng =
        mappableListings.reduce((sum, l) => sum + (l.longitude || 0), 0) /
        mappableListings.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 37.7749, lng: -122.4194 }; // Default to SF
  }, [userLocation, mappableListings]);

  // Handle map load
  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      // Fit bounds to show all markers
      if (mappableListings.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        mappableListings.forEach((listing) => {
          if (listing.latitude && listing.longitude) {
            bounds.extend({ lat: listing.latitude, lng: listing.longitude });
          }
        });
        mapInstance.fitBounds(bounds, 50);
      }
    },
    [mappableListings]
  );

  // Handle marker click
  const handleMarkerClick = (listingId: string) => {
    setSelectedListingId(listingId);

    // On md/lg screens, open the preview drawer
    if (isMediumScreen) {
      setPreviewDrawerOpen(true);
      return;
    }

    // On mobile, scroll carousel to center the selected card
    if (carouselRef.current) {
      const index = mappableListings.findIndex((l) => l.airtable_id === listingId);
      if (index !== -1) {
        const cardWidth = 300 + 12; // card width + gap
        const containerWidth = carouselRef.current.offsetWidth;
        const scrollPosition = index * cardWidth - (containerWidth - 300) / 2;
        carouselRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  // Handle carousel scroll to sync with map
  const handleCarouselScroll = () => {
    if (!carouselRef.current || !map) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const containerWidth = carouselRef.current.offsetWidth;
    const cardWidth = 300 + 12;
    // Calculate which card is centered
    const centerOffset = (containerWidth - 300) / 2;
    const index = Math.round((scrollLeft + centerOffset) / cardWidth);
    const listing = mappableListings[index];
    if (listing && listing.airtable_id !== selectedListingId) {
      setSelectedListingId(listing.airtable_id);
      // Pan map to the marker
      if (listing.latitude && listing.longitude) {
        map.panTo({ lat: listing.latitude, lng: listing.longitude });
      }
    }
  };

  // Select first listing when drawer opens
  useEffect(() => {
    if (mapDrawerOpen && mappableListings.length > 0 && !selectedListingId) {
      setSelectedListingId(mappableListings[0].airtable_id);
    }
  }, [mapDrawerOpen, mappableListings, selectedListingId]);

  return (
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-malibu-50 px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Back Button */}
          <Link
            href="/"
            className="flex items-center justify-center transition-colors hover:opacity-70"
            aria-label="Back to home"
          >
            <IoIosArrowBack size={24} className="text-malibu-950" />
          </Link>

          {/* Page Title */}
          <h1 className="text-2xl font-bold text-malibu-950 flex-1">{getTitle()}</h1>

          {/* Filter Button */}
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center justify-center w-8 h-8 transition-colors hover:opacity-70"
            aria-label="Filter"
            type="button"
          >
            <LuSlidersHorizontal size={24} className={hasActiveFilters ? 'text-flamenco-500' : 'text-malibu-950'} />
          </button>

          {/* Map View Button - mobile only */}
          <button
            onClick={() => setMapDrawerOpen(true)}
            className="flex md:hidden items-center justify-center w-8 h-8 transition-colors hover:opacity-70"
            aria-label="View on map"
            type="button"
          >
            <LuMap size={24} className="text-malibu-950" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-5 pb-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-12">
              <Loader size={120} />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No {filterType === 'events' ? 'events' : 'listings'} found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Listings Column */}
              <div className="flex flex-col gap-1.5">
                {filteredListings.slice(0, displayCount).map((listing, index) => {
                  // For events, show date separators
                  let dateSeparator = null;
                  if (filterType === 'events' && listing.start_date) {
                    const listingDate = new Date(listing.start_date);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const isToday = listingDate.toDateString() === today.toDateString();
                    const isTomorrow = listingDate.toDateString() === tomorrow.toDateString();

                    // Check if this is the first item or date changed from previous
                    const showSeparator = index === 0 || (
                      filteredListings[index - 1]?.start_date &&
                      new Date(filteredListings[index - 1].start_date!).toDateString() !== listingDate.toDateString()
                    );

                    if (showSeparator) {
                      let dayLabel: string;
                      if (isToday) {
                        dayLabel = 'Today';
                      } else if (isTomorrow) {
                        dayLabel = 'Tomorrow';
                      } else {
                        dayLabel = listingDate.toLocaleDateString('en-US', { weekday: 'long' });
                      }

                      const dateLabel = listingDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                      });

                      dateSeparator = (
                        <div className="my-3 first:mt-0">
                          <span className="text-lg text-malibu-950">
                            <span className="font-bold">{dayLabel}</span>
                            {' '}
                            <span className="font-normal">{dateLabel}</span>
                          </span>
                        </div>
                      );
                    }
                  }

                  return (
                    <React.Fragment key={listing.airtable_id}>
                      {dateSeparator}
                      <ClickableCard
                        airtable_id={listing.airtable_id}
                        title={listing.title}
                        type={listing.type}
                        scout_pick={listing.scout_pick}
                        deal={listing.deal}
                        promoted={listing.promoted}
                        city={listing.city}
                        distance={listing.distance || 0}
                        image={listing.image}
                        place_id={listing.place_id}
                        start_date={listing.start_date}
                        place_type={listing.place_type}
                        description={listing.description}
                        organizer={listing.organizer}
                        rating={listing.rating}
                        price={listing.price}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleLoadMore}
                      className="w-full max-w-md px-4 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-900 border-none"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Map - md and lg only */}
              <div className="hidden md:block lg:col-span-2 sticky top-20 h-[calc(100vh-120px)]">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '12px' }}
                    center={getMapCenter()}
                    zoom={12}
                    onLoad={onMapLoad}
                    options={{
                      mapId: '1844186f958235f75c7e5215',
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {mappableListings.map((listing) => (
                      <Marker
                        key={listing.airtable_id}
                        position={{
                          lat: listing.latitude!,
                          lng: listing.longitude!,
                        }}
                        onClick={() => handleMarkerClick(listing.airtable_id)}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: selectedListingId === listing.airtable_id ? 12 : 8,
                          fillColor: '#fff407',
                          fillOpacity: 1,
                          strokeColor: '#000000',
                          strokeWeight: 1,
                        }}
                        zIndex={selectedListingId === listing.airtable_id ? 1000 : 1}
                      />
                    ))}
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black-50 rounded-xl">
                    <Loader size={60} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - mobile only when map is inline on larger screens */}
      <div className="md:hidden">
        <Footer />
      </div>

      {/* Map Drawer */}
      <Drawer.Root open={mapDrawerOpen} onOpenChange={setMapDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] h-[95dvh] max-h-[95dvh] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden">
            <Drawer.Title className="sr-only">Map View</Drawer.Title>
            <Drawer.Description className="sr-only">
              View {getTitle()} on a map
            </Drawer.Description>

            {/* Header with Close Button */}
            <div className="flex items-center justify-end px-5 pt-4 pb-2">
              <button
                onClick={() => setMapDrawerOpen(false)}
                className="flex items-center justify-center transition-colors hover:opacity-70"
                aria-label="Close map"
                type="button"
              >
                <LuX size={24} className="text-malibu-950" />
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative px-4 pb-2 pt-2">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '12px' }}
                  center={getMapCenter()}
                  zoom={12}
                  onLoad={onMapLoad}
                  options={{
                    mapId: '1844186f958235f75c7e5215',
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {mappableListings.map((listing) => (
                    <Marker
                      key={listing.airtable_id}
                      position={{
                        lat: listing.latitude!,
                        lng: listing.longitude!,
                      }}
                      onClick={() => handleMarkerClick(listing.airtable_id)}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: selectedListingId === listing.airtable_id ? 12 : 8,
                        fillColor: '#fff407',
                        fillOpacity: 1,
                        strokeColor: '#000000',
                        strokeWeight: 1,
                      }}
                      zIndex={selectedListingId === listing.airtable_id ? 1000 : 1}
                    />
                  ))}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black-50">
                  <Loader size={60} />
                </div>
              )}
            </div>

            {/* Card Carousel */}
            <div className="bg-white pt-4 pb-6">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2"
                style={{ paddingLeft: 'calc(50% - 150px)', paddingRight: 'calc(50% - 150px)' }}
              >
                {mappableListings.map((listing) => (
                  <div
                    key={listing.airtable_id}
                    className="flex-shrink-0 w-[300px] snap-center bg-white rounded-xl shadow-md"
                    onClick={() => handleMarkerClick(listing.airtable_id)}
                  >
                    <ClickableCard
                      airtable_id={listing.airtable_id}
                      title={listing.title}
                      type={listing.type}
                      scout_pick={listing.scout_pick}
                      deal={listing.deal}
                      promoted={listing.promoted}
                      city={listing.city}
                      distance={listing.distance || 0}
                      image={listing.image}
                      place_id={listing.place_id}
                      start_date={listing.start_date}
                      place_type={listing.place_type}
                      description={listing.description}
                      organizer={listing.organizer}
                      rating={listing.rating}
                      price={listing.price}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Filter Drawer/Modal */}
      <Drawer.Root open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <Drawer.Content
            className={
              isLargeScreen
                ? 'bg-white flex flex-col rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] outline-none overflow-hidden w-full max-w-md shadow-xl'
                : 'bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden'
            }
          >
            <Drawer.Title className="sr-only">Filters</Drawer.Title>
            <Drawer.Description className="sr-only">
              Filter {getTitle()} by {isEventsPage ? 'date' : 'distance and rating'}
            </Drawer.Description>

            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-5 pt-4 pb-4">
              <h2 className="text-xl font-bold text-malibu-950">Filters</h2>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex items-center justify-center transition-colors hover:opacity-70"
                aria-label="Close filters"
                type="button"
              >
                <LuX size={24} className="text-malibu-950" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="px-5 pb-6 flex flex-col gap-6">
              {/* Price Filter */}
              <div>
                <h3 className="text-base font-semibold text-malibu-950 mb-3">Price</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Any' },
                    { value: 'free', label: 'Free' },
                    { value: 'paid', label: 'Paid' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriceFilter(option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        priceFilter === option.value
                          ? 'bg-malibu-950 text-white'
                          : 'bg-malibu-50 text-malibu-950 hover:bg-malibu-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-malibu-950/10" />

              {/* Date Filter - Events only */}
              {isEventsPage && (
                <>
                  <div>
                    <h3 className="text-base font-semibold text-malibu-950 mb-3">Date</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'today', label: 'Today' },
                        { value: 'tomorrow', label: 'Tomorrow' },
                        { value: 'this-week', label: 'This Week' },
                        { value: 'this-weekend', label: 'This Weekend' },
                        { value: 'this-month', label: 'This Month' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setDateFilter(option.value)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                            dateFilter === option.value
                              ? 'bg-malibu-950 text-white'
                              : 'bg-malibu-50 text-malibu-950 hover:bg-malibu-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-malibu-950/10" />
                </>
              )}

              {/* Distance Filter - All pages */}
              <div>
                <h3 className="text-base font-semibold text-malibu-950 mb-3">Distance</h3>

                {/* Histogram with slider */}
                <div className="relative px-4">
                  {/* Histogram bars */}
                  <div className="flex items-end gap-[2px] h-20 mb-2">
                    {distanceHistogram.map((bucket, index) => {
                      const bucketStartMiles = index * 5;
                      const bucketEndMiles = (index + 1) * 5;
                      const isWithinFilter = bucketStartMiles >= minDistanceFilter && bucketEndMiles <= maxDistanceFilter;
                      return (
                        <div
                          key={index}
                          className="flex-1 rounded-t-sm transition-colors"
                          style={{
                            height: `${Math.max(bucket.height, 2)}%`,
                            backgroundColor: isWithinFilter ? '#06304b' : 'rgba(6, 48, 75, 0.2)',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Dual slider track and handles */}
                  <div className="relative h-8 flex items-center">
                    {/* Track background */}
                    <div className="absolute inset-x-0 h-[2px] bg-malibu-950/20 rounded-full" />

                    {/* Active track between handles */}
                    <div
                      className="absolute h-[2px] bg-malibu-950 rounded-full"
                      style={{
                        left: `${(minDistanceFilter / 100) * 100}%`,
                        width: `${((maxDistanceFilter - minDistanceFilter) / 100) * 100}%`,
                      }}
                    />

                    {/* Min range input - only interactive on left portion */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minDistanceFilter}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), maxDistanceFilter - 5);
                        setMinDistanceFilter(val);
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                      style={{
                        clipPath: `inset(0 ${100 - (minDistanceFilter + maxDistanceFilter) / 2}% 0 0)`,
                      }}
                    />

                    {/* Max range input - only interactive on right portion */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={maxDistanceFilter}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), minDistanceFilter + 5);
                        setMaxDistanceFilter(val);
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                      style={{
                        clipPath: `inset(0 0 0 ${(minDistanceFilter + maxDistanceFilter) / 2}%)`,
                      }}
                    />

                    {/* Min handle */}
                    <div
                      className="absolute w-7 h-7 bg-white rounded-full border border-malibu-950/20 shadow-lg pointer-events-none z-40"
                      style={{
                        left: `calc(${(minDistanceFilter / 100) * 100}% - 14px)`,
                      }}
                    />

                    {/* Max handle */}
                    <div
                      className="absolute w-7 h-7 bg-white rounded-full border border-malibu-950/20 shadow-lg pointer-events-none z-40"
                      style={{
                        left: `calc(${(maxDistanceFilter / 100) * 100}% - 14px)`,
                      }}
                    />
                  </div>
                </div>

                {/* Min and Max distance labels */}
                <div className="mt-4 flex justify-between">
                  <div>
                    <span className="text-sm text-malibu-950/70">Minimum</span>
                    <p className="text-lg font-medium text-malibu-950">{minDistanceFilter} mi</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-malibu-950/70">Maximum</span>
                    <p className="text-lg font-medium text-malibu-950">{maxDistanceFilter} mi</p>
                  </div>
                </div>
              </div>

              {/* Rating Filter - Non-events only */}
              {!isEventsPage && (
                <>
                  <div className="h-px bg-malibu-950/10" />
                  <div>
                  <h3 className="text-base font-semibold text-malibu-950 mb-3">Minimum Rating</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 0, label: 'Any' },
                      { value: 3, label: '3+' },
                      { value: 4, label: '4+' },
                      { value: 4.5, label: '4.5+' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setRatingFilter(option.value)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          ratingFilter === option.value
                            ? 'bg-malibu-950 text-white'
                            : 'bg-malibu-50 text-malibu-950 hover:bg-malibu-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setMinDistanceFilter(0);
                    setMaxDistanceFilter(50);
                    setRatingFilter(0);
                    setPriceFilter('all');
                  }}
                  className="flex-1 py-3 bg-transparent text-malibu-950 rounded-lg text-base font-semibold transition-colors hover:bg-malibu-950/5"
                >
                  Clear
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold transition-colors hover:bg-malibu-900"
                >
                  Show {filteredListings.length} {isEventsPage ? 'events' : 'activities'}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Preview Drawer - md and lg only */}
      <Drawer.Root
        open={previewDrawerOpen}
        onOpenChange={setPreviewDrawerOpen}
        direction="left"
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-r-2xl h-full w-[420px] fixed top-0 left-0 z-[70] outline-none overflow-hidden">
            <Drawer.Title className="sr-only">Listing Preview</Drawer.Title>
            <Drawer.Description className="sr-only">
              Preview of the selected listing
            </Drawer.Description>

            {/* Close Button */}
            <div className="flex items-center justify-end px-5 pt-4 pb-2">
              <button
                onClick={() => setPreviewDrawerOpen(false)}
                className="flex items-center justify-center transition-colors hover:opacity-70"
                aria-label="Close preview"
                type="button"
              >
                <LuX size={24} className="text-malibu-950" />
              </button>
            </div>

            {/* Preview Content */}
            {selectedListingId && (() => {
              const listing = filteredListings.find(l => l.airtable_id === selectedListingId);
              if (!listing) return null;
              return <ListingPreview key={listing.airtable_id} listing={listing} />;
            })()}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default FilterPageContent;
