'use client';

import React, { forwardRef, useState } from 'react';
import { LuSearch, LuPlus, LuChevronLeft, LuX, LuBadgeCheck } from 'react-icons/lu';
import { BiNavigation } from 'react-icons/bi';

interface BentoMenuPopoverProps {
  onSearchClick: () => void;
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  onSubmitClick: () => void;
  onSearch: (query: string) => void;
  onClose: () => void;
}

type MenuMode = 'grid' | 'search' | 'location';

const BentoMenuPopover = forwardRef<HTMLDivElement, BentoMenuPopoverProps>(
  ({ onSearchClick, onLocationSet, onSubmitClick, onSearch, onClose }, ref) => {
    const [mode, setMode] = useState<MenuMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [zipCodeInput, setZipCodeInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearchModeClick = () => {
      setMode('search');
      onSearchClick();
    };

    const handleLocationModeClick = () => {
      setMode('location');
    };

    const handleBackClick = () => {
      setMode('grid');
      setSearchQuery('');
      setZipCodeInput('');
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim());
        onClose();
      }
    };

    const handleClearSearch = () => {
      setSearchQuery('');
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

    const handleBecomeScout = () => {
      window.location.href = 'mailto:rfinch@outta.events?subject=Become a Scout';
    };

    const handlePartner = () => {
      window.location.href = 'mailto:rfinch@outta.events?subject=Partner with Outta';
    };

    return (
      <div
        ref={ref}
        className="absolute top-full right-0 mt-3 bg-white rounded-xl shadow-xl border border-black-100 z-50 min-w-[280px] max-w-[320px]"
        style={{
          animation: 'slideInDown 0.2s ease-out',
        }}
      >
        {mode === 'grid' ? (
          <>
            {/* Main actions grid */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {/* Set location */}
              <button
                onClick={handleLocationModeClick}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-broom-400 border border-malibu-950 shadow-[2px_2px_0_0_#06304b] cursor-pointer transition-all hover:shadow-[1px_1px_0_0_#06304b] hover:translate-x-[1px] hover:translate-y-[1px]"
                type="button"
              >
                <BiNavigation size={24} className="text-malibu-950" />
                <span className="text-sm font-semibold text-malibu-950 text-center leading-tight">
                  Set location
                </span>
              </button>

              {/* Search events */}
              <button
                onClick={handleSearchModeClick}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-flamenco-500 border border-malibu-950 shadow-[2px_2px_0_0_#06304b] cursor-pointer transition-all hover:shadow-[1px_1px_0_0_#06304b] hover:translate-x-[1px] hover:translate-y-[1px]"
                type="button"
              >
                <LuSearch size={24} className="text-malibu-950" />
                <span className="text-sm font-semibold text-malibu-950 text-center leading-tight">
                  Search events
                </span>
              </button>

              {/* Submit event */}
              <button
                onClick={onSubmitClick}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-lavender-magenta-300 border border-malibu-950 shadow-[2px_2px_0_0_#06304b] cursor-pointer transition-all hover:shadow-[1px_1px_0_0_#06304b] hover:translate-x-[1px] hover:translate-y-[1px]"
                type="button"
              >
                <LuPlus size={24} className="text-malibu-950" />
                <span className="text-sm font-semibold text-malibu-950 text-center leading-tight">
                  Submit event
                </span>
              </button>

              {/* Become a Scout */}
              <button
                onClick={handleBecomeScout}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-emerald-500 border border-malibu-950 shadow-[2px_2px_0_0_#06304b] cursor-pointer transition-all hover:shadow-[1px_1px_0_0_#06304b] hover:translate-x-[1px] hover:translate-y-[1px]"
                type="button"
              >
                <LuBadgeCheck size={24} className="text-malibu-950" />
                <span className="text-sm font-semibold text-malibu-950 text-center leading-tight">
                  Become a Scout
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-black-200" />

            {/* More options */}
            <div className="p-4 pt-3">
              <span className="text-xs font-semibold text-black-500 uppercase mb-2 block">
                More options
              </span>
              <div className="flex flex-col gap-1">
                {/* Sign in - disabled */}
                <button
                  disabled
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-black-900 transition-colors border-none bg-transparent opacity-50 cursor-not-allowed"
                  type="button"
                >
                  Sign in
                </button>

                {/* Partner with Outta */}
                <button
                  onClick={handlePartner}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-black-900 transition-colors hover:bg-black-50 border-none bg-transparent cursor-pointer"
                  type="button"
                >
                  Partner with Outta
                </button>
              </div>
            </div>
          </>
        ) : mode === 'search' ? (
          <>
            {/* Search mode */}
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
                <span className="text-sm font-semibold text-black-900">Search</span>
              </div>

              {/* Search form */}
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find something amazing"
                    className="w-full px-4 py-3 pr-10 text-base border border-black-200 rounded-lg outline-none focus:border-malibu-950 focus:ring-1 focus:ring-malibu-950"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border-none bg-black-200 hover:bg-black-300 cursor-pointer transition-colors"
                      aria-label="Clear search"
                    >
                      <LuX size={14} className="text-black-700" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="w-full px-4 py-3 mt-3 bg-malibu-950 text-white rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-malibu-950 border-none"
                >
                  Search
                </button>
              </form>
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
                <span className="text-sm font-semibold text-black-900">Set Location</span>
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

BentoMenuPopover.displayName = 'BentoMenuPopover';

export default BentoMenuPopover;
