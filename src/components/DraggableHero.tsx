'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BiNavigation } from 'react-icons/bi';

interface CardStackHeroProps {
  cityName: string;
  onLocationClick: () => void;
}

const heroImages = [
  '/hero/alberto-casetta-REKXJ7JhwiI-unsplash.jpg',
  '/hero/anthony-persegol-f5NSi7tuMec-unsplash.jpg',
  '/hero/bambi-corro-fn3puWB0pHY-unsplash.jpg',
  '/hero/caroline-hernandez-yl1wEVqEY8k-unsplash.jpg',
  '/hero/createasea-IcI6DNcpJfc-unsplash.jpg',
  '/hero/fabian-centeno-uY60pJUHqOo-unsplash.jpg',
  '/hero/katherine-hanlon--WGk8tfkMAw-unsplash.jpg',
  '/hero/kenny-krosky-2xjk8WWLFC4-unsplash.jpg',
  '/hero/ricardo-maruri-THn-kqNgZ8A-unsplash.jpg',
  '/hero/thiago-cerqueira-Wr3HGvx_RSM-unsplash.jpg',
  '/hero/vitolda-klein-vknNquR-VcQ-unsplash.jpg',
];

const CARD_WIDTH = 220;
const CARD_HEIGHT = 260;

const AUTO_ROTATE_INTERVAL = 2000;
const VISIBLE_CARDS = 3;

const CardStack: React.FC<{ onSwipe?: () => void }> = ({ onSwipe }) => {
  const [order, setOrder] = useState(() => heroImages.map((_, i) => i));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const rotateToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setOrder((prev) => {
      const newOrder = [...prev];
      const first = newOrder.shift()!;
      newOrder.push(first);
      return newOrder;
    });
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    if (hasInteracted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(rotateToNext, AUTO_ROTATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hasInteracted]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasInteracted(true);
    rotateToNext();
    onSwipe?.();
  };

  const visibleOrder = order.slice(0, VISIBLE_CARDS);

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      onClick={handleClick}
    >
      {visibleOrder.map((imageIndex, stackPosition) => {
        const isTop = stackPosition === 0;

        const configs = [
          { x: 0, y: 0, rotate: 0, scale: 1 },
          { x: -15, y: 6, rotate: -4, scale: 0.97 },
          { x: 12, y: 10, rotate: 3, scale: 0.94 },
        ];

        const config = configs[stackPosition] || configs[2];

        return (
          <motion.div
            key={imageIndex}
            className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '4px solid white',
              zIndex: VISIBLE_CARDS - stackPosition,
            }}
            initial={false}
            animate={{
              x: config.x,
              y: config.y,
              rotate: config.rotate,
              scale: config.scale,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            whileHover={isTop ? { scale: 1.02 } : undefined}
            whileTap={isTop ? { scale: 0.98 } : undefined}
          >
            <Image
              src={heroImages[imageIndex]}
              alt="Family activity"
              fill
              className="object-cover pointer-events-none"
              draggable={false}
              unoptimized
            />
          </motion.div>
        );
      })}
    </div>
  );
};

const CardStackHero: React.FC<CardStackHeroProps> = ({ cityName, onLocationClick }) => {
  return (
    <section className="w-full py-8 md:py-12">
      {/* Mobile: Stack on top, centered */}
      <div className="flex flex-col items-center gap-8 md:hidden px-5">
        <CardStack />
        <div className="text-center">
          <h1 className="text-[28px] font-semibold text-malibu-950 leading-tight mb-4">
            Hundreds of family adventures near
          </h1>
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

      {/* Tablet/Desktop: Side by side */}
      <div className="hidden md:flex items-center justify-center gap-12 lg:gap-20 px-8 max-w-5xl mx-auto">
        <CardStack />
        <div className="text-left">
          <h1 className="text-[36px] lg:text-[40px] font-semibold text-malibu-950 leading-tight mb-4">
            Hundreds of family<br />adventures near
          </h1>
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

export default CardStackHero;
