'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LuSearch, LuMapPin, LuFilter, LuPlus, LuMap } from 'react-icons/lu';
import { IoIosArrowBack } from 'react-icons/io';
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
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
});

type TabType = 'Event' | 'Activity' | 'Camp';

const Homepage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Event');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(15);
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

  // Map modal state (mobile)
  const [showMapModal, setShowMapModal] = useState(false);

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

    // Apply recommended filter
    if (filters.recommended) {
      filtered = filtered.filter((listing) => listing.recommended);
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
          case 'next-week':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'next-month':
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
    setDisplayedListings(filtered.slice(0, 15));
  };

  // Calculate if there are more results to show
  const hasMore = () => {
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
      filtered = filtered.filter((listing) => listing.recommended);
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
          case 'next-week':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'next-month':
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

    return filtered.length > displayCount;
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
      filtered = filtered.filter((listing) => listing.recommended);
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
          case 'next-week':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'next-month':
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

    setDisplayedListings(filtered.slice(0, newCount));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-outta-blue">
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
        <div className="max-w-7xl mx-auto flex justify-center">
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
      <div className="sticky top-[72px] z-40 bg-outta-blue border-b border-[#E0E0E0] px-5">
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
          ) : displayedListings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No {activeTab.toLowerCase()}s found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                {/* Cards Column */}
                <div className="flex flex-col gap-4">
                  {displayedListings.map((listing) => (
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

                {/* Map Column (hidden on mobile) */}
                <div className="hidden md:block sticky top-[140px] h-[calc(100vh-180px)] rounded-2xl overflow-hidden border border-gray-300 shadow-lg">
                  <MapView listings={displayedListings} userLocation={userLocation} activeTab={activeTab} />
                </div>
              </div>

              {/* Load More Button */}
              {hasMore() && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    className="w-full max-w-md px-4 py-4 bg-outta-yellow border-2 border-black rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5"
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

      {/* FAB for Map (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowMapModal(true)}
          className="w-14 h-14 bg-outta-yellow border-2 border-black rounded-full shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center"
          aria-label="View map"
        >
          <LuMap size={24} />
        </button>
      </div>

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

      {/* Map Modal (Mobile Only) */}
      {showMapModal && (
        <div className="md:hidden fixed inset-0 bg-white z-[1000]">
          {/* Floating Back Button */}
          <div className="absolute top-0 left-0 right-0 z-50 px-5 py-4">
            <button
              onClick={() => setShowMapModal(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all"
              aria-label="Close map"
            >
              <IoIosArrowBack size={24} />
            </button>
          </div>
          <MapView listings={displayedListings} userLocation={userLocation} activeTab={activeTab} />
        </div>
      )}
    </div>
  );
};

export default Homepage;
