'use client';

import Link from 'next/link';
import React, { useRef, useLayoutEffect } from 'react';
import { LuCalendar, LuRows2 } from 'react-icons/lu';
import { getPlaceTypeIcon } from '@/lib/placeTypeIcons';

interface FilterBarProps {
  activeFilter?: string; // Current route's filter type (e.g., 'events', 'Museum')
  placeTypeCounts: Array<{ type: string; count: number }>;
}

interface ButtonInfo {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

// Custom ordering for place types in the filter bar
const PLACE_TYPE_ORDER: string[] = [
  'Playground',
  'Park',
  'Farmers Market',
  'Indoor play',
  'Attraction',
  'Art',
  'Book store',
  'Museum',
  'Library',
  'Camp',
  'Theater',
  'Toys',
  'Recreation center',
];

const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  placeTypeCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Build button list: Collections (homepage), Events, then place types in custom order
  const placeTypeSet = new Set(placeTypeCounts.map(({ type }) => type));
  const orderedPlaceTypes = PLACE_TYPE_ORDER.filter((type) => placeTypeSet.has(type));

  const buttons: ButtonInfo[] = [
    {
      id: 'collections',
      label: 'Collections',
      href: '/',
      icon: LuRows2,
    },
    {
      id: 'events',
      label: 'Events',
      href: '/filter/events',
      icon: LuCalendar,
    },
    ...orderedPlaceTypes.map((type) => ({
      id: type,
      label: type,
      href: `/filter/${encodeURIComponent(type)}`,
      icon: getPlaceTypeIcon(type),
    })),
  ];

  // Collections is active when no filter is specified (homepage)
  const effectiveActiveFilter = activeFilter || 'collections';

  // Scroll active button into view
  useLayoutEffect(() => {
    if (containerRef.current) {
      const btn = buttonRefs.current.get(effectiveActiveFilter);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [effectiveActiveFilter]);

  const renderButton = (button: ButtonInfo) => {
    const IconComponent = button.icon;
    const isActive = button.id === effectiveActiveFilter;
    const isCollections = button.id === 'collections';

    // Determine button styling
    let buttonClasses = 'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap';

    if (isActive) {
      if (isCollections) {
        // Collections active: malibu-950 background, malibu-50 text
        buttonClasses += ' bg-malibu-950 border-2 border-malibu-950 text-malibu-50';
      } else {
        // Other filters active: white background, flamenco border
        buttonClasses += ' bg-white border-2 border-flamenco-500 text-malibu-950';
      }
    } else {
      // Neutral state
      if (isCollections) {
        buttonClasses += ' bg-transparent border-2 border-transparent text-malibu-950/90 hover:text-malibu-950';
      } else {
        buttonClasses += ' bg-malibu-950/5 border-2 border-transparent text-malibu-950/90 hover:bg-malibu-950/10 hover:text-malibu-950';
      }
    }

    return (
      <Link
        key={button.id}
        href={button.href}
        ref={(el) => {
          if (el) {
            buttonRefs.current.set(button.id, el);
          }
        }}
        className={buttonClasses}
      >
        <IconComponent size={16} className="flex-shrink-0" />
        <span>{button.label}</span>
      </Link>
    );
  };

  return (
    <div className="sticky top-[72px] z-40 bg-malibu-50 px-5 py-3">
      <div className="max-w-7xl mx-auto">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar"
        >
          {buttons.map((button) => renderButton(button))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
