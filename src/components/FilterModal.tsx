'use client';

import React, { useState } from 'react';

export interface FilterState {
  search: string;
  recommended: boolean;
  sortBy: 'distance' | 'date';
  dateQuick: 'today' | 'tomorrow' | 'next-week' | 'next-month' | null;
  distance: 10 | 20 | 40 | null;
  priceMax: number;
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

  if (!isOpen) return null;

  const handleClearAll = () => {
    setFilters({
      search: '',
      recommended: false,
      sortBy: 'date',
      dateQuick: null,
      distance: null,
      priceMax: 1000,
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
    { key: 'next-week' as const, label: 'Next week' },
    { key: 'next-month' as const, label: 'Next month' },
  ];

  const distanceOptions: Array<{ key: 10 | 20 | 40 | null; label: string }> = [
    { key: 10, label: '10 miles' },
    { key: 20, label: '20 miles' },
    { key: 40, label: '40 miles' },
    { key: null, label: 'Any' },
  ];

  const typeOptions = ['Kids storytimes', 'Storytimes', 'Babies (under 2)'];
  const tagOptions = ['Kids storytimes', 'Storytimes', 'Babies (under 2)'];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000] flex items-end justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-t-[20px] w-full max-w-[600px] max-h-[90vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold m-0">Find something new</h2>
            <button
              onClick={handleClearAll}
              className="text-[#ff6b47] bg-transparent border-none text-base font-medium cursor-pointer p-2"
            >
              Clear
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Recommended */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Recommended</h3>
              <div className="flex justify-between items-center">
                <span>Only show recommendations</span>
                <button
                  className={`w-12 h-7 rounded-full relative border-none cursor-pointer transition-colors ${
                    filters.recommended ? 'bg-[#ff6b47]' : 'bg-gray-300'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, recommended: !prev.recommended }))}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${
                      filters.recommended ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Sort by */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Sort by</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.sortBy === 'distance'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'distance' }))}
                >
                  Distance (nearest)
                </button>
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.sortBy === 'date'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'date' }))}
                >
                  Date (soonest)
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Date</h3>
              <div className="flex gap-3 flex-wrap">
                {dateOptions.map((option) => (
                  <button
                    key={option.key}
                    className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                      filters.dateQuick === option.key
                        ? 'bg-white border-2 border-outta-orange'
                        : 'bg-gray-100 border-2 border-transparent'
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
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Distance</h3>
              <div className="flex gap-3 flex-wrap">
                {distanceOptions.map((option) => (
                  <button
                    key={option.label}
                    className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                      filters.distance === option.key
                        ? 'bg-white border-2 border-outta-orange'
                        : 'bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => setFilters((prev) => ({ ...prev, distance: option.key }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Price (up to)</h3>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={filters.priceMax}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priceMax: Number(e.target.value) }))
                }
                className="w-full mt-4 h-2 bg-gray-300 rounded appearance-none cursor-pointer range-slider"
              />
              <div className="flex justify-between mt-2 text-sm">
                <span>$0</span>
                <span className="font-bold">
                  {filters.priceMax >= 1000 ? 'Max' : `$${filters.priceMax}`}
                </span>
              </div>
            </div>

            {/* Type */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Type</h3>
              <div className="flex gap-3 flex-wrap">
                {typeOptions.map((type) => (
                  <button
                    key={type}
                    className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                      filters.types.includes(type)
                        ? 'bg-white border-2 border-outta-orange'
                        : 'bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => toggleType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Tags</h3>
              <div className="flex gap-3 flex-wrap">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    className={`px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                      filters.tags.includes(tag)
                        ? 'bg-white border-2 border-outta-orange'
                        : 'bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Rating</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.rating === 'any'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, rating: 'any' }))}
                >
                  Any
                </button>
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.rating === '3+'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, rating: '3+' }))}
                >
                  3+ Stars
                </button>
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.rating === '4+'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, rating: '4+' }))}
                >
                  4+ Stars
                </button>
                <button
                  className={`flex-1 px-5 py-2.5 rounded-lg text-[15px] cursor-pointer transition-all ${
                    filters.rating === '4.5+'
                      ? 'bg-white border-2 border-outta-orange'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setFilters((prev) => ({ ...prev, rating: '4.5+' }))}
                >
                  4.5+ Stars
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full px-4 py-4 bg-outta-yellow border-2 border-black rounded-[53px] text-lg font-bold cursor-pointer transition-none relative shadow-[3px_4px_0px_0px_#000000]"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #FF7E08;
          border-radius: 50%;
          cursor: pointer;
        }

        .range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #FF7E08;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
};

export default FilterModal;
