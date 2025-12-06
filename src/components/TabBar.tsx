'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import FilterChip from './FilterChip';
import Chip from './Chip';
import DateFilterMenu from './DateFilterMenu';
import DistanceFilterMenu from './DistanceFilterMenu';
import TypeFilterMenu from './TypeFilterMenu';

type TabType = 'Event' | 'Activity' | 'Camp' | 'Restaurant';

export interface TabFilter {
  id: string;
  label: string;
  value: string | number | string[] | null;
}

interface MenuItem {
  key: TabType;
  label: string;
  chip?: 'new' | 'comingsoon';
  disabled?: boolean;
}

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeFilters: TabFilter[];
  availableFilters: TabFilter[];
  onFilterRemove: (filterId: string) => void;
  onDateSelect: (value: 'today' | 'tomorrow' | 'this_week' | 'this_month') => void;
  onDistanceSelect: (distance: number) => void;
  onTypeSelect: (types: string[]) => void;
  currentDateFilter?: string | null;
  currentDistanceFilter?: number | null;
  currentTypeFilter?: string[] | null;
  availableTypes?: string[];
}

/**
 * Enhanced TabBar component with dropdown menu and integrated filter chips
 *
 * Features:
 * - Dropdown menu for listing types (Events, Activities, Camps, Restaurants)
 * - Available filter chips when no filters are active
 * - Active filter chips that can be removed
 */
const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  activeFilters,
  availableFilters,
  onFilterRemove,
  onDateSelect,
  onDistanceSelect,
  onTypeSelect,
  currentDateFilter,
  currentDistanceFilter,
  currentTypeFilter,
  availableTypes = [],
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<{ left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const activeFilterMenuRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    { key: 'Event', label: 'Events' },
    { key: 'Activity', label: 'Activities' },
    { key: 'Camp', label: 'Camps', chip: 'new' },
    { key: 'Restaurant', label: 'Restaurants', chip: 'comingsoon', disabled: true },
  ];

  const activeMenuItem = menuItems.find((item) => item.key === activeTab);
  const activeMenuLabel = activeMenuItem?.label || 'Events';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }

      // Check if click is outside both the filter chips and the active filter menu
      const clickedInsideFilterChip = Object.values(filterMenuRefs.current).some(
        (ref) => ref && ref.contains(event.target as Node)
      );

      const clickedInsideFilterMenu = activeFilterMenuRef.current &&
        activeFilterMenuRef.current.contains(event.target as Node);

      if (!clickedInsideFilterChip && !clickedInsideFilterMenu) {
        setOpenFilterMenu(null);
      }
    };

    if (isMenuOpen || openFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, openFilterMenu]);

  const handleMenuItemClick = (item: MenuItem) => {
    if (!item.disabled) {
      onTabChange(item.key);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="sticky top-[80px] z-40 bg-malibu-50 px-5 border-b border-[#E0E0E0]">
      <div className="max-w-7xl mx-auto">
        {/* Primary Menu and Filter Chips Row */}
        <div className="relative py-[14px] flex items-center gap-3" ref={menuRef}>
          {/* Main Menu Dropdown */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-0 py-0 bg-transparent border-none cursor-pointer text-lg font-bold text-black"
          >
            {activeMenuLabel}
            <IoChevronDown
              size={20}
              className={`text-black-900 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleMenuItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2 transition-colors border-none bg-transparent ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-50'
                  } ${activeTab === item.key ? 'bg-malibu-50' : ''}`}
                >
                  <span
                    className={`text-base ${
                      activeTab === item.key ? 'font-bold text-black' : 'font-medium text-gray-700'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.chip && <Chip variant={item.chip} />}
                </button>
              ))}
            </div>
          )}

          {/* Filter Chips - Inline with Menu */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
            {/* Show active filters as orange chips */}
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                active={true}
                onRemove={() => onFilterRemove(filter.id)}
              />
            ))}

            {/* Show available filters (excluding active ones) as white chips with dropdown menus */}
            {availableFilters
              .filter((availFilter) => !activeFilters.some((actFilter) => actFilter.id === availFilter.id))
              .map((filter) => (
                <div
                  key={filter.id}
                  className="inline-block"
                >
                  <div
                    ref={(el) => { filterMenuRefs.current[filter.id] = el; }}
                    onClick={() => {
                      const isOpening = openFilterMenu !== filter.id;
                      setOpenFilterMenu(isOpening ? filter.id : null);
                      if (isOpening && filterMenuRefs.current[filter.id]) {
                        const rect = filterMenuRefs.current[filter.id]!.getBoundingClientRect();
                        const parentRect = filterMenuRefs.current[filter.id]!.closest('.max-w-7xl')?.getBoundingClientRect();

                        // Calculate position, accounting for dropdown width
                        const dropdownWidth = filter.id === 'distance' ? 280 : filter.id === 'type' ? 200 : 180;
                        let leftPosition = rect.left - (parentRect?.left || 0);

                        // Check if dropdown would overflow right edge of screen
                        const wouldOverflowRight = rect.left + dropdownWidth > window.innerWidth - 20; // 20px margin

                        if (wouldOverflowRight) {
                          // Try aligning to right edge of chip
                          const rightAlignedPosition = rect.right - dropdownWidth;

                          // If right-aligned would go off left edge, clamp to left edge
                          if (rightAlignedPosition < 20) {
                            leftPosition = 20 - (parentRect?.left || 0);
                          } else {
                            leftPosition = rect.right - (parentRect?.left || 0) - dropdownWidth;
                          }
                        }

                        setFilterMenuPosition({
                          left: leftPosition,
                        });
                      }
                    }}
                  >
                    <FilterChip
                      label={filter.label}
                      active={false}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Filter Dropdown Menus - Rendered outside scroll container */}
          {openFilterMenu && filterMenuPosition && (
            <div
              ref={activeFilterMenuRef}
              className="absolute z-50"
              style={{ left: `${filterMenuPosition.left}px`, top: '100%' }}
            >
              {openFilterMenu === 'date' && (
                <DateFilterMenu
                  onSelect={(value) => {
                    onDateSelect(value);
                    setOpenFilterMenu(null);
                  }}
                  currentValue={currentDateFilter}
                />
              )}
              {openFilterMenu === 'distance' && (
                <DistanceFilterMenu
                  onSelect={(value) => {
                    onDistanceSelect(value);
                    setOpenFilterMenu(null);
                  }}
                  currentValue={currentDistanceFilter}
                />
              )}
              {openFilterMenu === 'type' && (
                <TypeFilterMenu
                  onSelect={(types) => {
                    onTypeSelect(types);
                    setOpenFilterMenu(null);
                  }}
                  currentValue={currentTypeFilter}
                  availableTypes={availableTypes}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TabBar;
