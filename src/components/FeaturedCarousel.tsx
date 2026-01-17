'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { Listing } from '@/lib/supabase';
import FeaturedCard from './FeaturedCard';

interface FeaturedCarouselProps {
  listings: Listing[];
}

/**
 * FeaturedCarousel - Horizontal scrolling carousel container
 *
 * @description
 * A reusable carousel component for displaying featured listings
 * in a horizontally scrollable view. Optimized for both mobile and desktop.
 *
 * @features
 * - Touch/swipe scrolling on mobile
 * - Navigation arrows on desktop (auto-hide at scroll boundaries)
 * - Keyboard navigation (Arrow Left/Right)
 * - Smooth scroll with snap-to-item behavior
 * - Hidden scrollbar for clean appearance
 *
 * @configuration
 * - Card width: 300px per item
 * - Gap: 16px between cards
 * - Scroll distance: 300px per arrow click
 * - Snap: Enabled on mobile for card alignment
 *
 * @usage
 * ```tsx
 * // 1. Fetch your data
 * const [listings, setListings] = useState<Listing[]>([]);
 *
 * // 2. Render carousel with section wrapper
 * {listings.length > 0 && (
 *   <div className="py-3 bg-malibu-50">
 *     <div className="max-w-7xl mx-auto">
 *       <h2 className="text-xl font-bold text-malibu-950 mb-6 px-5">
 *         Featured Events
 *       </h2>
 *       <div className="pl-5">
 *         <FeaturedCarousel listings={listings} />
 *       </div>
 *     </div>
 *   </div>
 * )}
 * ```
 *
 * @customization
 * To adjust card width, gap, or scroll distance, see CAROUSEL_PATTERN.md
 *
 * @see CAROUSEL_PATTERN.md for complete documentation and examples
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
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2 pr-5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {listings.map((listing) => (
          <div key={listing.airtable_id} className="flex-none snap-start w-[300px]">
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200"
          aria-label="Scroll right"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
