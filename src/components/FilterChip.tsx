'use client';

import React from 'react';
import { IoClose } from 'react-icons/io5';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * FilterChip component for displaying filter options
 * Used in the tab bar to show available and active filters
 */
const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active = false,
  onClick,
  onRemove,
  className = '',
}) => {
  if (active && onRemove) {
    // Active filter chip with close button
    return (
      <button
        onClick={onRemove}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer bg-flamenco-100 border-flamenco-500 text-flamenco-900 font-semibold ${className}`}
      >
        <span className="text-sm">{label}</span>
        <IoClose size={14} className="flex-shrink-0" />
      </button>
    );
  }

  // Inactive filter chip (clickable)
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-full border transition-all cursor-pointer bg-white border-malibu-950 text-gray-700 font-medium hover:bg-gray-50 ${className}`}
    >
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default FilterChip;
