'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LuSearch, LuMapPin, LuFilter, LuPlus } from 'react-icons/lu';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import type { FilterState } from './FilterModal';
import ClickableCard from './ClickableCard';
import Footer from './Footer';

// Dynamic imports for modals (code splitting)
const FilterModal = dynamic(() => import('./FilterModal'), {
  ssr: false,
});
const SearchModal = dynamic(() => import('./SearchModal'), {
  ssr: false,
});

type TabType = 'Event' | 'Activity' | 'Camp';

const Homepage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Event');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
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
    priceMax: 1000,
    types: [],
    tags: [],
    rating: 'any',
  });

  // Search state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Load location on mount (default to Mountain View, CA)
  useEffect(() => {
    const defaultLocation = { lat: 37.4419, lng: -122.143, zipCode: '94043' };
    setUserLocation(defaultLocation);
  }, []);

  // Fetch listings when tab or location changes
  useEffect(() => {
    if (userLocation) {
      fetchListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLocation, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);

    try {
      const now = new Date().toISOString();

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
        .limit(15);

      if (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
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

      setListings(listingsWithDistance);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
      <header className="bg-transparent px-5 py-4">
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
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                hoveredButton === 'map' ? 'bg-outta-yellow' : 'bg-transparent hover:bg-gray-100'
              }`}
              aria-label="Map view"
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
      <div className="border-b border-[#E0E0E0] px-5">
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
            <div className="text-center py-12 text-gray-600">Loading...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No {activeTab.toLowerCase()}s found
            </div>
          ) : (
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
    </div>
  );
};

export default Homepage;
