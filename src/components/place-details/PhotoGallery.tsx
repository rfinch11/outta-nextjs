'use client';

import React, { useState, useRef } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import type { PlacePhoto } from '@/lib/googlePlaces';

interface PhotoGalleryProps {
  photos: PlacePhoto[];
  fallbackImage: string;
  title: string;
}

/**
 * Smooth swipeable photo carousel with dot indicators using scroll-snap
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  fallbackImage,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hasMultiplePhotos = photos.length > 1;

  // Handle scroll to update current index
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < photos.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Scroll to specific index
  const goToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const itemWidth = container.offsetWidth;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
    setCurrentIndex(index);
  };

  // If no photos, show fallback
  if (photos.length === 0) {
    return (
      <div className="relative w-full max-w-3xl mx-auto px-5">
        <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden shadow-lg">
          <img
            src={fallbackImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto px-5">
      <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden shadow-lg">
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        >
          {photos.map((photo, index) => (
            <div
              key={index}
              className="flex-none w-full h-full snap-center"
            >
              <img
                src={photo.url}
                alt={`${title}${index > 0 ? ` photo ${index + 1}` : ''}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows (md and up) */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={() => goToIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-default border-none cursor-pointer p-2 rounded-full hidden md:flex items-center justify-center"
              aria-label="Previous photo"
            >
              <LuChevronLeft size={24} />
            </button>
            <button
              onClick={() => goToIndex(currentIndex + 1)}
              disabled={currentIndex === photos.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-default border-none cursor-pointer p-2 rounded-full hidden md:flex items-center justify-center"
              aria-label="Next photo"
            >
              <LuChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`h-2 rounded-full border-none cursor-pointer transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/70 w-2'
                }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
            {photos.length > 10 && (
              <span className="text-white/70 text-xs ml-1">
                +{photos.length - 10}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;
