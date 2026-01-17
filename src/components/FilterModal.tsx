'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveModal } from './ui/ResponsiveModal';

export interface FilterState {
  search: string;
  recommended: boolean;
  sortBy: 'distance' | 'date';
  dateQuick: 'today' | 'tomorrow' | 'this_week' | 'this_month' | null;
  distance: number | null;
  price: 'any' | 'free' | 'paid';
  types: string[];
  tags: string[];
  rating: 'any' | '3+' | '4+' | '4.5+';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Fetch unique tags and types from Supabase
  useEffect(() => {
    async function fetchFilters() {
      const { data } = await supabase.from('listings').select('tags, place_type');

      if (data) {
        // Extract all unique tags from comma-separated strings
        const tagsSet = new Set<string>();
        data.forEach((listing) => {
          if (listing.tags) {
            const tags = listing.tags.split(',').map((tag: string) => tag.trim());
            tags.forEach((tag: string) => {
              if (tag) tagsSet.add(tag);
            });
          }
        });

        // Extract all unique place types
        const typesSet = new Set<string>();
        data.forEach((listing) => {
          if (listing.place_type) {
            typesSet.add(listing.place_type.trim());
          }
        });

        // Sort alphabetically
        const uniqueTags = Array.from(tagsSet).sort();
        const uniqueTypes = Array.from(typesSet).sort();
        setAllTags(uniqueTags);
        setAllTypes(uniqueTypes);
      }
    }

    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen]);

  // Show first 15 tags/types or all if "Show more" is clicked
  const displayedTags = showAllTags ? allTags : allTags.slice(0, 15);
  const hasMoreTags = allTags.length > 15;
  const displayedTypes = showAllTypes ? allTypes : allTypes.slice(0, 15);
  const hasMoreTypes = allTypes.length > 15;

  const handleClearAll = () => {
    setFilters({
      search: '',
      recommended: false,
      sortBy: 'date',
      dateQuick: null,
      distance: null,
      price: 'any',
      types: [],
      tags: [],
      rating: 'any',
    });
  };

  const handleSave = () => {
    onApply(filters);
    onClose();
  };

  const toggleType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const dateOptions = [
    { key: 'today' as const, label: 'Today' },
    { key: 'tomorrow' as const, label: 'Tomorrow' },
    { key: 'this_week' as const, label: 'This week' },
    { key: 'this_month' as const, label: 'This month' },
  ];

  const distanceOptions: Array<{ key: 10 | 20 | 40 | null; label: string }> = [
    { key: 10, label: '10 miles' },
    { key: 20, label: '20 miles' },
    { key: 40, label: '40 miles' },
    { key: null, label: 'Any' },
  ];

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Find something new"
      description="Filter events by date, distance, price, and more"
      snapPoints={[0.6, 1]}
      maxWidth="max-w-xl"
      footer={
        <div className="flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-3 bg-white border-2 border-black-200 rounded-xl text-base font-semibold cursor-pointer transition-colors hover:bg-black-50"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-4 bg-broom-400 border-2 border-malibu-950 rounded-[53px] text-lg font-bold cursor-pointer transition-none relative shadow-[3px_4px_0px_0px_#06304b]"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        {/* Recommended */}
        <div>
          <h3 className="text-lg font-bold mb-4">Recommended</h3>
          <div className="flex justify-between items-center">
            <span className="text-black-700">Only show recommendations</span>
            <button
              className={`w-12 h-7 rounded-full relative border-none cursor-pointer transition-colors ${
                filters.recommended ? 'bg-flamenco-500' : 'bg-black-200'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, recommended: !prev.recommended }))}
              role="switch"
              aria-checked={filters.recommended}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                  filters.recommended ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sort by */}
        <div>
          <h3 className="text-lg font-bold mb-4">Sort by</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.sortBy === 'distance'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'distance' }))}
            >
              Distance (nearest)
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.sortBy === 'date'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'date' }))}
            >
              Date (soonest)
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <h3 className="text-lg font-bold mb-4">Date</h3>
          <div className="flex gap-3 flex-wrap">
            {dateOptions.map((option) => (
              <button
                key={option.key}
                className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                  filters.dateQuick === option.key
                    ? 'bg-white border-2 border-flamenco-500'
                    : 'bg-black-50 border-2 border-transparent'
                }`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    dateQuick: prev.dateQuick === option.key ? null : option.key,
                  }))
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <h3 className="text-lg font-bold mb-4">Distance</h3>
          <div className="flex gap-3 flex-wrap">
            {distanceOptions.map((option) => (
              <button
                key={option.label}
                className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                  filters.distance === option.key
                    ? 'bg-white border-2 border-flamenco-500'
                    : 'bg-black-50 border-2 border-transparent'
                }`}
                onClick={() => setFilters((prev) => ({ ...prev, distance: option.key }))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <h3 className="text-lg font-bold mb-4">Price</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.price === 'any'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, price: 'any' }))}
            >
              Any
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.price === 'free'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, price: 'free' }))}
            >
              Free
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.price === 'paid'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, price: 'paid' }))}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Type */}
        <div>
          <h3 className="text-lg font-bold mb-4">Type</h3>
          <div className="flex gap-3 flex-wrap">
            {displayedTypes.map((type) => (
              <button
                key={type}
                className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                  filters.types.includes(type)
                    ? 'bg-white border-2 border-flamenco-500'
                    : 'bg-black-50 border-2 border-transparent'
                }`}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          {hasMoreTypes && !showAllTypes && (
            <button
              onClick={() => setShowAllTypes(true)}
              className="mt-4 text-flamenco-600 font-semibold text-sm underline cursor-pointer bg-transparent border-none p-0"
            >
              Show more ({allTypes.length - 15} more types)
            </button>
          )}
          {showAllTypes && hasMoreTypes && (
            <button
              onClick={() => setShowAllTypes(false)}
              className="mt-4 text-flamenco-600 font-semibold text-sm underline cursor-pointer bg-transparent border-none p-0"
            >
              Show less
            </button>
          )}
        </div>

        {/* Rating */}
        <div>
          <h3 className="text-lg font-bold mb-4">Rating</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.rating === 'any'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, rating: 'any' }))}
            >
              Any
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.rating === '3+'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, rating: '3+' }))}
            >
              3+ Stars
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.rating === '4+'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, rating: '4+' }))}
            >
              4+ Stars
            </button>
            <button
              className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                filters.rating === '4.5+'
                  ? 'bg-white border-2 border-flamenco-500'
                  : 'bg-black-50 border-2 border-transparent'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, rating: '4.5+' }))}
            >
              4.5+ Stars
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-lg font-bold mb-4">Tags</h3>
          <div className="flex gap-3 flex-wrap">
            {displayedTags.map((tag) => (
              <button
                key={tag}
                className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                  filters.tags.includes(tag)
                    ? 'bg-white border-2 border-flamenco-500'
                    : 'bg-black-50 border-2 border-transparent'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {hasMoreTags && !showAllTags && (
            <button
              onClick={() => setShowAllTags(true)}
              className="mt-4 text-flamenco-600 font-semibold text-sm underline cursor-pointer bg-transparent border-none p-0"
            >
              Show more ({allTags.length - 15} more tags)
            </button>
          )}
          {showAllTags && hasMoreTags && (
            <button
              onClick={() => setShowAllTags(false)}
              className="mt-4 text-flamenco-600 font-semibold text-sm underline cursor-pointer bg-transparent border-none p-0"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default FilterModal;
