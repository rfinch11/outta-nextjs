'use client';

import React from 'react';
import Link from 'next/link';
import { IoIosArrowBack } from 'react-icons/io';
import { LuCalendar, LuClock3, LuTag, LuUsers, LuFlag, LuShare, LuGlobe } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import ActionBar from './ActionBar';

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

  // State to track current page URL
  const [currentUrl, setCurrentUrl] = React.useState<string>('');

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

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
      text: description
        ? description.substring(0, 200)
        : `Check out this ${props.type.toLowerCase()} on Outta!`,
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

  // Handle add to calendar
  const handleAddToCalendar = () => {
    if (!start_date) return;

    const event = {
      title: title,
      description: description || '',
      location: street ? `${street}, ${city}, ${state} ${zip}` : `${city}, ${state}`,
      start: new Date(start_date),
      duration: 2, // Default 2 hour duration
    };

    // Calculate end time (2 hours after start)
    const endDate = new Date(event.start);
    endDate.setHours(endDate.getHours() + event.duration);

    // Format dates for iCalendar format (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Create .ics file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Outta//Event//EN',
      'BEGIN:VEVENT',
      `UID:${airtable_id}@outta.events`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(event.start)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      website ? `URL:${website}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const fullAddress = `${street}, ${city}, ${state} ${zip}`;
  const tagArray = tags?.split(',').map((t) => t.trim()) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Back Button - Always visible */}
      <div className="fixed top-5 left-5 z-50 mt-2.5">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all no-underline text-malibu-950"
        >
          <IoIosArrowBack size={24} />
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative w-full max-w-3xl mx-auto px-5 pt-16">
        <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-3xl font-bold text-malibu-950 mb-6 mt-0">{title}</h1>

        {/* Event Info Grid */}
        <div className="flex flex-col gap-4 mb-8">
          {start_date && (
            <div className="flex items-center gap-3">
              <LuCalendar size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{formatDate(start_date)}</span>
            </div>
          )}

          {start_date && (
            <div className="flex items-center gap-3">
              <LuClock3 size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{formatTime(start_date)}</span>
            </div>
          )}

          {street && (
            <div className="flex items-center gap-3">
              <HiOutlineLocationMarker size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{fullAddress}</span>
            </div>
          )}

          {price && (
            <div className="flex items-center gap-3">
              <LuTag size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{price}</span>
            </div>
          )}

          {age_range && (
            <div className="flex items-center gap-3">
              <LuUsers size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{age_range}</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        {description && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Details</h2>
            <p className="text-base text-malibu-950/80 leading-relaxed whitespace-pre-wrap">
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
                className="inline-block px-3 py-1.5 bg-gray-100 text-malibu-950/80 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Location Section */}
        {(location_name || street || latitude) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Location</h2>
            {location_name && (
              <p className="text-base font-semibold text-malibu-950 mb-1">{location_name}</p>
            )}
            {street && <p className="text-sm text-malibu-950/70 mb-4">{fullAddress}</p>}

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
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Event organizer</h2>
            <p className="text-base text-malibu-950/80">{organizer}</p>
          </div>
        )}

        {/* Report Listing */}
        <div className="text-center mt-6 mb-8">
          <a
            href={`mailto:rfinch@outta.events?subject=Report listing ${currentUrl || `https://outta.events/listings/${airtable_id}`}`}
            className="text-sm text-malibu-950/50 hover:text-malibu-950/80 flex items-center justify-center gap-1.5"
          >
            <LuFlag size={16} />
            Report listing
          </a>
        </div>
      </div>

      {/* Fixed Action Bar - Top Right */}
      <ActionBar position="top-right">
        <ActionBar.Button onClick={handleShare} aria-label="Share">
          <LuShare size={17} />
        </ActionBar.Button>

        {start_date && (
          <ActionBar.Button onClick={handleAddToCalendar} aria-label="Add to calendar">
            <LuCalendar size={17} />
          </ActionBar.Button>
        )}

        {website && (
          <ActionBar.Button
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit website"
          >
            <LuGlobe size={17} />
          </ActionBar.Button>
        )}
      </ActionBar>
    </div>
  );
};

export default EventDetail;
