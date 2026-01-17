'use client';

import React from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
  images: { src: string; alt: string }[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ images }) => {
  // Triple images for seamless infinite scroll
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <div className="w-full overflow-x-clip overflow-y-visible">
      {/* Scrolling track */}
      <div className="flex gap-3 animate-scroll-left w-max">
        {duplicatedImages.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className="relative flex-shrink-0 h-[250px] sm:h-[280px] md:h-[320px] lg:h-[360px] rounded-xl shadow-lg overflow-hidden"
          >
            <Image
              src={image.src}
              alt={image.alt}
              height={720}
              width={1080}
              className="h-full w-auto object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
