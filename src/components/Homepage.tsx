'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LuSearch, LuMapPin, LuFilter, LuPlus } from 'react-icons/lu';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import type { FilterState } from './FilterModal';
import ClickableCard from './ClickableCard';
import Footer from './Footer';
import Loader from './Loader';

// Dynamic imports for modals (code splitting)
const FilterModal = dynamic(() => import('./FilterModal'), {
  ssr: false,
});
const SearchModal = dynamic(() => import('./SearchModal'), {
  ssr: false,
});
const LocationModal = dynamic(() => import('./LocationModal'), {
  ssr: false,
});
const SubmitModal = dynamic(() => import('./SubmitModal'), {
  ssr: false,
});

type TabType = 'Event' | 'Activity' | 'Camp';

const Homepage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Event');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    zipCode: string;
  } | null>(null);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    recommended: false,
    sortBy: 'date',
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

  // Fetch listings when tab or location changes
  useEffect(() => {
    if (userLocation) {
      fetchListings(true); // Reset to first page
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLocation, searchQuery]);

  const fetchListings = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const now = new Date().toISOString();
      const currentListings = reset ? [] : listings;
      const offset = reset ? 0 : currentListings.length;

      let query = supabase.from('listings').select('*');

      // Filter by type if not searching
      if (!searchQuery) {
        query = query.eq('type', activeTab);
      }

      // Filter events by future dates
      if (activeTab === 'Event' && !searchQuery) {
        query = query.gte('start_date', now);
      }

      const { data, error } = await query
        .order('recommended', { ascending: false })
        .order('start_date', { ascending: true })
        .range(offset, offset + 14); // Fetch 15 items (0-14, 15-29, etc.)

      if (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Calculate distances
      const listingsWithDistance = (data || []).map((listing) => {
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

      // Check if there are more items to load
      setHasMore(data && data.length === 15);

      // Append or replace listings
      setListings(reset ? listingsWithDistance : [...currentListings, ...listingsWithDistance]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchListings(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-outta-blue to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-outta-blue px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Image src="/Outta_logo.svg" alt="Outta" width={120} height={40} className="h-10 w-auto" />

          {/* Action Bar */}
          <div className="flex items-center gap-2 bg-white rounded-[60px] p-2 shadow-sm">
            <button
              onMouseEnter={() => setHoveredButton('search')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setShowSearchModal(true)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                hoveredButton === 'search' || searchQuery
                  ? 'bg-outta-yellow'
                  : 'bg-transparent hover:bg-gray-100'
              }`}
              aria-label="Search"
            >
              <LuSearch size={17} />
            </button>

            <button
              onMouseEnter={() => setHoveredButton('map')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setShowLocationModal(true)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                hoveredButton === 'map' ? 'bg-outta-yellow' : 'bg-transparent hover:bg-gray-100'
              }`}
              aria-label="Change location"
            >
              <LuMapPin size={17} />
            </button>

            <button
              onMouseEnter={() => setHoveredButton('filter')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setShowFilterModal(true)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                hoveredButton === 'filter' ? 'bg-outta-yellow' : 'bg-transparent hover:bg-gray-100'
              }`}
              aria-label="Filter"
            >
              <LuFilter size={17} />
            </button>

            <button
              onMouseEnter={() => setHoveredButton('add')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setShowSubmitModal(true)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                hoveredButton === 'add' ? 'bg-outta-yellow' : 'bg-transparent hover:bg-gray-100'
              }`}
              aria-label="Add listing"
            >
              <LuPlus size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-5 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Graphic */}
          <Image
            src="/hero.png"
            alt="Kid-friendly adventures"
            width={700}
            height={200}
            priority
            className="w-full max-w-[700px] h-auto"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-[#E0E0E0] px-5">
        <div className="max-w-7xl mx-auto flex gap-8">
          {[
            { key: 'Event', label: 'Events' },
            { key: 'Activity', label: 'Activities' },
            { key: 'Camp', label: 'Camps' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`px-0 py-[14px] bg-transparent border-none cursor-pointer text-lg font-semibold transition-all ${
                activeTab === key
                  ? 'text-black font-bold border-b-[3px] border-outta-orange'
                  : 'text-[#757575] font-semibold'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="px-5 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-12">
              <Loader size={120} />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No {activeTab.toLowerCase()}s found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ClickableCard
                    key={listing.airtable_id}
                    airtable_id={listing.airtable_id}
                    title={listing.title}
                    type={listing.type}
                    recommended={listing.recommended}
                    city={listing.city}
                    distance={listing.distance || 0}
                    image={listing.image}
                    start_date={listing.start_date}
                    place_type={listing.place_type}
                    description={listing.description}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full max-w-md px-4 py-4 bg-outta-yellow border-2 border-black rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[3px_4px_0px_0px_#000000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
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

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={saveLocation}
      />

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </div>
  );
};

export default Homepage;
