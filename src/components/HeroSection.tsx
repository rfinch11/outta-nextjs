'use client';

import React from 'react';
import { BiNavigation } from 'react-icons/bi';
import HeroCarousel from './HeroCarousel';

interface HeroSectionProps {
  cityName: string;
  onLocationClick: () => void;
}

// Hero images
const heroImages = [
  { src: '/hero-1.jpg', alt: 'Family hiking in mountains' },
  { src: '/hero-2.jpg', alt: 'Family at playground' },
  { src: '/hero-3.jpg', alt: 'Child playing at playground' },
  { src: '/hero-4.jpg', alt: 'Parent and child together' },
  { src: '/hero-5.jpg', alt: 'Kids painting outdoors' },
  { src: '/hero-6.jpg', alt: 'Toddlers playing in sandbox' },
  { src: '/hero-7.jpg', alt: 'Kids playing with bubbles' },
  { src: '/hero-8.jpg', alt: 'Family watching hot air balloons' },
  { src: '/hero-9.jpg', alt: 'Kids at outdoor event' },
  { src: '/hero-10.jpg', alt: 'Family adventure' },
  { src: '/hero-11.jpg', alt: 'Kids at outdoor activity' },
  { src: '/hero-12.jpg', alt: 'Child being lifted joyfully' },
  { src: '/hero-13.jpg', alt: 'Kids learning together' },
  { src: '/hero-14.jpg', alt: 'Dad walking with kids by the water' },
];

const HeroSection: React.FC<HeroSectionProps> = ({ cityName, onLocationClick }) => {
  return (
    <section className="pt-2 pb-6">
      {/* Hero Carousel */}
      <div className="mb-4">
        <HeroCarousel images={heroImages} />
      </div>

      {/* Hero Copy */}
      <div className="text-center px-5">
        <h1 className="text-[28px] font-bold text-malibu-950 leading-tight mb-3">
          Hundreds of family
          <br />
          adventures near
        </h1>

        {/* Location Button */}
        <button
          onClick={onLocationClick}
          className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
        >
          <BiNavigation size={20} className="text-malibu-950" />
          <span className="text-lg text-malibu-950 underline underline-offset-2">
            {cityName}
          </span>
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
