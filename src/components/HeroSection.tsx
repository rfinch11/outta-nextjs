'use client';

import React from 'react';
import DraggableHero from './DraggableHero';

interface HeroSectionProps {
  cityName: string;
  onLocationClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ cityName, onLocationClick }) => {
  return <DraggableHero cityName={cityName} onLocationClick={onLocationClick} />;
};

export default HeroSection;
