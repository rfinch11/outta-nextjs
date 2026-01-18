'use client';

import React, { forwardRef, useState } from 'react';
import { LuPlus, LuChevronLeft, LuMessageSquare } from 'react-icons/lu';
import { BiNavigation } from 'react-icons/bi';

interface MenuPopoverProps {
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  onClose: () => void;
}

type MenuMode = 'main' | 'location';

const MenuPopover = forwardRef<HTMLDivElement, MenuPopoverProps>(
  ({ onLocationSet, onClose }, ref) => {
    const [mode, setMode] = useState<MenuMode>('main');
    const [zipCodeInput, setZipCodeInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLocationModeClick = () => {
      setMode('location');
    };

    const handleBackClick = () => {
      setMode('main');
      setZipCodeInput('');
    };

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

    const handleLocationSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (zipCodeInput.trim()) {
        geocodeZipCode(zipCodeInput.trim());
      }
    };

    const handleShareFeedback = () => {
      window.location.href = 'mailto:rfinch@outta.events?subject=Feedback';
    };

    const handlePartner = () => {
      window.location.href = 'mailto:rfinch@outta.events?subject=Partner with Outta';
    };

    return (
      <div
        ref={ref}
        className="absolute top-full right-0 mt-3 bg-white rounded-xl shadow-xl border border-black-100 z-50 min-w-[300px]"
        style={{
          animation: 'slideInDown 0.2s ease-out',
        }}
      >
        {mode === 'main' ? (
          <>
            {/* Main menu items */}
            <div className="p-3">
              {/* Submit an activity - disabled */}
              <button
                disabled
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-black-400 border-none bg-transparent cursor-not-allowed"
                type="button"
              >
                <LuPlus size={18} className="text-black-400" />
                <span>Submit an activity</span>
              </button>

              {/* Change location */}
              <button
                onClick={handleLocationModeClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-malibu-950 border-none bg-transparent cursor-pointer transition-colors hover:bg-malibu-50"
                type="button"
              >
                <BiNavigation size={18} className="text-malibu-950" />
                <span>Change location</span>
              </button>

              {/* Share feedback */}
              <button
                onClick={handleShareFeedback}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-malibu-950 border-none bg-transparent cursor-pointer transition-colors hover:bg-malibu-50"
                type="button"
              >
                <LuMessageSquare size={18} className="text-malibu-950" />
                <span>Share feedback</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-black-100 mx-3" />

            {/* Partner section */}
            <div className="p-3">
              <button
                onClick={handlePartner}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors hover:bg-malibu-50"
                type="button"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-base font-semibold text-malibu-950">Partner with Outta</span>
                  <span className="text-sm text-black-500">Create new memories for local families</span>
                </div>
                <span className="text-5xl ml-3">🤝</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-black-100 mx-3" />

            {/* Auth link */}
            <div className="p-3">
              <button
                disabled
                className="w-full text-left px-3 py-2.5 rounded-lg text-base text-black-400 border-none bg-transparent cursor-not-allowed"
                type="button"
              >
                Log in or sign up
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Location mode */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* Back button */}
                <button
                  onClick={handleBackClick}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-none bg-transparent hover:bg-black-100 cursor-pointer transition-colors"
                  type="button"
                  aria-label="Back to menu"
                >
                  <LuChevronLeft size={20} className="text-black-900" />
                </button>
                <span className="text-base font-semibold text-malibu-950">Change location</span>
              </div>

              {/* Use Current Location Button */}
              <button
                onClick={requestBrowserLocation}
                disabled={loading}
                className="w-full px-4 py-3 mb-3 bg-malibu-50 text-malibu-950 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-100 disabled:opacity-50 disabled:cursor-not-allowed border-none flex items-center justify-center gap-2"
                type="button"
              >
                <BiNavigation size={20} />
                Use my location
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-black-200"></div>
                <span className="text-sm text-black-500">or</span>
                <div className="flex-1 h-px bg-black-200"></div>
              </div>

              {/* Zip Code Form */}
              <form onSubmit={handleLocationSubmit}>
                <label className="block text-sm font-medium text-black-700 mb-2">
                  Enter zip code
                </label>
                <input
                  type="text"
                  value={zipCodeInput}
                  onChange={(e) => setZipCodeInput(e.target.value)}
                  placeholder="e.g., 94043"
                  className="w-full px-4 py-3 text-base border border-black-200 rounded-lg outline-none focus:border-malibu-950 focus:ring-1 focus:ring-malibu-950 mb-3"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!zipCodeInput.trim() || loading}
                  className="w-full px-4 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-malibu-950 border-none"
                >
                  {loading ? 'Finding...' : 'Set location'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    );
  }
);

MenuPopover.displayName = 'MenuPopover';

export default MenuPopover;
