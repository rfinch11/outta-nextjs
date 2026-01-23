'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { getPlaceTypeIcon } from '@/lib/placeTypeIcons';
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
  google_place_details?: {
    photos?: { url: string; width: number; height: number }[];
  } | null;
}

/**
 * FeaturedCard - Individual card for carousel displays
 *
 * @description
 * A vertical card component designed for horizontal scrolling carousels.
 * Features a large image on top with content below.
 *
 * @layout
 * - Fixed width: 300px (set by parent carousel)
 * - Image: 3:2 aspect ratio (300px × 200px)
 * - Stacked: Image → Title → Metadata → Location
 *
 * @features
 * - Smart image loading with Google Place API fallback
 * - Chip badges overlaid on image (scout_pick, deal, promoted)
 * - Type-specific metadata (Events: date, Activities: type, Camps: description)
 * - Clickable link to listing detail page
 *
 * @usage
 * ```tsx
 * <FeaturedCard
 *   airtable_id="rec123"
 *   title="Summer Festival"
 *   image="https://..."
 *   type="Event"
 *   start_date="2026-06-15T14:00:00"
 *   city="San Francisco"
 *   distance={5.2}
 *   scout_pick={true}
 * />
 * ```
 *
 * @see CAROUSEL_PATTERN.md for complete documentation
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
  google_place_details,
}) => {
  // Use the image column directly (no Google API calls)
  const [imgSrc, setImgSrc] = React.useState<string>(image || '');

  // Format location string (city only for cleaner look)
  const locationText = city;

  // Format date for events (date only for cleaner carousel display)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Fallback image for when the primary image fails to load
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80';

  // Handle image load error by using fallback
  const handleImageError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div className="flex flex-col cursor-pointer">
        {/* Image with rounded corners and chips overlay */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-3">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover"
            onError={handleImageError}
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
          {/* Title - single line with ellipsis */}
          <h3 className="text-malibu-950 text-base font-bold leading-tight m-0 break-words line-clamp-1">
            {title}
          </h3>

          {/* Metadata - Date/Type and Location on same line */}
          {/* Priority 1: Show date if available (for any type) */}
          {start_date && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
              <LuCalendar size={16} className="flex-shrink-0 text-black-500" />
              <span className="truncate">{formatDate(start_date)}</span>
              <HiOutlineLocationMarker size={16} className="flex-shrink-0 text-black-500 ml-2" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          {/* Priority 2: Show place type for Activities without dates */}
          {!start_date && type === 'Activity' && place_type && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
              {React.createElement(getPlaceTypeIcon(place_type), {
                size: 16,
                className: 'flex-shrink-0 text-black-500',
              })}
              <span className="truncate">{place_type}</span>
              <HiOutlineLocationMarker size={16} className="flex-shrink-0 text-black-500 ml-2" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          {/* Camps: Description and Location */}
          {type === 'Camp' && (
            <>
              {description && (
                <div className="text-black-600 text-sm leading-5 overflow-hidden text-ellipsis line-clamp-2">
                  {description}
                </div>
              )}
              <div className="text-black-600 text-sm leading-5 flex items-center gap-1.5">
                <HiOutlineLocationMarker size={16} className="flex-shrink-0 text-black-500" />
                <span className="truncate">{locationText}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default FeaturedCard;
