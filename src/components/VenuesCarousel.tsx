'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { Source } from '@/lib/supabase';
import VenueCard from './VenueCard';

interface VenuesCarouselProps {
  venues: Source[];
}

/**
 * VenuesCarousel component with horizontal scrolling
 * Supports swipe on mobile and arrow keys on desktop
 */
const VenuesCarousel: React.FC<VenuesCarouselProps> = ({ venues }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to update scroll button states
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
    };
  }, [venues]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;

      if (e.key === 'ArrowLeft') {
        scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (venues.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2 pr-5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            id={venue.id}
            name={venue.name}
            logo={venue.logo}
            url={venue.url}
          />
        ))}
      </div>

      {/* Desktop navigation arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200"
          aria-label="Scroll left"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200"
          aria-label="Scroll right"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default VenuesCarousel;
