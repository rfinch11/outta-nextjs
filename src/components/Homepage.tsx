'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LuMap } from 'react-icons/lu';
import { IoIosArrowBack } from 'react-icons/io';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Listing, Source } from '@/lib/supabase';
import type { FilterState } from './FilterModal';
import ClickableCard from './ClickableCard';
import Footer from './Footer';
import Loader from './Loader';
import TabBar, { TabFilter } from './TabBar';
import FeaturedCarousel from './FeaturedCarousel';
import VenuesCarousel from './VenuesCarousel';
import BentoMenu from './BentoMenu';

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
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
});

type TabType = 'Event' | 'Activity' | 'Camp' | 'Restaurant';

const Homepage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Event');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [featuredVenues, setFeaturedVenues] = useState<Source[]>([]);
  // Disabled carousels - keeping for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saturdayStokeListings, setSaturdayStokeListings] = useState<Listing[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [superSundayListings, setSuperSundayListings] = useState<Listing[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [worthTheDriveListings, setWorthTheDriveListings] = useState<Listing[]>([]);
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

  // Map modal state (mobile)
  const [showMapModal, setShowMapModal] = useState(false);

  // Tab bar filter state
  const [activeTabFilters, setActiveTabFilters] = useState<TabFilter[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

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
      fetchFeaturedListings();
      fetchFeaturedVenues();
      // Disabled for now - may re-enable in the future
      // fetchSaturdayStokeListings();
      // fetchSuperSundayListings();
      // fetchWorthTheDriveListings();
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

      // Extract unique place types for the type filter
      const uniqueTypes = Array.from(
        new Set(
          listingsWithDistance
            .map((listing) => listing.place_type)
            .filter((type): type is string => !!type)
        )
      ).sort();
      setAvailableTypes(uniqueTypes);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Fetch featured listings
  const fetchFeaturedListings = async () => {
    if (!userLocation) return;

    try {
      const now = new Date().toISOString();

      // Fetch featured listings
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('featured', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching featured listings:', error);
        return;
      }

      if (!data) return;

      // Calculate distances and filter
      const listingsWithDistance = data
        .map((listing) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude!,
            listing.longitude!
          );
          return { ...listing, distance };
        })
        .filter((listing) => {
          // Filter by 40 mile radius
          if (listing.distance > 40) return false;

          // Filter out past events
          if (listing.type === 'Event' && listing.start_date) {
            return new Date(listing.start_date) >= new Date(now);
          }

          return true;
        })
        // Sort by start date (earliest first)
        .sort((a, b) => {
          if (a.start_date && b.start_date) {
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          }
          return 0;
        });

      // Take up to 10 (sorted by start date)
      const selected = listingsWithDistance.slice(0, 10);

      setFeaturedListings(selected);
    } catch (error) {
      console.error('Error fetching featured listings:', error);
    }
  };

  // Fetch featured venues from sources table
  const fetchFeaturedVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, name, logo, url, featured_source')
        .eq('featured_source', true)
        .not('url', 'is', null)
        .limit(10);

      if (error) {
        console.error('Error fetching featured venues:', error);
        return;
      }

      if (data) {
        setFeaturedVenues(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Helper: Get upcoming Saturday dates (current if today is Sat, plus next Saturday)
  const getUpcomingSaturday = () => {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isTodaySaturday = today === 6;

    const saturdays = [];

    // If today is Saturday, include today
    if (isTodaySaturday) {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      saturdays.push({
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        isToday: true,
      });
    }

    // Always include next Saturday (or next week if today is Saturday)
    const daysUntilNextSaturday = isTodaySaturday ? 7 : (6 - today + 7) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilNextSaturday);
    const nextStart = new Date(nextSaturday);
    nextStart.setHours(0, 0, 0, 0);
    const nextEnd = new Date(nextSaturday);
    nextEnd.setHours(23, 59, 59, 999);
    saturdays.push({
      start: nextStart.toISOString(),
      end: nextEnd.toISOString(),
      isToday: false,
    });

    return saturdays;
  };

  // Helper: Get upcoming Sunday dates (current if today is Sun, plus next Sunday)
  const getUpcomingSunday = () => {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday
    const isTodaySunday = today === 0;

    const sundays = [];

    // If today is Sunday, include today
    if (isTodaySunday) {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      sundays.push({
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        isToday: true,
      });
    }

    // Always include next Sunday (or next week if today is Sunday)
    const daysUntilNextSunday = isTodaySunday ? 7 : (7 - today) % 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilNextSunday);
    const nextStart = new Date(nextSunday);
    nextStart.setHours(0, 0, 0, 0);
    const nextEnd = new Date(nextSunday);
    nextEnd.setHours(23, 59, 59, 999);
    sundays.push({
      start: nextStart.toISOString(),
      end: nextEnd.toISOString(),
      isToday: false,
    });

    return sundays;
  };

  // Fetch Saturday Stoke listings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchSaturdayStokeListings = async () => {
    if (!userLocation) return;

    try {
      const saturdays = getUpcomingSaturday();

      // Fetch all potential listings
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching Saturday Stoke listings:', error);
        return;
      }

      if (!data) return;

      // Calculate distances and filter
      const listingsWithDistance = data
        .map((listing) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude!,
            listing.longitude!
          );

          // Check which Saturday this event falls on
          let isToday = false;
          let matchesSaturday = false;

          if (listing.type === 'Event' && listing.start_date) {
            const eventDate = new Date(listing.start_date);
            for (const saturday of saturdays) {
              if (eventDate >= new Date(saturday.start) && eventDate <= new Date(saturday.end)) {
                matchesSaturday = true;
                isToday = saturday.isToday;
                break;
              }
            }
          }

          return { ...listing, distance, isToday, matchesSaturday };
        })
        .filter((listing) => {
          // Events within 0-30 miles on any Saturday
          if (listing.type === 'Event' && listing.start_date) {
            return listing.matchesSaturday && listing.distance <= 30;
          }

          // Activities with scout_pick or featured within 0-20 miles
          if (listing.type === 'Activity') {
            return (listing.scout_pick || listing.featured) && listing.distance <= 20;
          }

          return false;
        })
        .sort((a, b) => {
          // Prioritize today's events over next week
          if (a.isToday && !b.isToday) return -1;
          if (!a.isToday && b.isToday) return 1;
          // Then prioritize Events over Activities
          if (a.type === 'Event' && b.type === 'Activity') return -1;
          if (a.type === 'Activity' && b.type === 'Event') return 1;
          // Then sort by distance
          return (a.distance || 0) - (b.distance || 0);
        })
        .slice(0, 10);

      setSaturdayStokeListings(listingsWithDistance);
    } catch (error) {
      console.error('Error fetching Saturday Stoke listings:', error);
    }
  };

  // Fetch Super Sunday listings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchSuperSundayListings = async () => {
    if (!userLocation) return;

    try {
      const sundays = getUpcomingSunday();

      // Fetch all potential listings
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching Super Sunday listings:', error);
        return;
      }

      if (!data) return;

      // Calculate distances and filter
      const listingsWithDistance = data
        .map((listing) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude!,
            listing.longitude!
          );

          // Check which Sunday this event falls on
          let isToday = false;
          let matchesSunday = false;

          if (listing.type === 'Event' && listing.start_date) {
            const eventDate = new Date(listing.start_date);
            for (const sunday of sundays) {
              if (eventDate >= new Date(sunday.start) && eventDate <= new Date(sunday.end)) {
                matchesSunday = true;
                isToday = sunday.isToday;
                break;
              }
            }
          }

          return { ...listing, distance, isToday, matchesSunday };
        })
        .filter((listing) => {
          // Events within 0-30 miles on any Sunday
          if (listing.type === 'Event' && listing.start_date) {
            return listing.matchesSunday && listing.distance <= 30;
          }

          // Activities with scout_pick or featured within 0-20 miles
          if (listing.type === 'Activity') {
            return (listing.scout_pick || listing.featured) && listing.distance <= 20;
          }

          return false;
        })
        .sort((a, b) => {
          // Prioritize today's events over next week
          if (a.isToday && !b.isToday) return -1;
          if (!a.isToday && b.isToday) return 1;
          // Then prioritize Events over Activities
          if (a.type === 'Event' && b.type === 'Activity') return -1;
          if (a.type === 'Activity' && b.type === 'Event') return 1;
          // Then sort by distance
          return (a.distance || 0) - (b.distance || 0);
        })
        .slice(0, 10);

      setSuperSundayListings(listingsWithDistance);
    } catch (error) {
      console.error('Error fetching Super Sunday listings:', error);
    }
  };

  // Fetch Worth the Drive listings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchWorthTheDriveListings = async () => {
    if (!userLocation) return;

    try {
      const now = new Date().toISOString();

      // Fetch scout_pick or featured events
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'Event')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching Worth the Drive listings:', error);
        return;
      }

      if (!data) return;

      // Calculate distances and filter
      const listingsWithDistance = data
        .map((listing) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude!,
            listing.longitude!
          );
          return { ...listing, distance };
        })
        .filter((listing) => {
          // Must be scout_pick or featured
          if (!listing.scout_pick && !listing.featured) return false;

          // Must be 20-50 miles away
          if (listing.distance < 20 || listing.distance > 50) return false;

          // Must be future event
          if (listing.start_date) {
            return new Date(listing.start_date) >= new Date(now);
          }

          return false;
        })
        .sort((a, b) => {
          // Sort by start date
          if (a.start_date && b.start_date) {
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          }
          return 0;
        })
        .slice(0, 10);

      setWorthTheDriveListings(listingsWithDistance);
    } catch (error) {
      console.error('Error fetching Worth the Drive listings:', error);
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

  // Get available filters based on active tab
  const getAvailableFilters = (): TabFilter[] => {
    const baseFilters: TabFilter[] = [];

    if (activeTab === 'Event') {
      baseFilters.push(
        { id: 'date', label: 'Date', value: null },
        { id: 'distance', label: 'Distance', value: null }
      );
    } else if (activeTab === 'Activity') {
      baseFilters.push(
        { id: 'distance', label: 'Distance', value: null },
        { id: 'type', label: 'Type', value: null }
      );
    } else if (activeTab === 'Camp') {
      baseFilters.push({ id: 'distance', label: 'Distance', value: null });
    } else if (activeTab === 'Restaurant') {
      // Restaurants coming soon - no filters yet
      baseFilters.push({ id: 'distance', label: 'Distance', value: null });
    }

    return baseFilters;
  };

  // Handle date filter selection
  const handleDateSelect = (value: 'today' | 'tomorrow' | 'this_week' | 'this_month') => {
    setFilters((prev) => ({ ...prev, dateQuick: value }));
  };

  // Handle distance filter selection
  const handleDistanceSelect = (distance: number) => {
    setFilters((prev) => ({ ...prev, distance }));
  };

  // Handle type filter selection
  const handleTypeSelect = (types: string[]) => {
    setFilters((prev) => ({ ...prev, types }));
  };

  // Handle tab change and clear filters
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Clear all quick filters when switching tabs
    setFilters((prev) => ({
      ...prev,
      dateQuick: null,
      distance: null,
      types: [],
    }));
  };

  // Handle filter removal
  const handleFilterRemove = (filterId: string) => {
    setActiveTabFilters((prev) => prev.filter((f) => f.id !== filterId));

    // Also update the main filter state
    if (filterId === 'date') {
      setFilters((prev) => ({ ...prev, dateQuick: null }));
    } else if (filterId === 'distance') {
      setFilters((prev) => ({ ...prev, distance: null }));
    } else if (filterId === 'type') {
      setFilters((prev) => ({ ...prev, types: [] }));
    }
  };

  // Update active tab filters when filters change
  useEffect(() => {
    const newActiveFilters: TabFilter[] = [];

    if (filters.dateQuick) {
      const labels: Record<string, string> = {
        today: 'Today',
        tomorrow: 'Tomorrow',
        this_week: 'This week',
        this_month: 'This month',
      };
      newActiveFilters.push({
        id: 'date',
        label: labels[filters.dateQuick] || filters.dateQuick,
        value: filters.dateQuick,
      });
    }

    if (filters.distance !== null) {
      newActiveFilters.push({
        id: 'distance',
        label: `<${filters.distance} mi`,
        value: filters.distance,
      });
    }

    if (filters.types && filters.types.length > 0) {
      const label = filters.types.length === 1 ? filters.types[0] : `${filters.types.length} types`;
      newActiveFilters.push({
        id: 'type',
        label,
        value: filters.types,
      });
    }

    setActiveTabFilters(newActiveFilters);
  }, [filters.dateQuick, filters.distance, filters.types]);

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

      {/* Hero Section - Featured Events */}
      {!loading && featuredListings.length > 0 && (
        <div className="py-3 bg-malibu-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">Featured events</h2>
            <div className="pl-5">
              <FeaturedCarousel listings={featuredListings} />
            </div>
          </div>
        </div>
      )}

      {/* Disabled for now - may re-enable in the future */}
      {/* Saturday Stoke Section */}
      {/* {!loading && saturdayStokeListings.length > 0 && (
        <div className="py-3 bg-malibu-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">Saturday Stoke</h2>
            <div className="pl-5">
              <FeaturedCarousel listings={saturdayStokeListings} />
            </div>
          </div>
        </div>
      )} */}

      {/* Super Sunday Section */}
      {/* {!loading && superSundayListings.length > 0 && (
        <div className="py-3 bg-malibu-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">Super Sunday</h2>
            <div className="pl-5">
              <FeaturedCarousel listings={superSundayListings} />
            </div>
          </div>
        </div>
      )} */}

      {/* Worth the Drive Section */}
      {/* {!loading && worthTheDriveListings.length > 0 && (
        <div className="py-3 bg-malibu-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">Worth the Drive</h2>
            <div className="pl-5">
              <FeaturedCarousel listings={worthTheDriveListings} />
            </div>
          </div>
        </div>
      )} */}

      {/* Top Venues Section */}
      {!loading && featuredVenues.length > 0 && (
        <div className="py-3 bg-malibu-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">Top venues</h2>
            <div className="pl-5">
              <VenuesCarousel venues={featuredVenues} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation with Filters */}
      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeFilters={activeTabFilters}
        availableFilters={getAvailableFilters()}
        onFilterRemove={handleFilterRemove}
        onDateSelect={handleDateSelect}
        onDistanceSelect={handleDistanceSelect}
        onTypeSelect={handleTypeSelect}
        currentDateFilter={filters.dateQuick}
        currentDistanceFilter={filters.distance}
        currentTypeFilter={filters.types}
        availableTypes={availableTypes}
      />

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
                        />
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Map Column (hidden on mobile) */}
                <div className="hidden md:block sticky top-[140px] h-[calc(100vh-180px)] rounded-2xl overflow-hidden border border-gray-300 shadow-lg">
                  <MapView
                    listings={displayedListings}
                    userLocation={userLocation}
                    activeTab={activeTab}
                    filters={filters}
                  />
                </div>
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

      {/* FAB for Map (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowMapModal(true)}
          className="w-14 h-14 bg-broom-400 border-2 border-malibu-950 rounded-full shadow-[3px_4px_0px_0px_#06304b] hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center"
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

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={saveLocation}
      />

      <SubmitModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />

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
          <MapView
            listings={displayedListings}
            userLocation={userLocation}
            activeTab={activeTab}
            filters={filters}
          />
        </div>
      )}
    </div>
  );
};

export default Homepage;
