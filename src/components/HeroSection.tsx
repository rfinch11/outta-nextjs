'use client';

import React from 'react';
import Image from 'next/image';
import { BiNavigation } from 'react-icons/bi';
import Float from './Float';

interface HeroSectionProps {
  cityName: string;
  onLocationClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ cityName, onLocationClick }) => {
  return (
    <section className="px-5 pt-2 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Floating Images Container */}
        <div className="relative h-[280px] flex items-center justify-center mb-4" style={{ perspective: '1000px' }}>
          {/* Left Image - Joyful child */}
          <Float
            speed={0.3}
            amplitude={[8, 12, 0]}
            rotationRange={[0, 0, 0]}
            timeOffset={0}
            className="absolute left-1/2 -translate-x-[85%] z-10"
          >
            <div
              className="relative w-[180px] h-[240px] rounded-xl shadow-lg overflow-hidden"
              style={{ transform: 'rotate(-12deg)' }}
            >
              <Image
                src="/hero-1.jpg"
                alt="Child being lifted joyfully"
                fill
                className="object-cover"
                sizes="180px"
                priority
                unoptimized
              />
            </div>
          </Float>

          {/* Right Image - Hot air balloons */}
          <Float
            speed={0.3}
            amplitude={[8, 12, 0]}
            rotationRange={[0, 0, 0]}
            timeOffset={2}
            className="absolute left-1/2 -translate-x-[15%] z-20"
          >
            <div
              className="relative w-[180px] h-[240px] rounded-xl shadow-lg overflow-hidden"
              style={{ transform: 'rotate(8deg)' }}
            >
              <Image
                src="/hero-2.jpg"
                alt="Family watching hot air balloons"
                fill
                className="object-cover"
                sizes="180px"
                priority
                unoptimized
              />
            </div>
          </Float>
        </div>

        {/* Hero Copy */}
        <div className="text-center">
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
      </div>
    </section>
  );
};

export default HeroSection;
