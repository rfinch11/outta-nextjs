'use client';

import React, { useState } from 'react';
import { LuSearch } from 'react-icons/lu';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  currentQuery: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch, currentQuery }) => {
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  if (!isOpen) return null;

  const handleSearch = () => {
    onSearch(searchQuery);
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000] flex items-end justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-t-[20px] w-full max-w-[600px] max-h-[50vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold m-0">Search</h2>
            <button
              onClick={handleClear}
              className="text-[#ff6b47] bg-transparent border-none text-base font-medium cursor-pointer p-2"
            >
              Clear
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6">
            {/* Search Input */}
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <LuSearch size={20} />
              </span>
              <input
                type="search"
                placeholder="Search events, activities, and camps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch();
                  }
                }}
                className="w-full px-4 pl-12 py-4 bg-gray-100 border-2 border-gray-300 rounded-xl text-base outline-none box-border focus:border-gray-300"
                autoFocus
              />
            </div>

            {/* Let's Go Button */}
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="w-full px-4 py-4 bg-outta-yellow border-2 border-black rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[3px_4px_0px_0px_#000000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      </div>

      {/* Animation */}
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
      `}</style>
    </>
  );
};

export default SearchModal;
