'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoPricetagOutline,
  IoPeopleOutline,
  IoGlobeOutline,
} from 'react-icons/io5';

interface EventDetailProps {
  // Core fields
  airtable_id: string;
  title: string;
  type: 'Event' | 'Activity' | 'Camp';
  description?: string;
  image: string;

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
    title,
    description,
    image,
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
    const startTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    // Add 30 minutes for end time
    const endDate = new Date(date.getTime() + 30 * 60000);
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${startTime} - ${endTime}`;
  };

  const fullAddress = `${street}, ${city}, ${state} ${zip}`;
  const tagArray = tags?.split(',').map((t) => t.trim()) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors no-underline text-gray-900 text-xl"
        >
          ←
        </Link>
        <Image src="/Outta_logo.svg" alt="Outta" width={120} height={32} className="h-8 w-auto" />
      </header>

      {/* Hero Image */}
      <div className="relative w-full h-[300px] bg-gray-100">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-0">{title}</h1>

        {/* Event Info Grid */}
        <div className="flex flex-col gap-4 mb-8">
          {start_date && (
            <div className="flex items-center gap-3">
              <IoCalendarOutline size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{formatDate(start_date)}</span>
            </div>
          )}

          {start_date && (
            <div className="flex items-center gap-3">
              <IoTimeOutline size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{formatTime(start_date)}</span>
            </div>
          )}

          {street && (
            <div className="flex items-center gap-3">
              <IoLocationOutline size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{fullAddress}</span>
            </div>
          )}

          {price && (
            <div className="flex items-center gap-3">
              <IoPricetagOutline size={20} className="text-gray-600 flex-shrink-0" />
              <span className="text-base text-gray-800">{price}</span>
            </div>
          )}

          {age_range && (
            <div className="flex items-center gap-3">
              <IoPeopleOutline size={20} className="text-gray-600 flex-shrink-0" />
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
        {location_name && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Location</h2>
            <p className="text-base font-semibold text-gray-900 mb-1">{location_name}</p>
            <p className="text-sm text-gray-600 mb-4">{fullAddress}</p>

            {/* Map link */}
            {latitude && longitude && (
              <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-outta-orange font-semibold text-sm no-underline hover:underline"
                >
                  View larger map
                </a>
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
              className="flex-1 bg-white border-2 border-black rounded-[53px] shadow-[3px_4px_0px_0px_#000000] px-7 py-3.5 text-base font-bold text-gray-900 cursor-pointer no-underline flex items-center justify-center gap-2 hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <IoGlobeOutline size={20} />
              Event website
            </a>
          )}
          <button className="flex-1 bg-outta-yellow border-2 border-black rounded-[53px] shadow-[3px_4px_0px_0px_#000000] px-7 py-3.5 text-base font-bold text-gray-900 cursor-pointer hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            Share event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
