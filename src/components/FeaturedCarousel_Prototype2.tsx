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
 * Prototype 2: Modern Stacked Cards
 * - Cards stack with depth/perspective effect
 * - Next card peeks from behind with scale/rotation
 * - Smooth animations on transition
 * - More compact, modern look
 * - Stronger gradient for better contrast
 */
const FeaturedCarousel_Prototype2: React.FC<FeaturedCarouselProps> = ({ listings }) => {
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

  const getNextIndex = () => (currentIndex + 1) % listings.length;
  const getSecondNextIndex = () => (currentIndex + 2) % listings.length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-outta-blue to-white overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-center px-4 py-8">
        {/* Card Stack Container */}
        <div className="relative w-full max-w-4xl h-[450px]">
          {/* Background Card (third in stack) - Only on larger screens */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              transform: 'translateY(30px) scale(0.88) rotateX(2deg)',
              zIndex: 1,
            }}
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-lg opacity-30">
              <Image
                src={listings[getSecondNextIndex()].image}
                alt={listings[getSecondNextIndex()].title}
                fill
                className="object-cover"
                sizes="800px"
              />
            </div>
          </div>

          {/* Next Card (second in stack) */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              transform: 'translateY(20px) scale(0.93) rotateX(1deg)',
              zIndex: 2,
            }}
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl opacity-50 hover:opacity-70 transition-opacity">
              <Image
                src={listings[getNextIndex()].image}
                alt={listings[getNextIndex()].title}
                fill
                className="object-cover"
                sizes="900px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>

          {/* Current/Active Card */}
          <Link
            href={`/listings/${listings[currentIndex].airtable_id}`}
            className="absolute inset-0 z-10"
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl group transform transition-transform duration-300 hover:scale-[1.02]">
              {/* Background Image */}
              <Image
                src={listings[currentIndex].image}
                alt={listings[currentIndex].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="1000px"
                priority
              />

              {/* Stronger Gradient Overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

              {/* Content Container */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                {/* Top Section - Type and Recommended */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <div className="px-4 py-2 bg-outta-yellow text-black font-bold rounded-full text-sm shadow-lg">
                    {listings[currentIndex].type}
                  </div>
                  <div className="px-4 py-2 bg-outta-green text-white font-semibold rounded-full text-sm shadow-lg flex items-center gap-2">
                    <span>⭐</span>
                    <span className="hidden sm:inline">Recommended</span>
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="space-y-3">
                  {/* Title */}
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {listings[currentIndex].title}
                  </h2>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base">
                    <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      📍 {listings[currentIndex].city}
                    </span>
                    {listings[currentIndex].start_date && (
                      <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        📅 {formatDate(listings[currentIndex].start_date)}
                      </span>
                    )}
                    {listings[currentIndex].place_type && (
                      <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        🏛️ {listings[currentIndex].place_type}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {listings[currentIndex].description && (
                    <p className="text-sm md:text-base text-white/95 line-clamp-2 max-w-3xl drop-shadow-md">
                      {listings[currentIndex].description}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 text-outta-yellow font-semibold text-base group-hover:gap-3 transition-all">
                      <span>Explore</span>
                      <span className="text-xl">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            className="w-12 h-12 rounded-full bg-white hover:bg-outta-yellow flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous"
          >
            <span className="text-2xl">←</span>
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {listings.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-outta-yellow w-8 shadow-md'
                    : 'bg-white/60 hover:bg-white w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white hover:bg-outta-yellow flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Next"
          >
            <span className="text-2xl">→</span>
          </button>
        </div>
      </div>

      {/* Progress Bar (optional) */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-outta-yellow"
            style={{
              animation: 'progress 5s linear infinite',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FeaturedCarousel_Prototype2;
