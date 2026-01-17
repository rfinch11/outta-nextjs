'use client';

import React, { useState, useRef, useEffect } from 'react';
import MenuPopover from './MenuPopover';

interface MenuProps {
  onLocationSet: (lat: number, lng: number, zipCode: string) => void;
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ onLocationSet, className = '' }) => {
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

  const handleLocationSet = (lat: number, lng: number, zipCode: string) => {
    onLocationSet(lat, lng, zipCode);
    // Popover closes itself after location is set
  };

  return (
    <div className={`relative ${className}`}>
      {/* Menu trigger button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
          isOpen ? 'bg-malibu-50' : 'bg-transparent hover:bg-white'
        }`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        type="button"
      >
        {/* Animated two-line hamburger to X */}
        <div className="w-5 h-3 relative flex flex-col justify-between">
          <span
            className={`block h-0.5 w-full bg-malibu-950 rounded-full transition-all duration-300 origin-center ${
              isOpen ? 'rotate-45 translate-y-[5px]' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-malibu-950 rounded-full transition-all duration-300 origin-center ${
              isOpen ? '-rotate-45 -translate-y-[5px]' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <MenuPopover
          ref={menuRef}
          onLocationSet={handleLocationSet}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Menu;
