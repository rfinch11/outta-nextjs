'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar, LuMapPin, LuStar, LuStarHalf, LuTag } from 'react-icons/lu';
import { getPlaceTypeIcon } from '@/lib/placeTypeIcons';

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
  price?: string | null;
  google_place_details?: {
    photos?: { url: string; width: number; height: number }[];
  } | null;
}

const ClickableCard: React.FC<ClickableCardProps> = ({
  airtable_id,
  title,
  type,
  city,
  image,
  place_id,
  start_date,
  place_type,
  description,
  organizer,
  rating,
  price,
  google_place_details,
}) => {
  // Fallback image for when the primary image fails to load or is missing
  const FALLBACK_IMAGE = '/fallback-img.png';

  // Use the image column directly, fallback if null/empty
  const [imgSrc, setImgSrc] = React.useState<string>(image || FALLBACK_IMAGE);

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
          <LuStar key={i} size={14} className="text-broom-500 fill-broom-500" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <LuStarHalf key={i} size={14} className="text-broom-500 fill-broom-500" />
        );
      } else {
        stars.push(
          <LuStar key={i} size={14} className="text-malibu-950/30" />
        );
      }
    }
    return stars;
  };

  // Handle image load error by using fallback
  const handleImageError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  // Format price for card display (truncate ranges to min+)
  const formatCardPrice = (priceStr: string) => {
    // Check if it's a range (contains " - ")
    if (priceStr.includes(' - ')) {
      const minPrice = priceStr.split(' - ')[0];
      return `${minPrice}+`;
    }
    return priceStr;
  };

  return (
    <Link href={`/listings/${airtable_id}`} className="block no-underline">
      <div className="flex w-full p-2 gap-3 rounded-xl relative cursor-pointer transition-all hover:bg-white hover:shadow-sm">
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
          {/* Organizer & Price for Events only */}
          {type === 'Event' && (organizer || (price && !['see website', 'free'].includes(price.toLowerCase()))) && (
            <div className="text-sm leading-5 flex items-center gap-2 min-w-0">
              {organizer && (
                <span className="text-malibu-950/80 truncate min-w-0">{organizer}</span>
              )}
              {price && !['see website', 'free'].includes(price.toLowerCase()) && (
                <span className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
                  <LuTag size={14} strokeWidth={2.5} />
                  <span className="font-semibold">{formatCardPrice(price)}</span>
                </span>
              )}
            </div>
          )}

          {/* Organizer for Activity and Camp */}
          {(type === 'Activity' || type === 'Camp') && organizer && (
            <div className="text-sm leading-5 text-malibu-950/80 truncate">
              {organizer}
            </div>
          )}

          {/* Star rating + price inline for Activity and Camp */}
          {(type === 'Activity' || type === 'Camp') && (rating || (price && !['see website', 'free'].includes(price.toLowerCase()))) && (
            <div className="flex items-center gap-2 min-w-0">
              {rating && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {renderStars(rating)}
                  <span className="ml-1 text-sm text-malibu-950/80">{rating.toFixed(1)}</span>
                </div>
              )}
              {price && !['see website', 'free'].includes(price.toLowerCase()) && (
                <span className="flex items-center gap-1 text-emerald-600 truncate">
                  <LuTag size={14} strokeWidth={2.5} className="flex-shrink-0" />
                  <span className="font-semibold text-sm truncate">{formatCardPrice(price)}</span>
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-malibu-950 text-lg font-semibold leading-tight m-0 break-words line-clamp-2">
            {title}
          </h3>

          {/* Date & Location row for Events */}
          {type === 'Event' && start_date && (
            <div className="text-malibu-950/80 text-sm leading-5 flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1 flex-shrink-0">
                <LuCalendar size={14} className="flex-shrink-0 text-malibu-950/70" />
                <span>{formatDate(start_date)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-malibu-950/70" />
                <span className="truncate">{city}</span>
              </div>
            </div>
          )}

          {/* Place type & Location row for Activities */}
          {type === 'Activity' && (
            <div className="text-malibu-950/80 text-sm leading-5 flex items-center gap-3 min-w-0">
              {place_type && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {React.createElement(getPlaceTypeIcon(place_type), {
                    size: 14,
                    className: 'flex-shrink-0 text-malibu-950/70',
                  })}
                  <span className="truncate">{place_type}</span>
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-malibu-950/70" />
                <span className="truncate">{city}</span>
              </div>
            </div>
          )}

          {/* Description & Location for Camps */}
          {type === 'Camp' && (
            <>
              {description && (
                <div className="text-malibu-950/80 text-sm leading-5 overflow-hidden text-ellipsis line-clamp-1">
                  {description}
                </div>
              )}
              <div className="text-malibu-950/80 text-sm leading-5 flex items-center gap-1 min-w-0">
                <LuMapPin size={14} className="flex-shrink-0 text-malibu-950/70" />
                <span className="truncate">{city}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ClickableCard;
