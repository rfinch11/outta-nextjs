'use client';

import React from 'react';
import { LuStar } from 'react-icons/lu';

interface GoogleRatingProps {
  rating: number;
  reviewCount: number;
  onReviewsClick?: () => void;
}

/**
 * Star rating display with review count
 * Uses broom-500 for filled stars to match design system
 */
const GoogleRating: React.FC<GoogleRatingProps> = ({
  rating,
  reviewCount,
  onReviewsClick,
}) => {
  // Generate array of 5 stars with fill states
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1;
    const fillPercentage = Math.min(100, Math.max(0, (rating - i) * 100));
    return { starValue, fillPercentage };
  });

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map(({ starValue, fillPercentage }) => (
          <span key={starValue} className="relative">
            {/* Background (empty) star */}
            <LuStar
              size={16}
              className="text-malibu-950/20"
            />
            {/* Filled star overlay */}
            {fillPercentage > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <LuStar
                  size={16}
                  className="text-broom-500 fill-broom-500"
                />
              </span>
            )}
          </span>
        ))}
      </div>
      <span className="font-semibold text-malibu-950">{rating.toFixed(1)}</span>
      {onReviewsClick ? (
        <button
          onClick={onReviewsClick}
          className="text-malibu-950/60 hover:text-malibu-950/80 transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          ({reviewCount.toLocaleString()} reviews)
        </button>
      ) : (
        <span className="text-malibu-950/60">
          ({reviewCount.toLocaleString()} reviews)
        </span>
      )}
    </div>
  );
};

export default GoogleRating;
