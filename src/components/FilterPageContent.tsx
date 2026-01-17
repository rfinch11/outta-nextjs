'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Drawer } from 'vaul';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { IoIosArrowBack } from 'react-icons/io';
import { LuMap, LuX, LuSlidersHorizontal } from 'react-icons/lu';
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [minDistanceFilter, setMinDistanceFilter] = useState<number>(0);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number>(50);
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  const isEventsPage = filterType === 'events';
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

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

    setFilteredListings(filtered);
    setDisplayCount(15);
  }, [allListings, filterType, dateFilter, minDistanceFilter, maxDistanceFilter, ratingFilter]);

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
    // Scroll carousel to center the selected card
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
            <LuSlidersHorizontal size={24} className="text-malibu-950" />
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
                          scale: selectedListingId === listing.airtable_id ? 10 : 6,
                          fillColor: selectedListingId === listing.airtable_id ? '#efdb03' : '#feff43',
                          fillOpacity: 1,
                          strokeColor: '#06304b',
                          strokeWeight: 1.5,
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
          <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[95dvh] max-h-[95dvh] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden">
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
                        scale: selectedListingId === listing.airtable_id ? 10 : 6,
                        fillColor: selectedListingId === listing.airtable_id ? '#efdb03' : '#feff43',
                        fillOpacity: 1,
                        strokeColor: '#06304b',
                        strokeWeight: 1.5,
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
                : 'bg-white flex flex-col rounded-t-[10px] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden'
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
    </div>
  );
};

export default FilterPageContent;
