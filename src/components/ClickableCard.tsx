'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { getPlaceTypeIcon } from '@/lib/placeTypeIcons';
import Chip from './Chip';

interface ClickableCardProps {
  airtable_id: string;
  title: string;
  type: 'Event' | 'Activity' | 'Camp';
  scout_pick?: boolean | null;
  deal?: boolean | null;
  promoted?: boolean | null;
  city: string;
  distance: string | number;
  image: string;
  place_id?: string | null;
  start_date?: string;
  place_type?: string;
  description?: string;
}

const ClickableCard: React.FC<ClickableCardProps> = ({
  airtable_id,
  title,
  type,
  scout_pick,
  deal,
  promoted,
  city,
  distance,
  image,
  place_id,
  start_date,
  place_type,
  description,
}) => {
  // Format location string
  const locationText = `${city}, ${distance} mi`;

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
  // Otherwise fall back to the stored image URL
  const imageUrl = place_id
    ? `/api/place-photo?place_id=${place_id}&width=400`
    : image;

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div className="flex w-full p-2 gap-2.5 rounded-2xl bg-white border border-gray-300 relative cursor-pointer transition-all hover:shadow-lg">
        {/* Image on the left */}
        <img
          src={imageUrl}
          alt={title}
          className="w-[96px] h-[96px] flex-shrink-0 rounded-xl object-cover aspect-square"
        />

        {/* Content on the right */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Chips row */}
          {(scout_pick || deal || promoted) && (
            <div className="flex gap-1.5 flex-wrap">
              {scout_pick && <Chip variant="scoutpick" />}
              {deal && <Chip variant="deal" />}
              {promoted && <Chip variant="promoted" />}
            </div>
          )}

          {/* Title */}
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
              {React.createElement(getPlaceTypeIcon(place_type), {
                size: 16,
                className: 'flex-shrink-0 text-black-500'
              })}
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

export default ClickableCard;
