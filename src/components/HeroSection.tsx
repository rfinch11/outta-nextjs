'use client';

import React from 'react';
import DraggableHero from './DraggableHero';

interface HeroSectionProps {
  cityName: string;
  onLocationClick: () => void;
  listingCount?: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ cityName, onLocationClick, listingCount }) => {
  return <DraggableHero cityName={cityName} onLocationClick={onLocationClick} listingCount={listingCount} />;
};

export default HeroSection;
