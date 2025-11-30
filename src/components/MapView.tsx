'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface MapViewProps {
  listings: Listing[];
  userLocation?: { lat: number; lng: number } | null;
  activeTab: 'Event' | 'Activity' | 'Camp';
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const MapView: React.FC<MapViewProps> = ({ listings, userLocation, activeTab }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [mapListings, setMapListings] = useState<Listing[]>(listings);
  const [isLoadingMapData, setIsLoadingMapData] = useState(false);

  // Initial listings with valid coordinates
  const validListings = mapListings.filter(
    (listing) => listing.latitude && listing.longitude
  );

  // Calculate center and zoom based on listings
  const getMapCenter = useCallback(() => {
    if (userLocation) {
      return userLocation;
    }
    if (validListings.length === 0) {
      return { lat: 37.7749, lng: -122.4194 }; // Default to SF
    }
    // Calculate center from all listings
    const avgLat =
      validListings.reduce((sum, l) => sum + (l.latitude || 0), 0) / validListings.length;
    const avgLng =
      validListings.reduce((sum, l) => sum + (l.longitude || 0), 0) / validListings.length;
    return { lat: avgLat, lng: avgLng };
  }, [userLocation, validListings]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      // Set initial bounds to 20-mile radius around user location
      if (userLocation) {
        const radius = 20; // miles
        const milesPerLat = 69; // Approximately 69 miles per degree latitude
        const latOffset = radius / milesPerLat;

        // Longitude offset varies by latitude, use cos(lat) to adjust
        const latRad = (userLocation.lat * Math.PI) / 180;
        const lonOffset = radius / (milesPerLat * Math.cos(latRad));

        const bounds = new window.google.maps.LatLngBounds(
          { lat: userLocation.lat - latOffset, lng: userLocation.lng - lonOffset },
          { lat: userLocation.lat + latOffset, lng: userLocation.lng + lonOffset }
        );
        map.fitBounds(bounds);
      } else if (validListings.length > 0) {
        // Fallback: fit bounds to show all markers
        const bounds = new window.google.maps.LatLngBounds();
        validListings.forEach((listing) => {
          if (listing.latitude && listing.longitude) {
            bounds.extend({ lat: listing.latitude, lng: listing.longitude });
          }
        });
        map.fitBounds(bounds);
      }
      setMap(map);
    },
    [validListings, userLocation]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Load listings within map bounds
  const loadListingsInBounds = useCallback(async () => {
    if (!map || isLoadingMapData) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    setIsLoadingMapData(true);

    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('listings')
        .select('*')
        .eq('type', activeTab)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', sw.lat())
        .lte('latitude', ne.lat())
        .gte('longitude', sw.lng())
        .lte('longitude', ne.lng());

      // Filter events by future dates
      if (activeTab === 'Event') {
        query = query.gte('start_date', now);
      }

      const { data, error } = await query.limit(500); // Limit to 500 for performance

      if (error) {
        console.error('Error fetching map listings:', error);
        return;
      }

      if (data) {
        // Merge with existing listings, avoid duplicates
        setMapListings((prev) => {
          const existingIds = new Set(prev.map((l) => l.airtable_id));
          const newListings = data.filter((l) => !existingIds.has(l.airtable_id));
          return [...prev, ...newListings];
        });
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setIsLoadingMapData(false);
    }
  }, [map, activeTab, isLoadingMapData]);

  // Update bounds when initial listings change or user location updates
  useEffect(() => {
    if (map && userLocation) {
      // Set bounds to 20-mile radius around user location
      const radius = 20; // miles
      const milesPerLat = 69;
      const latOffset = radius / milesPerLat;
      const latRad = (userLocation.lat * Math.PI) / 180;
      const lonOffset = radius / (milesPerLat * Math.cos(latRad));

      const bounds = new window.google.maps.LatLngBounds(
        { lat: userLocation.lat - latOffset, lng: userLocation.lng - lonOffset },
        { lat: userLocation.lat + latOffset, lng: userLocation.lng + lonOffset }
      );
      map.fitBounds(bounds);
    } else if (map && listings.length > 0) {
      // Fallback: fit to listings if no user location
      const bounds = new window.google.maps.LatLngBounds();
      listings.forEach((listing) => {
        if (listing.latitude && listing.longitude) {
          bounds.extend({ lat: listing.latitude, lng: listing.longitude });
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, listings, userLocation]);

  // Update map listings when tab changes
  useEffect(() => {
    setMapListings(listings);
  }, [activeTab, listings]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={getMapCenter()}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onIdle={loadListingsInBounds}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {validListings.map((listing) => (
        <Marker
          key={listing.airtable_id}
          position={{
            lat: listing.latitude!,
            lng: listing.longitude!,
          }}
          onClick={() => setSelectedListing(listing)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FFF407',
            fillOpacity: 1,
            strokeColor: '#000000',
            strokeWeight: 2,
          }}
        />
      ))}

      {selectedListing && selectedListing.latitude && selectedListing.longitude && (
        <InfoWindow
          position={{
            lat: selectedListing.latitude,
            lng: selectedListing.longitude,
          }}
          onCloseClick={() => setSelectedListing(null)}
        >
          <Link
            href={`/listings/${selectedListing.airtable_id}`}
            className="block no-underline max-w-[250px]"
          >
            <div className="flex flex-col gap-2">
              {selectedListing.image && (
                <Image
                  src={selectedListing.image}
                  alt={selectedListing.title}
                  width={250}
                  height={150}
                  className="w-full h-[150px] object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="text-base font-bold text-gray-900 m-0 mb-1">
                  {selectedListing.title}
                </h3>
                <p className="text-sm text-gray-600 m-0">
                  {selectedListing.city}
                  {selectedListing.distance && ` • ${selectedListing.distance} mi`}
                </p>
              </div>
            </div>
          </Link>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default MapView;
