'use client';

import React from 'react';
import DraggableHero from './DraggableHero';

interface HeroSectionProps {
  cityName: string;
  onLocationClick: () => void;
  listingCount?: number;
  showRequestCTA?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ cityName, onLocationClick, listingCount, showRequestCTA }) => {
  return <DraggableHero cityName={cityName} onLocationClick={onLocationClick} listingCount={listingCount} showRequestCTA={showRequestCTA} />;
};

export default HeroSection;
