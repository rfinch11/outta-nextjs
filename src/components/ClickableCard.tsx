'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar, LuMapPin, LuStar, LuStarHalf } from 'react-icons/lu';

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
  organizer?: string | null;
  rating?: number | null;
}

const ClickableCard: React.FC<ClickableCardProps> = ({
  airtable_id,
  title,
  type,
  city,
  image,
  place_id,
  start_date,
  organizer,
  rating,
}) => {
  // State to track if we should use the fallback image
  const [imgSrc, setImgSrc] = React.useState<string>(
    place_id ? `/api/place-photo?place_id=${place_id}&width=400` : image
  );

  // Format date for events (date only, no time)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Render star rating with fractional stars
  const renderStars = (ratingValue: number) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.25 && ratingValue % 1 < 0.75;
    const roundUp = ratingValue % 1 >= 0.75;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars || (i === fullStars && roundUp)) {
        stars.push(
          <LuStar key={i} size={14} className="text-flamenco-500 fill-flamenco-500" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <LuStarHalf key={i} size={14} className="text-flamenco-500 fill-flamenco-500" />
        );
      } else {
        stars.push(
          <LuStar key={i} size={14} className="text-black-300" />
        );
      }
    }
    return stars;
  };

  // Handle image load error by falling back to the original image
  const handleImageError = () => {
    if (imgSrc !== image) {
      setImgSrc(image);
    }
  };

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div className="flex w-full p-2 gap-3 rounded-xl relative cursor-pointer transition-all hover:bg-black-50 hover:shadow-sm">
        {/* Image on the left with chips overlay */}
        <div className="w-[80px] h-[80px] flex-shrink-0">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full rounded-xl object-cover aspect-square"
            onError={handleImageError}
          />
        </div>

        {/* Content on the right */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Organizer */}
          {organizer && (
            <div className="text-black-600 text-sm leading-5 overflow-hidden text-ellipsis line-clamp-1">
              {organizer}
            </div>
          )}
          {/* Title */}
          <h3 className="text-malibu-950 text-base font-bold leading-tight m-0 break-words line-clamp-2">
            {title}
          </h3>

          {/* Date & Location row for Events */}
          {type === 'Event' && start_date && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1 flex-shrink-0">
                <LuCalendar size={14} className="flex-shrink-0 text-black-500" />
                <span>{formatDate(start_date)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-black-500" />
                <span className="truncate">{city}</span>
              </div>
            </div>
          )}

          {/* Rating & Location row for Activities */}
          {type === 'Activity' && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-3 min-w-0">
              {rating && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {renderStars(rating)}
                  <span className="ml-1 text-black-600">{rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-black-500" />
                <span className="truncate">{city}</span>
              </div>
            </div>
          )}

          {/* Rating & Location for Camps */}
          {type === 'Camp' && (
            <div className="text-black-600 text-sm leading-5 flex items-center gap-3 min-w-0">
              {rating && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {renderStars(rating)}
                  <span className="ml-1 text-black-600">{rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-black-500" />
                <span className="truncate">{city}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ClickableCard;
