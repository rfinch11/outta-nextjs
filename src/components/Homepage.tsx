'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import type { FilterState } from './FilterModal';
import ClickableCard from './ClickableCard';
import Footer from './Footer';
import Loader from './Loader';
import BentoMenu from './BentoMenu';
import FilterBar from './FilterBar';
import { getPlaceTypeCounts } from '@/lib/filterUtils';

// Dynamic imports for modals (code splitting)
const SearchModal = dynamic(() => import('./SearchModal'), {
  ssr: false,
});
const LocationModal = dynamic(() => import('./LocationModal'), {
  ssr: false,
});
const SubmitModal = dynamic(() => import('./SubmitModal'), {
  ssr: false,
});

type TabType = 'Event' | 'Activity' | 'Camp' | 'Restaurant';

const Homepage: React.FC = () => {
  const [activeTab] = useState<TabType>('Event');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(15);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);

  // Location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    zipCode: string;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    recommended: false,
    sortBy: activeTab === 'Event' ? 'date' : 'distance',
    dateQuick: null,
    distance: null,
    price: 'any',
    types: [],
    tags: [],
    rating: 'any',
  });

  // Search state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // FilterBar state
  const [placeTypeCounts, setPlaceTypeCounts] = useState<Array<{ type: string; count: number }>>([]);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
  };

  // Save location to state and localStorage
  const saveLocation = (lat: number, lng: number, zipCode: string) => {
    const location = { lat, lng, zipCode };
    setUserLocation(location);
    localStorage.setItem('userLocation', JSON.stringify(location));
  };

  // Get location from IP address
  const getIPLocation = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        const zipCode = data.postal || data.city || 'Unknown';

        console.log('Using IP-based location:', data.city, data.region);
        saveLocation(lat, lng, zipCode);
      } else {
        throw new Error('No location data from IP service');
      }
    } catch (error) {
      console.error('Error getting IP location:', error);
      // Final fallback to San Francisco (more central than Mountain View)
      const defaultLocation = { lat: 37.7749, lng: -122.4194, zipCode: '94102' };
      setUserLocation(defaultLocation);
    }
  }, []);

  // Load location on mount from localStorage or detect location
  useEffect(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const location = JSON.parse(stored);
        setUserLocation(location);
      } catch (e) {
        console.error('Error parsing stored location:', e);
        // Try IP geolocation if stored location is invalid
        getIPLocation();
      }
    } else {
      // First visit - try browser geolocation first, then IP fallback
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Reverse geocode to get zip code
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
              );
              const data = await response.json();
              const zipCode = data.address?.postcode || 'Unknown';
              saveLocation(lat, lng, zipCode);
            } catch (error) {
              console.error('Error reverse geocoding:', error);
              saveLocation(lat, lng, 'Unknown');
            }
          },
          (error) => {
            console.log('Browser location denied or unavailable:', error.message);
            // Fallback to IP-based geolocation
            getIPLocation();
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        // Geolocation not supported - use IP-based location
        getIPLocation();
      }
    }
  }, [getIPLocation]);

  // Fetch all listings once when component mounts and location is set
  useEffect(() => {
    if (userLocation) {
      fetchAllListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Update sort preference when tab changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sortBy: activeTab === 'Event' ? 'date' : 'distance',
    }));
  }, [activeTab]);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    if (allListings.length > 0) {
      applyFiltersAndSort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, filters, allListings]);

  // Fetch all listings from database once
  const fetchAllListings = async () => {
    setLoading(true);
    try {
      // Fetch ALL listings at once
      const query = supabase.from('listings').select('*');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Calculate distances for all listings
      const listingsWithDistance = data.map((listing) => {
        let distance = 0;
        if (listing.latitude && listing.longitude && userLocation) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude,
            listing.longitude
          );
        }
        return { ...listing, distance };
      });

      setAllListings(listingsWithDistance);

      // Calculate counts for FilterBar
      setPlaceTypeCounts(getPlaceTypeCounts(listingsWithDistance));

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Apply filters and sorting to all listings
  const applyFiltersAndSort = () => {
    const now = new Date();

    // Start with all listings, excluding those with null locations
    let filtered = allListings.filter((listing) => listing.latitude && listing.longitude);

    // Always filter by active tab
    filtered = filtered.filter((listing) => listing.type === activeTab);

    // Apply search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((listing) => {
        return (
          listing.title.toLowerCase().includes(query) ||
          listing.description?.toLowerCase().includes(query) ||
          listing.city?.toLowerCase().includes(query) ||
          listing.tags?.toLowerCase().includes(query) ||
          listing.place_type?.toLowerCase().includes(query) ||
          listing.organizer?.toLowerCase().includes(query)
        );
      });
    }

    // Filter out past events (only for Events tab, unless searching)
    if (activeTab === 'Event' && !searchQuery && !filters.dateQuick) {
      filtered = filtered.filter((listing) => {
        if (!listing.start_date) return false;
        return new Date(listing.start_date) >= now;
      });
    }

    // Apply scout pick filter
    if (filters.recommended) {
      filtered = filtered.filter((listing) => listing.scout_pick);
    }

    // Apply price filter
    if (filters.price === 'free') {
      filtered = filtered.filter((listing) => {
        if (!listing.price) return true;
        const priceStr = listing.price.toLowerCase();
        return priceStr.includes('free') || listing.price === '0';
      });
    } else if (filters.price === 'paid') {
      filtered = filtered.filter((listing) => {
        if (!listing.price) return false;
        const priceStr = listing.price.toLowerCase();
        return !priceStr.includes('free') && listing.price !== '0';
      });
    }

    // Apply rating filter
    if (filters.rating !== 'any') {
      const minRating = parseFloat(filters.rating.replace('+', ''));
      filtered = filtered.filter((listing) => listing.rating && listing.rating >= minRating);
    }

    // Apply date filter
    if (filters.dateQuick) {
      filtered = filtered.filter((listing) => {
        if (!listing.start_date) return false;
        const listingDate = new Date(listing.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate: Date;
        let endDate: Date;

        switch (filters.dateQuick) {
          case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'tomorrow':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() + 1);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'this_week':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'this_month':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          default:
            return true;
        }

        return listingDate >= startDate && listingDate <= endDate;
      });
    }

    // Apply place type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(
        (listing) => listing.place_type && filters.types.includes(listing.place_type)
      );
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((listing) => {
        if (!listing.tags) return false;
        const listingTags = listing.tags.split(',').map((tag: string) => tag.trim());
        return filters.tags.some((filterTag) => listingTags.includes(filterTag));
      });
    }

    // Apply distance filter
    if (filters.distance !== null) {
      filtered = filtered.filter((listing) => (listing.distance || 0) <= filters.distance!);
    }

    // Apply sorting
    if (filters.sortBy === 'distance') {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    }

    // Reset display count when filters change and show first 15
    setDisplayCount(15);
    setTotalFilteredCount(filtered.length);
    setDisplayedListings(filtered.slice(0, 15));
  };

  // Calculate if there are more results to show
  const hasMore = () => {
    return totalFilteredCount > displayCount;
  };

  const handleLoadMore = () => {
    // Simply show 15 more items from the already filtered results
    const newCount = displayCount + 15;
    setDisplayCount(newCount);

    // Get the current filtered results without re-filtering
    const now = new Date();
    let filtered = allListings.filter((listing) => listing.latitude && listing.longitude);

    filtered = filtered.filter((listing) => listing.type === activeTab);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((listing) => {
        return (
          listing.title.toLowerCase().includes(query) ||
          listing.description?.toLowerCase().includes(query) ||
          listing.city?.toLowerCase().includes(query) ||
          listing.tags?.toLowerCase().includes(query) ||
          listing.place_type?.toLowerCase().includes(query) ||
          listing.organizer?.toLowerCase().includes(query)
        );
      });
    }

    if (activeTab === 'Event' && !searchQuery && !filters.dateQuick) {
      filtered = filtered.filter((listing) => {
        if (!listing.start_date) return false;
        return new Date(listing.start_date) >= now;
      });
    }

    if (filters.recommended) {
      filtered = filtered.filter((listing) => listing.scout_pick);
    }

    if (filters.price === 'free') {
      filtered = filtered.filter((listing) => {
        if (!listing.price) return true;
        const priceStr = listing.price.toLowerCase();
        return priceStr.includes('free') || listing.price === '0';
      });
    } else if (filters.price === 'paid') {
      filtered = filtered.filter((listing) => {
        if (!listing.price) return false;
        const priceStr = listing.price.toLowerCase();
        return !priceStr.includes('free') && listing.price !== '0';
      });
    }

    if (filters.rating !== 'any') {
      const minRating = parseFloat(filters.rating.replace('+', ''));
      filtered = filtered.filter((listing) => listing.rating && listing.rating >= minRating);
    }

    if (filters.dateQuick) {
      filtered = filtered.filter((listing) => {
        if (!listing.start_date) return false;
        const listingDate = new Date(listing.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate: Date;
        let endDate: Date;

        switch (filters.dateQuick) {
          case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'tomorrow':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() + 1);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'this_week':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'this_month':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          default:
            return true;
        }

        return listingDate >= startDate && listingDate <= endDate;
      });
    }

    if (filters.types.length > 0) {
      filtered = filtered.filter(
        (listing) => listing.place_type && filters.types.includes(listing.place_type)
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((listing) => {
        if (!listing.tags) return false;
        const listingTags = listing.tags.split(',').map((tag: string) => tag.trim());
        return filters.tags.some((filterTag) => listingTags.includes(filterTag));
      });
    }

    if (filters.distance !== null) {
      filtered = filtered.filter((listing) => (listing.distance || 0) <= filters.distance!);
    }

    if (filters.sortBy === 'distance') {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    }

    setTotalFilteredCount(filtered.length);
    setDisplayedListings(filtered.slice(0, newCount));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-malibu-50 px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex-shrink-0 w-[120px]">
            <Image
              src="/Outta_logo.svg"
              alt="Outta"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          {/* Bento Menu */}
          <div className="bg-white rounded-[60px] shadow-sm p-2">
            <BentoMenu
              onLocationSet={saveLocation}
              onSubmitClick={() => setShowSubmitModal(true)}
              onSearch={(query) => {
                setSearchQuery(query);
                setFilters({ ...filters, search: query });
              }}
            />
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      {!loading && allListings.length > 0 && (
        <FilterBar
          placeTypeCounts={placeTypeCounts}
        />
      )}

      {/* Listings */}
      <div className="px-5 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-12">
              <Loader size={120} />
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No events found</div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                  {displayedListings.map((listing, index) => {
                    // Check if date has changed from previous card (for Events only)
                    let showDateDivider = false;
                    if (activeTab === 'Event' && index > 0 && listing.start_date) {
                      const prevListing = displayedListings[index - 1];
                      if (prevListing.start_date) {
                        const currentDate = new Date(listing.start_date).toDateString();
                        const prevDate = new Date(prevListing.start_date).toDateString();
                        showDateDivider = currentDate !== prevDate;
                      }
                    }

                    return (
                      <React.Fragment key={listing.airtable_id}>
                        {showDateDivider && listing.start_date && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-gray-300" />
                            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                              {new Date(listing.start_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <div className="flex-1 h-px bg-gray-300" />
                          </div>
                        )}
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
                        />
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Load More Button */}
              {hasMore() && (
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

      {/* Modals */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearch}
        currentQuery={searchQuery}
      />

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={saveLocation}
      />

      <SubmitModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
    </div>
  );
};

export default Homepage;
