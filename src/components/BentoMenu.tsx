'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LuLayoutGrid } from 'react-icons/lu';
import BentoMenuPopover from './BentoMenuPopover';

interface BentoMenuProps {
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  onSubmitClick: () => void;
  onSearch: (query: string) => void;
  className?: string;
}

const BentoMenu: React.FC<BentoMenuProps> = ({
  onLocationSet,
  onSubmitClick,
  onSearch,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchClick = () => {
    // Search mode is handled within the popover
    // This is just a callback to notify parent if needed
  };

  const handleLocationSet = (lat: number, lng: number, zipCode: string) => {
    onLocationSet(lat, lng, zipCode);
    // Popover closes itself after location is set
  };

  const handleSubmitClick = () => {
    setIsOpen(false);
    onSubmitClick();
  };

  const handleSearch = (query: string) => {
    onSearch(query);
    // Popover closes itself after search
  };

  return (
    <div className={`relative ${className}`}>
      {/* Menu trigger button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
          isOpen ? 'bg-malibu-50' : 'bg-transparent hover:bg-gray-100'
        }`}
        aria-label="Open menu"
        aria-expanded={isOpen}
        type="button"
      >
        <LuLayoutGrid size={17} />
      </button>

      {/* Popover */}
      {isOpen && (
        <BentoMenuPopover
          ref={menuRef}
          onSearchClick={handleSearchClick}
          onLocationSet={handleLocationSet}
          onSubmitClick={handleSubmitClick}
          onSearch={handleSearch}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default BentoMenu;
