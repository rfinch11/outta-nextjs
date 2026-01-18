'use client';

import React, { useState, useRef } from 'react';
import { LuStar, LuExternalLink, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import type { PlaceReview } from '@/lib/googlePlaces';

interface ReviewsProps {
  reviews: PlaceReview[];
  placeId: string;
}

const MAX_TEXT_LENGTH = 150;

/**
 * Horizontal carousel of review cards
 * Includes link to view all on Google
 */
const Reviews: React.FC<ReviewsProps> = ({ reviews, placeId }) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = (index: number) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 280 + 12; // card width + gap
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reviews.length) {
      setCurrentIndex(newIndex);
    }
  };

  const goToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const itemWidth = 280 + 12;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
    setCurrentIndex(index);
  };

  if (reviews.length === 0) {
    return null;
  }

  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const hasMultipleReviews = reviews.length > 1;

  return (
    <div>
      {/* Carousel container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
        >
          {reviews.map((review, index) => {
            const isExpanded = expandedReviews.has(index);
            const isLongText = review.text.length > MAX_TEXT_LENGTH;
            const displayText =
              isLongText && !isExpanded
                ? review.text.slice(0, MAX_TEXT_LENGTH) + '...'
                : review.text;

            return (
              <div
                key={index}
                className="flex-none w-[280px] bg-white rounded-xl p-4 shadow-sm snap-start"
              >
                {/* Author and Rating */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-malibu-950 text-sm truncate mr-2">
                    {review.authorName}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <LuStar
                        key={i}
                        size={12}
                        className={
                          i < review.rating
                            ? 'text-broom-500 fill-broom-500'
                            : 'text-malibu-950/20'
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Time */}
                <p className="text-xs text-malibu-950/50 mb-2">
                  {review.relativeTimeDescription}
                </p>

                {/* Review Text */}
                {review.text && (
                  <div>
                    <p className="text-sm text-malibu-950/80 leading-relaxed">
                      {displayText}
                    </p>
                    {isLongText && (
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="text-sm text-malibu-950/50 hover:text-malibu-950/70 mt-1 bg-transparent border-none cursor-pointer p-0"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* View on Google card */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-[140px] bg-malibu-100 rounded-xl p-4 snap-start flex flex-col items-center justify-center gap-2 no-underline hover:bg-malibu-200 transition-colors"
          >
            <LuExternalLink size={20} className="text-malibu-700" />
            <span className="text-sm text-malibu-700 font-medium text-center">
              View all on Google
            </span>
          </a>
        </div>

        {/* Navigation Arrows (md and up) */}
        {hasMultipleReviews && (
          <>
            <button
              onClick={() => goToIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="absolute -left-2 top-1/2 -translate-y-1/2 text-malibu-950/70 hover:text-malibu-950 transition-colors bg-white hover:bg-malibu-50 disabled:opacity-30 disabled:cursor-default border border-malibu-200 cursor-pointer p-1.5 rounded-full hidden md:flex items-center justify-center shadow-sm"
              aria-label="Previous review"
            >
              <LuChevronLeft size={18} />
            </button>
            <button
              onClick={() => goToIndex(currentIndex + 1)}
              disabled={currentIndex >= reviews.length - 1}
              className="absolute -right-2 top-1/2 -translate-y-1/2 text-malibu-950/70 hover:text-malibu-950 transition-colors bg-white hover:bg-malibu-50 disabled:opacity-30 disabled:cursor-default border border-malibu-200 cursor-pointer p-1.5 rounded-full hidden md:flex items-center justify-center shadow-sm"
              aria-label="Next review"
            >
              <LuChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators for mobile */}
      {hasMultipleReviews && (
        <div className="flex justify-center gap-1.5 mt-3 md:hidden">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`h-1.5 rounded-full border-none cursor-pointer transition-all ${
                index === currentIndex
                  ? 'bg-malibu-950 w-3'
                  : 'bg-malibu-950/20 w-1.5'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
