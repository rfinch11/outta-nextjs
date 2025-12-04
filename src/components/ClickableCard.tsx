'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoCalendarOutline, IoLocationOutline, IoBusinessOutline } from 'react-icons/io5';

interface ClickableCardProps {
  airtable_id: string;
  title: string;
  type: 'Event' | 'Activity' | 'Camp';
  recommended?: boolean | null;
  city: string;
  distance: string | number;
  image: string;
  start_date?: string;
  place_type?: string;
  description?: string;
}

const ClickableCard: React.FC<ClickableCardProps> = ({
  airtable_id,
  title,
  type,
  recommended,
  city,
  distance,
  image,
  start_date,
  place_type,
  description,
}) => {
  // Format location string
  const locationText = `${city} • ${distance} mi`;

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

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div
        className={`flex w-full p-2 sm:p-2.5 gap-2 sm:gap-2.5 rounded-2xl bg-white relative cursor-pointer transition-all hover:shadow-lg ${
          recommended ? 'border-2 border-flamenco-500' : 'border border-gray-300'
        }`}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {recommended && (
            <div className="flex px-1.5 py-1 justify-center items-center gap-2.5 rounded-lg bg-flamenco-500 text-white text-[10px] font-bold leading-none mb-1 self-start">
              Recommended
            </div>
          )}

          <h3 className="text-gray-900 text-lg font-bold leading-normal m-0 break-words">{title}</h3>

          {type === 'Event' && start_date && (
            <div className="text-gray-700 text-sm leading-6 flex items-center gap-1.5">
              <IoCalendarOutline size={16} className="flex-shrink-0" />
              <span className="truncate">{formatDate(start_date)}</span>
            </div>
          )}

          {type === 'Activity' && place_type && (
            <div className="text-gray-700 text-sm leading-6 flex items-center gap-1.5">
              <IoBusinessOutline size={16} className="flex-shrink-0" />
              <span className="truncate">{place_type}</span>
            </div>
          )}

          {type === 'Camp' && description && (
            <div className="text-gray-700 text-sm leading-[18px] overflow-hidden text-ellipsis line-clamp-3">
              {description}
            </div>
          )}

          <div className="text-gray-700 text-sm leading-6 flex items-center gap-1.5">
            <IoLocationOutline size={16} className="flex-shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>

        <Image
          src={image}
          alt={title}
          width={120}
          height={120}
          className="w-20 h-20 sm:w-28 sm:h-28 md:w-[120px] md:h-[120px] flex-shrink-0 rounded-lg object-cover aspect-square"
        />
      </div>
    </Link>
  );
};

export default ClickableCard;
