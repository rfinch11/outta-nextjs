'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import Footer from './Footer';
import Loader from './Loader';
import Menu from './Menu';
import FilterBar from './FilterBar';
import CollectionSection from './CollectionSection';
import HeroSection from './HeroSection';
import {
  getPlaceTypeCounts,
  getUpcomingEvents,
  getAdvancedPlannerEvents,
  getMostLovedPlaygrounds,
  getRainyDayAdventures,
  getFavoriteParks,
} from '@/lib/filterUtils';

// Dynamic imports for modals (code splitting)
const SubmitModal = dynamic(() => import('./SubmitModal'), {
  ssr: false,
});
const LocationModal = dynamic(() => import('./LocationModal'), {
  ssr: false,
});

const Homepage: React.FC = () => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    zipCode: string;
    city?: string;
  } | null>(null);

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

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
  const saveLocation = async (lat: number, lng: number, zipCode: string) => {
    // Try to get city name via reverse geocoding
    let city = zipCode;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      city = data.address?.city || data.address?.town || data.address?.village || zipCode;
    } catch (error) {
      console.error('Error reverse geocoding for city:', error);
    }
    const location = { lat, lng, zipCode, city };
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
        const zipCode = data.postal || 'Unknown';
        const city = data.city || 'Unknown';

        console.log('Using IP-based location:', data.city, data.region);
        const location = { lat, lng, zipCode, city };
        setUserLocation(location);
        localStorage.setItem('userLocation', JSON.stringify(location));
      } else {
        throw new Error('No location data from IP service');
      }
    } catch (error) {
      console.error('Error getting IP location:', error);
      // Final fallback to San Francisco
      const defaultLocation = { lat: 37.7749, lng: -122.4194, zipCode: '94102', city: 'San Francisco' };
      setUserLocation(defaultLocation);
    }
  }, []);

  // Load location on mount from localStorage or detect location
  useEffect(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const location = JSON.parse(stored);

        // If city is missing (legacy data), fetch it via reverse geocoding
        if (!location.city && location.lat && location.lng) {
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`)
            .then(res => res.json())
            .then(data => {
              const city = data.address?.city || data.address?.town || data.address?.village || location.zipCode;
              const updatedLocation = { ...location, city };
              setUserLocation(updatedLocation);
              localStorage.setItem('userLocation', JSON.stringify(updatedLocation));
            })
            .catch(() => {
              setUserLocation(location);
            });
        } else {
          setUserLocation(location);
        }
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

            // Reverse geocode to get city name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
              );
              const data = await response.json();
              const zipCode = data.address?.postcode || 'Unknown';
              const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
              const location = { lat, lng, zipCode, city };
              setUserLocation(location);
              localStorage.setItem('userLocation', JSON.stringify(location));
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

  // Fetch all listings from database once
  const fetchAllListings = async () => {
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

      const data = allData;

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

  // Generate collections from listings
  const upcomingEvents = getUpcomingEvents(allListings, 6);
  const advancedPlannerEvents = getAdvancedPlannerEvents(allListings, 6);
  const playgrounds = getMostLovedPlaygrounds(allListings, 6);
  const rainyDayAdventures = getRainyDayAdventures(allListings, 6);
  const parks = getFavoriteParks(allListings, 6);

  // Calculate hero count: listings within 50 miles that aren't stale
  const heroCount = useMemo(() => {
    const now = new Date();
    return allListings.filter((listing) => {
      // Must be within 50 miles
      if ((listing.distance || Infinity) > 50) return false;
      // Events must have future start_date
      if (listing.type === 'Event') {
        if (!listing.start_date) return false;
        return new Date(listing.start_date) >= now;
      }
      // Activities and Camps always count
      return true;
    }).length;
  }, [allListings]);

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

          {/* Menu */}
          <Menu onLocationSet={saveLocation} />
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        cityName={userLocation?.city || userLocation?.zipCode || 'your area'}
        onLocationClick={() => setShowLocationModal(true)}
        listingCount={heroCount > 0 ? heroCount : undefined}
      />

      {/* Filter Bar */}
      {!loading && allListings.length > 0 && (
        <FilterBar
          placeTypeCounts={placeTypeCounts}
        />
      )}

      {/* Collections */}
      <div className="px-5 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-12">
              <Loader size={120} />
            </div>
          ) : (
            <>
              <CollectionSection
                title="Upcoming events"
                href="/filter/events"
                listings={upcomingEvents}
              />

              <CollectionSection
                title="For advanced planners"
                href="/filter/events"
                listings={advancedPlannerEvents}
              />

              <CollectionSection
                title="Most loved playgrounds"
                href="/filter/Playground"
                listings={playgrounds}
              />

              <CollectionSection
                title="Rainy day adventures"
                href="/filter/Indoor%20Playground"
                listings={rainyDayAdventures}
              />

              <CollectionSection
                title="Favorite parks"
                href="/filter/Park"
                listings={parks}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <SubmitModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={saveLocation}
      />
    </div>
  );
};

export default Homepage;
