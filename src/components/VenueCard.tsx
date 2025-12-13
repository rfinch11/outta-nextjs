'use client';

import React, { useState } from 'react';

interface VenueCardProps {
  id: string;
  name: string;
  logo?: string | null;
  url: string;
}

const VenueCard: React.FC<VenueCardProps> = ({ name, logo, url }) => {
  const [logoError, setLogoError] = useState(false);
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline w-[200px] flex-none"
    >
      <div className="flex flex-col cursor-pointer">
        {/* Logo Container - matches featured card image style */}
        <div className="relative w-full h-[70px] rounded-2xl overflow-hidden mb-3 bg-white flex items-center justify-center">
          {logo && !logoError ? (
            <img
              src={logo}
              alt={`${name} logo`}
              className="max-h-[50px] max-w-[80%] object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-[60px] h-[60px] rounded-full bg-malibu-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-malibu-950">{firstLetter}</span>
            </div>
          )}
        </div>

        {/* Content below - no background, matches featured card style */}
        <div className="flex flex-col gap-1.5">
          {/* Venue Name */}
          <h3 className="text-malibu-950 text-md font-bold leading-tight m-0 break-words line-clamp-2">
            {name}
          </h3>
        </div>
      </div>
    </a>
  );
};

export default VenueCard;
