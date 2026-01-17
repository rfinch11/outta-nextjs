'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { IoIosArrowBack } from 'react-icons/io';
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

  return (
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-malibu-50 px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Back Button */}
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-all"
            aria-label="Back to home"
          >
            <IoIosArrowBack size={24} />
          </Link>

          {/* Page Title */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-malibu-950">{getTitle()}</h1>
            {!loading && (
              <p className="text-sm text-black-500">
                {filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Listings */}
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
            <>
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
                          <span className="text-base text-malibu-950">
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
                        rating={listing.rating}
                      />
                    </React.Fragment>
                  );
                })}
              </div>

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
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FilterPageContent;
