'use client';

import React, { useState } from 'react';
import { BiNavigation } from 'react-icons/bi';
import { ResponsiveModal } from './ui/ResponsiveModal';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationSet }) => {
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const geocodeZipCode = async (zipCode: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onLocationSet(lat, lng, zipCode);
        setZipCodeInput('');
        onClose();
      } else {
        alert('Zip code not found. Please try again.');
      }
    } catch (error) {
      console.error('Error geocoding zip code:', error);
      alert('Error finding location. Please try again.');
    }
    setLoading(false);
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
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
          onLocationSet(lat, lng, zipCode);
          onClose();
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          onLocationSet(lat, lng, 'Unknown');
          onClose();
        }
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        alert('Unable to get your location. Please enter your zip code.');
        setLoading(false);
      }
    );
  };

  const handleSubmit = () => {
    if (zipCodeInput.trim()) {
      geocodeZipCode(zipCodeInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && zipCodeInput.trim()) {
      handleSubmit();
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Set Your Location"
      description="Set your location to find events near you"
      snapPoints={[0.5, 1]}
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col gap-4">
        {/* Use Current Location Button */}
        <button
          onClick={requestBrowserLocation}
          disabled={loading}
          className="w-full px-4 py-3 bg-malibu-50 text-malibu-950 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-100 disabled:opacity-50 disabled:cursor-not-allowed border-none flex items-center justify-center gap-2"
        >
          <BiNavigation size={20} />
          Use my location
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-black-200"></div>
          <span className="text-sm text-black-400">or</span>
          <div className="flex-1 h-px bg-black-200"></div>
        </div>

        {/* Zip Code Input */}
        <div>
          <label className="block text-sm font-medium text-black-700 mb-2">
            Enter zip code
          </label>
          <input
            type="text"
            value={zipCodeInput}
            onChange={(e) => setZipCodeInput(e.target.value)}
            placeholder="e.g., 94043"
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 text-base border border-black-200 rounded-lg outline-none focus:border-malibu-500 focus:ring-2 focus:ring-malibu-100 transition-all"
            autoFocus
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!zipCodeInput.trim() || loading}
          className="w-full px-4 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-malibu-950 border-none"
        >
          {loading ? 'Finding...' : 'Set location'}
        </button>
      </div>
    </ResponsiveModal>
  );
};

export default LocationModal;
