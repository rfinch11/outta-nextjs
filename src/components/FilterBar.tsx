'use client';

import Link from 'next/link';
import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { LuCalendar } from 'react-icons/lu';
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

const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  placeTypeCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLayerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Build button list: Events first, then place types ordered by count
  const buttons: ButtonInfo[] = [
    {
      id: 'events',
      label: 'Events',
      href: '/filter/events',
      icon: LuCalendar,
    },
    ...placeTypeCounts.map(({ type }) => ({
      id: type,
      label: type,
      href: `/filter/${encodeURIComponent(type)}`,
      icon: getPlaceTypeIcon(type),
    })),
  ];

  // Calculate and apply clip-path for active button
  const updateClipPath = useCallback(() => {
    if (!activeLayerRef.current) return;

    if (!activeFilter || !containerRef.current) {
      activeLayerRef.current.style.clipPath = 'inset(0 100% 0 0 round 17px)';
      return;
    }

    const btn = buttonRefs.current.get(activeFilter);
    if (!btn) {
      activeLayerRef.current.style.clipPath = 'inset(0 100% 0 0 round 17px)';
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    // Calculate relative position within the scrollable container
    const offsetLeft = btnRect.left - containerRect.left + container.scrollLeft;
    const offsetWidth = btnRect.width;
    const scrollWidth = container.scrollWidth;

    const clipLeft = (offsetLeft / scrollWidth) * 100;
    const clipRight = 100 - ((offsetLeft + offsetWidth) / scrollWidth) * 100;

    activeLayerRef.current.style.clipPath = `inset(0 ${clipRight}% 0 ${clipLeft}% round 17px)`;
  }, [activeFilter]);

  // Update clip path after layout
  useLayoutEffect(() => {
    updateClipPath();
  }, [updateClipPath, placeTypeCounts]);

  // Scroll active button into view
  useLayoutEffect(() => {
    if (activeFilter && containerRef.current) {
      const btn = buttonRefs.current.get(activeFilter);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeFilter]);

  const renderButton = (button: ButtonInfo, isActive: boolean, layerType: 'neutral' | 'active') => {
    const IconComponent = button.icon;
    const isActiveLayer = layerType === 'active';

    return (
      <Link
        key={`${layerType}-${button.id}`}
        href={button.href}
        ref={(el) => {
          if (el && layerType === 'neutral') {
            buttonRefs.current.set(button.id, el);
          }
        }}
        className={`
          flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
          transition-colors whitespace-nowrap
          ${
            isActiveLayer
              ? 'bg-white border-2 border-flamenco-500 text-malibu-950'
              : 'bg-black-50 border-2 border-transparent text-black-700 hover:bg-black-100'
          }
        `}
        tabIndex={isActiveLayer ? -1 : 0}
        aria-hidden={isActiveLayer}
      >
        <IconComponent size={16} className="flex-shrink-0" />
        <span>{button.label}</span>
      </Link>
    );
  };

  return (
    <div className="sticky top-[72px] z-40 bg-malibu-50 px-5 py-3">
      <div className="max-w-7xl mx-auto relative">
        {/* Neutral buttons layer (always visible) */}
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar"
        >
          {buttons.map((button) =>
            renderButton(button, button.id === activeFilter, 'neutral')
          )}
        </div>

        {/* Active buttons layer (clipped to show only active button) */}
        {activeFilter && (
          <div
            ref={activeLayerRef}
            className="absolute inset-0 flex gap-2 overflow-x-auto hide-scrollbar pointer-events-none transition-[clip-path] duration-300 ease-out"
            style={{ clipPath: 'inset(0 100% 0 0 round 17px)' }}
            aria-hidden="true"
          >
            {buttons.map((button) =>
              renderButton(button, button.id === activeFilter, 'active')
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
