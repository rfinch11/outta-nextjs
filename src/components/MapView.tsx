'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Listing } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface MapViewProps {
  listings: Listing[];
  userLocation?: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const MapView: React.FC<MapViewProps> = ({ listings, userLocation }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Filter listings with valid coordinates
  const validListings = listings.filter(
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
      // Fit bounds to show all markers
      if (validListings.length > 0) {
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
    [validListings]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update bounds when listings change
  useEffect(() => {
    if (map && validListings.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validListings.forEach((listing) => {
        if (listing.latitude && listing.longitude) {
          bounds.extend({ lat: listing.latitude, lng: listing.longitude });
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, validListings]);

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
            fillColor: listing.recommended ? '#FF7E08' : '#FFF407',
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
