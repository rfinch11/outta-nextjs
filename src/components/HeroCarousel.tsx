'use client';

import React from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
  images: { src: string; alt: string }[];
  direction?: 'left' | 'right';
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ images, direction = 'left' }) => {
  // Triple images for seamless infinite scroll
  const duplicatedImages = [...images, ...images, ...images];

  const animationClass = direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right';

  return (
    <div className="w-full overflow-hidden">
      {/* Scrolling track */}
      <div className={`flex gap-3 ${animationClass} w-max`}>
        {duplicatedImages.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className="relative flex-shrink-0 h-[100px] rounded-xl shadow-lg overflow-hidden"
          >
            <Image
              src={image.src}
              alt={image.alt}
              height={100}
              width={150}
              className="h-full w-auto object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
