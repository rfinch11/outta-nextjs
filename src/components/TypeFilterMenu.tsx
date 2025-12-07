'use client';

import React from 'react';

interface TypeFilterMenuProps {
  onSelect: (types: string[]) => void;
  currentValue?: string[] | null;
  availableTypes: string[];
}

/**
 * Dropdown menu for type filter options with checkboxes
 */
const TypeFilterMenu: React.FC<TypeFilterMenuProps> = ({
  onSelect,
  currentValue = [],
  availableTypes,
}) => {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(currentValue || []);

  const handleToggle = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleApply = () => {
    onSelect(selectedTypes);
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[280px] max-h-[300px] overflow-y-auto z-50">
      <div className="px-4 py-2">
        <div className="text-base font-medium text-malibu-950 mb-2">Select types</div>
        {availableTypes.map((type) => (
          <label
            key={type}
            className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded"
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleToggle(type)}
                className="w-5 h-5 appearance-none border-2 border-malibu-100 rounded cursor-pointer checked:bg-malibu-950 checked:border-malibu-950 focus:outline-none focus:ring-2 focus:ring-malibu-950 focus:ring-offset-1"
              />
              {selectedTypes.includes(type) && (
                <svg
                  className="absolute w-3 h-3 pointer-events-none text-malibu-50"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700">{type}</span>
          </label>
        ))}
      </div>
      <div className="px-4 pb-2 pt-1 border-t border-gray-200 mt-2">
        <button
          onClick={handleApply}
          className="w-full px-4 py-3 bg-broom-400 border-2 border-black rounded-[53px] text-base font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default TypeFilterMenu;
