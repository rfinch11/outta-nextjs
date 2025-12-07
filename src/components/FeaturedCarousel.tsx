'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { Listing } from '@/lib/supabase';
import FeaturedCard from './FeaturedCard';

interface FeaturedCarouselProps {
  listings: Listing[];
}

/**
 * FeaturedCarousel component with horizontal scrolling
 * Supports swipe on mobile and arrow keys on desktop
 */
const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ listings }) => {
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
  }, [listings]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;

      if (e.key === 'ArrowLeft') {
        scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {listings.map((listing) => (
          <div
            key={listing.airtable_id}
            className="flex-none snap-start w-[85%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)] h-[400px]"
          >
            <FeaturedCard
              airtable_id={listing.airtable_id}
              title={listing.title}
              image={listing.image ?? undefined}
              place_id={listing.place_id ?? undefined}
              type={listing.type}
              start_date={listing.start_date ?? undefined}
              place_type={listing.place_type ?? undefined}
              description={listing.description ?? undefined}
              city={listing.city}
              distance={listing.distance}
              scout_pick={listing.scout_pick ?? undefined}
              deal={listing.deal ?? undefined}
              promoted={listing.promoted ?? undefined}
            />
          </div>
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
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200"
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

export default FeaturedCarousel;
