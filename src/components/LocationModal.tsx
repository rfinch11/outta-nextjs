'use client';

import React, { useState } from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationSet }) => {
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-[400px] w-[90%] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-outta-dark mb-2">
          Enter Your Location
        </h2>
        <p className="text-base text-[#757575] mb-6">
          Enter your zip code to find kid-friendly adventures near you
        </p>
        <input
          type="text"
          value={zipCodeInput}
          onChange={(e) => setZipCodeInput(e.target.value)}
          placeholder="Zip code (e.g., 94043)"
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 text-base border-2 border-[#E0E0E0] rounded-lg mb-4 outline-none focus:border-[#E0E0E0]"
        />
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={!zipCodeInput.trim() || loading}
            className="px-6 py-3 text-base font-semibold bg-outta-orange text-white rounded-lg border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {loading ? 'Finding...' : 'Submit'}
          </button>
          <button
            onClick={requestBrowserLocation}
            disabled={loading}
            className="px-6 py-3 text-base font-semibold bg-outta-blue text-outta-dark rounded-lg border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            Use My Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
