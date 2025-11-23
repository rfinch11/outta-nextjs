'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedListing {
  airtable_id: string;
  title: string;
  type: string;
  city: string;
  image: string;
  description?: string;
  place_type?: string;
  start_date?: string;
}

interface FeaturedCarouselProps {
  listings: FeaturedListing[];
}

/**
 * Prototype 1: Classic Carousel with Peek
 * - Full-width hero with large featured card
 * - Previous/next cards peek from the sides
 * - Auto-scrolling every 5 seconds
 * - Gradient overlay on images for text readability
 * - Clean, modern look with emphasis on images
 */
const FeaturedCarousel_Prototype1: React.FC<FeaturedCarouselProps> = ({ listings }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || listings.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, listings.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % listings.length);
    setIsAutoPlaying(false);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (listings.length === 0) return null;

  const getPrevIndex = () => (currentIndex - 1 + listings.length) % listings.length;
  const getNextIndex = () => (currentIndex + 1) % listings.length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden bg-outta-dark">
      {/* Previous card (peek) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[200px] h-[400px] opacity-40 hover:opacity-60 transition-opacity cursor-pointer z-10 hidden lg:block">
        <div className="relative w-full h-full rounded-r-2xl overflow-hidden">
          <Image
            src={listings[getPrevIndex()].image}
            alt={listings[getPrevIndex()].title}
            fill
            className="object-cover"
            sizes="200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50" />
        </div>
      </div>

      {/* Main featured card */}
      <div className="absolute inset-0 flex items-center justify-center px-4 lg:px-[240px]">
        <Link
          href={`/listings/${listings[currentIndex].airtable_id}`}
          className="relative w-full max-w-[900px] h-[450px] rounded-3xl overflow-hidden shadow-2xl group"
        >
          {/* Background Image */}
          <Image
            src={listings[currentIndex].image}
            alt={listings[currentIndex].title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="900px"
            priority
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            {/* Type Badge */}
            <div className="inline-block px-4 py-2 bg-outta-yellow text-black font-bold rounded-full text-sm mb-4">
              {listings[currentIndex].type}
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
              {listings[currentIndex].title}
            </h2>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-lg mb-4">
              <span className="flex items-center gap-2">
                📍 {listings[currentIndex].city}
              </span>
              {listings[currentIndex].start_date && (
                <span className="flex items-center gap-2">
                  📅 {formatDate(listings[currentIndex].start_date)}
                </span>
              )}
              {listings[currentIndex].place_type && (
                <span className="flex items-center gap-2">
                  🏛️ {listings[currentIndex].place_type}
                </span>
              )}
            </div>

            {/* Description */}
            {listings[currentIndex].description && (
              <p className="text-base text-white/90 line-clamp-2 max-w-2xl">
                {listings[currentIndex].description}
              </p>
            )}
          </div>

          {/* Recommended Badge (top right) */}
          <div className="absolute top-6 right-6 px-4 py-2 bg-outta-green text-white font-semibold rounded-full text-sm shadow-lg">
            ⭐ Recommended
          </div>
        </Link>
      </div>

      {/* Next card (peek) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[200px] h-[400px] opacity-40 hover:opacity-60 transition-opacity cursor-pointer z-10 hidden lg:block">
        <div className="relative w-full h-full rounded-l-2xl overflow-hidden">
          <Image
            src={listings[getNextIndex()].image}
            alt={listings[getNextIndex()].title}
            fill
            className="object-cover"
            sizes="200px"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/50" />
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 lg:left-[210px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg z-20 transition-all"
        aria-label="Previous"
      >
        <span className="text-2xl">←</span>
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 lg:right-[210px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg z-20 transition-all"
        aria-label="Next"
      >
        <span className="text-2xl">→</span>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {listings.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel_Prototype1;
