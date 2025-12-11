'use client';

import React from 'react';
import Link from 'next/link';
import {
  IoGlobeOutline,
} from 'react-icons/io5';
import { IoIosArrowBack } from 'react-icons/io';
import { LuCalendar, LuClock3, LuTag, LuUsers } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';

interface EventDetailProps {
  // Core fields
  airtable_id: string;
  title: string;
  type: 'Event' | 'Activity' | 'Camp';
  description?: string;
  image: string;
  place_id?: string | null;

  // Location
  location_name?: string;
  street?: string;
  city: string;
  state?: string;
  zip?: number;
  latitude?: number;
  longitude?: number;

  // Event details
  start_date?: string;
  price?: string;
  age_range?: string;
  organizer?: string;
  website?: string;
  tags?: string;

  // Meta
  recommended?: boolean;
  place_type?: string;
}

const EventDetail: React.FC<EventDetailProps> = (props) => {
  const {
    airtable_id,
    title,
    description,
    image,
    place_id,
    start_date,
    location_name,
    street,
    city,
    state,
    zip,
    price,
    age_range,
    organizer,
    website,
    tags,
    latitude,
    longitude,
  } = props;

  // State to track if we should use the fallback image
  const [imgSrc, setImgSrc] = React.useState<string>(
    place_id ? `/api/place-photo?place_id=${place_id}&width=800` : image
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle image load error by falling back to the original image
  const handleImageError = () => {
    if (imgSrc !== image) {
      setImgSrc(image);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: title,
      text: description ? description.substring(0, 200) : `Check out this ${props.type.toLowerCase()} on Outta!`,
      url: `${window.location.origin}/listings/${airtable_id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const fullAddress = `${street}, ${city}, ${state} ${zip}`;
  const tagArray = tags?.split(',').map((t) => t.trim()) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Back Button */}
      <div className="sticky top-0 left-0 right-0 z-50 px-5 py-4 pointer-events-none">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all no-underline text-gray-900 pointer-events-auto"
        >
          <IoIosArrowBack size={24} />
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[400px] bg-gray-100 -mt-[58px]">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-0">{title}</h1>

        {/* Event Info Grid */}
        <div className="flex flex-col gap-4 mb-8">
          {start_date && (
            <div className="flex items-center gap-3">
              <LuCalendar size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{formatDate(start_date)}</span>
            </div>
          )}

          {start_date && (
            <div className="flex items-center gap-3">
              <LuClock3 size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{formatTime(start_date)}</span>
            </div>
          )}

          {street && (
            <div className="flex items-center gap-3">
              <HiOutlineLocationMarker size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{fullAddress}</span>
            </div>
          )}

          {price && (
            <div className="flex items-center gap-3">
              <LuTag size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{price}</span>
            </div>
          )}

          {age_range && (
            <div className="flex items-center gap-3">
              <LuUsers size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{age_range}</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        {description && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Details</h2>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        )}

        {/* Tags */}
        {tagArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tagArray.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Location Section */}
        {(location_name || street || latitude) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Location</h2>
            {location_name && (
              <p className="text-base font-semibold text-gray-900 mb-1">{location_name}</p>
            )}
            {street && (
              <p className="text-sm text-gray-600 mb-4">{fullAddress}</p>
            )}

            {/* Embedded Map */}
            {latitude && longitude && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location map"
                />
              </div>
            )}
          </div>
        )}

        {/* Organizer */}
        {organizer && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Event organizer</h2>
            <p className="text-base text-gray-700">{organizer}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2 mb-8">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border-2 border-malibu-950 rounded-[53px] shadow-[3px_4px_0px_0px_#06304b] px-7 py-3.5 text-base font-bold text-gray-900 cursor-pointer no-underline flex items-center justify-center gap-2 hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <IoGlobeOutline size={20} />
              Website
            </a>
          )}
          <button
            onClick={handleShare}
            className="flex-1 bg-broom-400 border-2 border-malibu-950 rounded-[53px] shadow-[3px_4px_0px_0px_#06304b] px-7 py-3.5 text-base font-bold text-black-900 cursor-pointer hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
