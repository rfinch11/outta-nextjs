'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { IoBusinessOutline } from 'react-icons/io5';
import Chip from './Chip';

interface FeaturedCardProps {
  airtable_id: string;
  title: string;
  image?: string;
  place_id?: string;
  type: 'Event' | 'Activity' | 'Camp';
  start_date?: string;
  place_type?: string;
  description?: string;
  city: string;
  distance?: number;
  scout_pick?: boolean;
  deal?: boolean;
  promoted?: boolean;
}

/**
 * FeaturedCard component for featured listings carousel
 * Features a stacked layout with image on top
 */
const FeaturedCard: React.FC<FeaturedCardProps> = ({
  airtable_id,
  title,
  image,
  place_id,
  type,
  start_date,
  place_type,
  description,
  city,
  distance,
  scout_pick,
  deal,
  promoted,
}) => {
  // Format location string
  const locationText = distance ? `${city}, ${distance} mi` : city;

  // Format date for events
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Use Google Places API for images if place_id is available
  const imageUrl = place_id
    ? `/api/place-photo?place_id=${place_id}&width=600`
    : image;

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div className="flex flex-col cursor-pointer">
        {/* Image with rounded corners and chips overlay */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Chips overlaid on top left of image */}
          {(scout_pick || deal || promoted) && (
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {scout_pick && <Chip variant="scoutpick" />}
              {deal && <Chip variant="deal" />}
              {promoted && <Chip variant="promoted" />}
            </div>
          )}
        </div>

        {/* Content below - no background */}
        <div className="flex flex-col gap-1.5">
          {/* Title - max 2 lines with ellipsis */}
          <h3 className="text-malibu-950 text-lg font-bold leading-tight m-0 break-words line-clamp-2">
            {title}
          </h3>

          {/* Date for Events */}
          {type === 'Event' && start_date && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
              <LuCalendar size={16} className="flex-shrink-0 text-black-500" />
              <span className="truncate">{formatDate(start_date)}</span>
            </div>
          )}

          {/* Place type for Activities */}
          {type === 'Activity' && place_type && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
              <IoBusinessOutline size={16} className="flex-shrink-0 text-black-500" />
              <span className="truncate">{place_type}</span>
            </div>
          )}

          {/* Description for Camps */}
          {type === 'Camp' && description && (
            <div className="text-black-600 text-sm leading-5 overflow-hidden text-ellipsis line-clamp-2">
              {description}
            </div>
          )}

          {/* Location */}
          <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
            <HiOutlineLocationMarker size={16} className="flex-shrink-0 text-black-500" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedCard;
