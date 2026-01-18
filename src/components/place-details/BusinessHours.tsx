'use client';

import React, { useMemo } from 'react';
import type { PlaceOpeningHours } from '@/lib/googlePlaces';

interface BusinessHoursProps {
  openingHours: PlaceOpeningHours;
}

/**
 * Business hours display with open/closed badge and weekly schedule
 * Current day is highlighted
 */
const BusinessHours: React.FC<BusinessHoursProps> = ({ openingHours }) => {
  const { weekdayText } = openingHours;

  // Calculate if currently open based on weekdayText
  // This is calculated client-side for accuracy regardless of cache age
  const { isOpen, is24Hours } = useMemo(() => {
    if (!weekdayText || weekdayText.length === 0) {
      return { isOpen: null, is24Hours: false };
    }

    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday
    // Google returns Monday first, so adjust index
    const googleDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const todayHours = weekdayText[googleDayIndex];

    if (!todayHours || todayHours.toLowerCase().includes('closed')) {
      return { isOpen: false, is24Hours: false };
    }

    // Check for 24 hours
    if (todayHours.toLowerCase().includes('24 hours') || todayHours.toLowerCase().includes('open 24')) {
      return { isOpen: true, is24Hours: true };
    }

    // Try to parse hours from the text (e.g., "Monday: 9:00 AM – 6:00 PM")
    const timeMatch = todayHours.match(
      /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i
    );

    if (!timeMatch) {
      // Can't parse, use Google's isOpen if available
      return { isOpen: openingHours.isOpen, is24Hours: false };
    }

    const [, openHour, openMin = '00', openPeriod, closeHour, closeMin = '00', closePeriod] =
      timeMatch;

    const parseTime = (hour: string, min: string, period: string) => {
      let h = parseInt(hour, 10);
      if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + parseInt(min, 10);
    };

    const openTime = parseTime(openHour, openMin, openPeriod);
    const closeTime = parseTime(closeHour, closeMin, closePeriod);
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return { isOpen: currentTime >= openTime && currentTime < closeTime, is24Hours: false };
  }, [weekdayText, openingHours.isOpen]);

  // Get current day index for highlighting
  const currentDayIndex = useMemo(() => {
    const dayIndex = new Date().getDay();
    return dayIndex === 0 ? 6 : dayIndex - 1;
  }, []);

  // Get next closing/opening time for badge
  const statusText = useMemo(() => {
    if (isOpen === null) return null;

    if (!isOpen) {
      return 'Closed';
    }

    if (is24Hours) {
      return 'Open 24 hours';
    }

    const now = new Date();
    const dayIndex = now.getDay();
    const googleDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const todayHours = weekdayText[googleDayIndex];

    if (!todayHours) return 'Open';

    const timeMatch = todayHours.match(
      /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i
    );

    if (timeMatch) {
      const [, , , , closeHour, closeMin = '00', closePeriod] = timeMatch;
      return `Open · Closes ${closeHour}${closeMin !== '00' ? ':' + closeMin : ''} ${closePeriod}`;
    }

    return 'Open';
  }, [isOpen, is24Hours, weekdayText]);

  if (!weekdayText || weekdayText.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Open/Closed Badge */}
      {statusText && (
        <div className="mb-4">
          {isOpen ? (
            <span className="px-2 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
              {statusText}
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-sm font-medium bg-black-100 text-black-600">
              {statusText}
            </span>
          )}
        </div>
      )}

      {/* Weekly Schedule */}
      <ul className="space-y-2 list-none p-0 m-0">
        {weekdayText.map((dayHours, index) => {
          // Split day name from hours
          const colonIndex = dayHours.indexOf(':');
          const dayName = colonIndex > -1 ? dayHours.slice(0, colonIndex) : dayHours;
          const hours = colonIndex > -1 ? dayHours.slice(colonIndex + 1).trim() : '';

          const isCurrentDay = index === currentDayIndex;

          return (
            <li
              key={dayName}
              className={`flex justify-between items-center py-1 ${
                isCurrentDay ? 'font-semibold text-malibu-950' : 'text-malibu-950/70'
              }`}
            >
              <span className="text-sm">{dayName}</span>
              <span className="text-sm">{hours}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BusinessHours;
