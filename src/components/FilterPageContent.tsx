'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Drawer } from 'vaul';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { IoIosArrowBack } from 'react-icons/io';
import { LuMap, LuX } from 'react-icons/lu';
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
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Apply filtering when listings or filterType changes
  useEffect(() => {
    if (allListings.length === 0) return;

    let filtered: Listing[];

    if (filterType === 'events') {
      // Events: future only, max 50mi, sorted by date then distance
      filtered = filterEvents(allListings, 50);
    } else {
      // Place type: sorted by distance
      filtered = filterByPlaceType(allListings, filterType);
    }

    setFilteredListings(filtered);
    setDisplayCount(15);
  }, [allListings, filterType]);

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

          {/* Map View Button - mobile only */}
          <button
            onClick={() => setMapDrawerOpen(true)}
            className="flex md:hidden items-center justify-center transition-colors hover:opacity-70"
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
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      className="w-full max-w-md px-4 py-4 bg-broom-400 border-2 border-malibu-950 rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#06304b] hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5"
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
    </div>
  );
};

export default FilterPageContent;
