'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BiNavigation } from 'react-icons/bi';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DraggableHeroProps {
  cityName: string;
  onLocationClick: () => void;
}

// Hero images with initial positions (percentage-based)
// Positions avoid center area where title/location sits
const heroImages = [
  { src: '/hero-1.jpg', alt: 'Family hiking in mountains', x: -5, y: 8, rotate: -5, width: 140, height: 180 },
  { src: '/hero-2.jpg', alt: 'Family at playground', x: 65, y: 5, rotate: 3, width: 130, height: 170 },
  { src: '/hero-3.jpg', alt: 'Child playing at playground', x: 70, y: 60, rotate: -2, width: 120, height: 150 },
  { src: '/hero-4.jpg', alt: 'Parent and child together', x: -3, y: 55, rotate: 4, width: 130, height: 170 },
  { src: '/hero-5.jpg', alt: 'Kids painting outdoors', x: 75, y: 32, rotate: -4, width: 110, height: 140 },
  { src: '/hero-6.jpg', alt: 'Toddlers playing in sandbox', x: -2, y: 32, rotate: 2, width: 100, height: 130 },
  { src: '/hero-7.jpg', alt: 'Kids playing with bubbles', x: 25, y: -2, rotate: -3, width: 110, height: 140 },
  { src: '/hero-8.jpg', alt: 'Family watching hot air balloons', x: 45, y: 68, rotate: 5, width: 110, height: 140 },
];

const DraggableImage: React.FC<{
  image: typeof heroImages[0];
  index: number;
}> = ({ image, index }) => {
  const [zIndex, setZIndex] = useState(index + 1);

  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing p-8 -m-8"
      style={{
        left: `${image.x}%`,
        top: `${image.y}%`,
        zIndex,
      }}
      initial={{ rotate: image.rotate }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setZIndex(100)}
      onDragEnd={() => setZIndex(index + 10)}
      whileHover={{
        scale: 1.08,
        rotate: image.rotate + 3,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileDrag={{
        scale: 1.05,
        cursor: 'grabbing',
      }}
    >
      <motion.div
        className="relative rounded-[20px] overflow-hidden border border-white/40"
        style={{
          width: image.width,
          height: image.height,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        }}
        whileHover={{
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.25)',
        }}
        whileDrag={{
          boxShadow: '0 25px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover pointer-events-none"
          draggable={false}
          unoptimized
        />
      </motion.div>
    </motion.div>
  );
};

const DraggableHero: React.FC<DraggableHeroProps> = ({ cityName, onLocationClick }) => {
  const isMedium = useMediaQuery('(min-width: 768px)');
  const isLarge = useMediaQuery('(min-width: 1024px)');

  // Show fewer images on smaller screens
  const imageCount = isLarge ? 8 : isMedium ? 6 : 4;
  const visibleImages = heroImages.slice(0, imageCount);

  return (
    <section className="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
      {/* Scattered draggable images */}
      {visibleImages.map((image, index) => (
        <DraggableImage key={image.src} image={image} index={index} />
      ))}

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <div className="text-center px-5 pointer-events-auto">
          <h1 className="text-[32px] md:text-[40px] font-bold text-malibu-950 leading-tight mb-4">
            Hundreds of family adventures near
          </h1>

          {/* Location Button */}
          <button
            onClick={onLocationClick}
            className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <BiNavigation size={24} className="text-malibu-950" />
            <span className="text-xl text-malibu-950 underline underline-offset-2">
              {cityName}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DraggableHero;
