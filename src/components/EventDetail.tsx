'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IoIosArrowBack } from 'react-icons/io';
import { LuCalendar, LuClock3, LuTag, LuUsers, LuFlag, LuShare, LuGlobe, LuArrowUpRight } from 'react-icons/lu';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import { calculateDistance } from '@/lib/filterUtils';
import ClickableCard from './ClickableCard';
import { usePlaceDetails } from '@/hooks/usePlaceDetails';
import {
  GoogleRating,
  BusinessHours,
  PhotoGallery,
  Reviews,
} from '@/components/place-details';

import type { PlaceOpeningHours } from '@/lib/googlePlaces';

// Helper component for inline open status badge
const OpenStatusBadge: React.FC<{ openingHours: PlaceOpeningHours }> = ({ openingHours }) => {
  const { weekdayText } = openingHours;

  // Calculate if currently open based on weekdayText (client-side for accuracy)
  const now = new Date();
  const dayIndex = now.getDay();
  const googleDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const todayHours = weekdayText[googleDayIndex];

  let isOpen = false;
  let statusText = 'Closed';

  if (todayHours && !todayHours.toLowerCase().includes('closed')) {
    // Check for 24 hours
    if (todayHours.toLowerCase().includes('24 hours') || todayHours.toLowerCase().includes('open 24')) {
      isOpen = true;
      statusText = 'Open 24 hours';
    } else {
      const timeMatch = todayHours.match(
        /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i
      );

      if (timeMatch) {
        const [, openHour, openMin = '00', openPeriod, closeHour, closeMin = '00', closePeriod] = timeMatch;

        const parseTime = (hour: string, min: string, period: string) => {
          let h = parseInt(hour, 10);
          if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (period.toUpperCase() === 'AM' && h === 12) h = 0;
          return h * 60 + parseInt(min, 10);
        };

        const openTime = parseTime(openHour, openMin, openPeriod);
        const closeTime = parseTime(closeHour, closeMin, closePeriod);
        const currentTime = now.getHours() * 60 + now.getMinutes();

        isOpen = currentTime >= openTime && currentTime < closeTime;

        if (isOpen) {
          statusText = `Open · Closes ${closeHour}${closeMin !== '00' ? ':' + closeMin : ''} ${closePeriod}`;
        }
      }
    }
  }

  return isOpen ? (
    <span className="text-base text-emerald-700">{statusText}</span>
  ) : (
    <span className="text-base text-malibu-950/60">{statusText}</span>
  );
};

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

  // Fetch Google Place details
  const { data: placeDetails, isLoading: placeDetailsLoading } = usePlaceDetails(place_id);

  // Ref to the reviews section for scroll-to functionality
  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  // State to track if we should use the fallback image (only for non-gallery fallback)
  const [imgSrc, setImgSrc] = useState<string>(
    place_id ? `/api/place-photo?place_id=${place_id}&width=800` : image
  );

  // State to track current page URL
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  });

  // State for nearby activities
  const [nearbyActivities, setNearbyActivities] = useState<Listing[]>([]);

  // Fetch nearby activities
  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchNearbyActivities = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'Activity')
        .gte('rating', 4)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('airtable_id', airtable_id);

      if (error) {
        console.error('Error fetching nearby activities:', error);
        return;
      }

      if (data) {
        // Calculate distances and sort by proximity
        const withDistances = data
          .map((listing) => ({
            ...listing,
            distance: calculateDistance(
              latitude,
              longitude,
              listing.latitude!,
              listing.longitude!
            ),
          }))
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 3);

        setNearbyActivities(withDistances);
      }
    };

    fetchNearbyActivities();
  }, [latitude, longitude, airtable_id]);

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

  // Scroll to reviews section
  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="bg-malibu-50 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center transition-colors hover:opacity-70"
            aria-label="Back to home"
          >
            <IoIosArrowBack size={24} className="text-malibu-950" />
          </Link>
        </div>
      </header>

      {/* Photo Gallery or Hero Image */}
      {placeDetails && placeDetails.photos.length > 0 ? (
        <PhotoGallery
          photos={placeDetails.photos}
          fallbackImage={imgSrc}
          title={title}
        />
      ) : (
        <div className="relative w-full max-w-3xl mx-auto px-5">
          <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden shadow-lg">
            <img
              src={imgSrc}
              alt={title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-3xl font-bold text-malibu-950 mb-2 mt-0">{title}</h1>

        {/* Google Rating */}
        {placeDetails && placeDetails.rating && placeDetails.userRatingsTotal && (
          <div className="mb-6">
            <GoogleRating
              rating={placeDetails.rating}
              reviewCount={placeDetails.userRatingsTotal}
              onReviewsClick={placeDetails.reviews.length > 0 ? scrollToReviews : undefined}
            />
          </div>
        )}
        {!placeDetails && !placeDetailsLoading && <div className="mb-4" />}

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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 no-underline hover:opacity-70 transition-opacity"
            >
              <HiOutlineLocationMarker size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90 truncate">{fullAddress}</span>
              <LuArrowUpRight size={16} className="text-malibu-950/70 flex-shrink-0 -ml-2" />
            </a>
          )}

          {/* Open/Closed Status (inline) */}
          {placeDetails?.openingHours && placeDetails.openingHours.weekdayText.length > 0 && (
            <div className="flex items-center gap-3">
              <LuClock3 size={20} className="text-malibu-950/70 flex-shrink-0" />
              <OpenStatusBadge openingHours={placeDetails.openingHours} />
            </div>
          )}

          {price && (
            price.toLowerCase() === 'see website' && website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 no-underline hover:opacity-70 transition-opacity"
              >
                <LuTag size={20} className="text-emerald-700 flex-shrink-0" />
                <span className="text-base text-emerald-700">{price}</span>
                <LuArrowUpRight size={16} className="text-emerald-700 flex-shrink-0 -ml-2" />
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <LuTag size={20} className="text-emerald-700 flex-shrink-0" />
                <span className="text-base text-emerald-700">{price}</span>
              </div>
            )
          )}

          {age_range && (
            <div className="flex items-center gap-3">
              <LuUsers size={20} className="text-malibu-950/70 flex-shrink-0" />
              <span className="text-base text-malibu-950/90">{age_range}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-900 border-none"
          >
            <LuShare size={18} />
            <span>Share</span>
          </button>

          {start_date && (
            <button
              onClick={handleAddToCalendar}
              className="flex items-center gap-2 px-4 py-3 bg-malibu-50 text-malibu-950 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-100 border-none"
            >
              <LuCalendar size={18} />
              <span>Add</span>
            </button>
          )}

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-malibu-50 text-malibu-950 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-malibu-100 border-none no-underline"
            >
              <LuGlobe size={18} />
              <span>Website</span>
            </a>
          )}
        </div>

        {/* Hours Section */}
        {placeDetails?.openingHours && placeDetails.openingHours.weekdayText.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Hours</h2>
            <BusinessHours openingHours={placeDetails.openingHours} />
          </div>
        )}

        {/* Details Section */}
        {description && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Details</h2>
            <p className="text-base text-malibu-950/80 leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        )}

        {/* Reviews Section */}
        {placeDetails && placeDetails.reviews.length > 0 && place_id && (
          <div className="mb-8" ref={reviewsSectionRef}>
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Reviews</h2>
            <Reviews reviews={placeDetails.reviews} placeId={place_id} />
          </div>
        )}

        {/* Tags */}
        {tagArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tagArray.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1.5 bg-white text-malibu-950/80 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Nearby Activities */}
        {nearbyActivities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Nearby activities</h2>
            <div className="flex flex-col gap-1.5">
              {nearbyActivities.map((activity) => (
                <ClickableCard
                  key={activity.airtable_id}
                  airtable_id={activity.airtable_id}
                  title={activity.title}
                  type={activity.type}
                  scout_pick={activity.scout_pick}
                  deal={activity.deal}
                  promoted={activity.promoted}
                  city={activity.city}
                  distance={activity.distance || 0}
                  image={activity.image}
                  place_id={activity.place_id}
                  start_date={activity.start_date}
                  place_type={activity.place_type}
                  description={activity.description}
                  organizer={activity.organizer}
                  rating={activity.rating}
                />
              ))}
            </div>
          </div>
        )}

        {/* Location Section */}
        {(location_name || street || latitude) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-malibu-950 mb-3">Location</h2>
            {location_name && (
              <p className="text-base font-semibold text-malibu-950 mb-1">{location_name}</p>
            )}
            {street && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-malibu-950/70 mb-4 no-underline hover:opacity-70 transition-opacity"
              >
                <span className="truncate">{fullAddress}</span>
                <LuArrowUpRight size={14} className="text-malibu-950/70 flex-shrink-0" />
              </a>
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

    </div>
  );
};

export default EventDetail;
