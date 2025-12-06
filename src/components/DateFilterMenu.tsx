'use client';

import React from 'react';

interface DateFilterMenuProps {
  onSelect: (value: 'today' | 'tomorrow' | 'this_week' | 'this_month') => void;
  currentValue?: string | null;
}

/**
 * Dropdown menu for date filter options
 */
const DateFilterMenu: React.FC<DateFilterMenuProps> = ({ onSelect, currentValue }) => {
  const options = [
    { value: 'today' as const, label: 'Today' },
    { value: 'tomorrow' as const, label: 'Tomorrow' },
    { value: 'this_week' as const, label: 'This week' },
    { value: 'this_month' as const, label: 'This month' },
  ];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`w-full px-4 py-2.5 text-left transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-50 ${
            currentValue === option.value ? 'bg-malibu-50 font-semibold' : 'font-medium'
          }`}
        >
          <span className="text-sm text-gray-700">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DateFilterMenu;
