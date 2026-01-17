'use client';

import React, { useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { ResponsiveModal } from './ui/ResponsiveModal';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  currentQuery: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch, currentQuery }) => {
  // Use key to reset state when currentQuery changes
  const [searchQuery, setSearchQuery] = useState(currentQuery);

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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Search"
      description="Search for events, activities, and camps"
      snapPoints={[1]} // Full height for keyboard
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-6">
        {/* Clear button */}
        <div className="flex justify-end -mt-2">
          <button
            onClick={handleClear}
            className="text-flamenco-500 bg-transparent border-none text-base font-medium cursor-pointer p-2 hover:text-flamenco-600 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black-400">
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
            className="w-full px-4 pl-12 py-4 bg-black-50 border-2 border-black-200 rounded-xl text-base outline-none box-border focus:border-broom-400 focus:ring-2 focus:ring-broom-100 transition-all"
            autoFocus
          />
        </div>

        {/* Let's Go Button */}
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim()}
          className="w-full px-4 py-4 bg-broom-400 border-2 border-malibu-950 rounded-[53px] text-lg font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#06304b] hover:shadow-[1px_2px_0px_0px_#06304b] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[3px_4px_0px_0px_#06304b] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          Let&apos;s go
        </button>
      </div>
    </ResponsiveModal>
  );
};

export default SearchModal;
