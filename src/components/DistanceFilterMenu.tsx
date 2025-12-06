'use client';

import React, { useState } from 'react';

interface DistanceFilterMenuProps {
  onSelect: (distance: number) => void;
  currentValue?: number | null;
  maxDistance?: number;
}

/**
 * Dropdown menu with slider for distance filter
 */
const DistanceFilterMenu: React.FC<DistanceFilterMenuProps> = ({
  onSelect,
  currentValue,
  maxDistance = 50,
}) => {
  const [sliderValue, setSliderValue] = useState(currentValue || 20);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const handleApply = () => {
    onSelect(sliderValue);
  };

  // Calculate percentage for gradient
  // Add 1 extra step for ">50" option
  const maxSliderValue = maxDistance + 5;
  const percentage = (sliderValue / maxSliderValue) * 100;

  // Display text - show ">50" when at max
  const displayValue = sliderValue > maxDistance ? `>${maxDistance}` : `${sliderValue}`;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px] z-50">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-medium text-malibu-950">Distance</span>
          <span className="text-sm font-bold text-black">{displayValue} mi</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max={maxSliderValue}
            step="5"
            value={sliderValue}
            onChange={handleSliderChange}
            className="distance-slider w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FB923C 0%, #FB923C ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">0 mi</span>
          <span className="text-xs text-gray-500">&gt;{maxDistance} mi</span>
        </div>
      </div>
      <button
        onClick={handleApply}
        className="w-full px-4 py-3 bg-broom-400 border-2 border-black rounded-[53px] text-base font-bold cursor-pointer transition-all shadow-[3px_4px_0px_0px_#000000] hover:shadow-[1px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5"
      >
        Apply
      </button>

      <style jsx>{`
        .distance-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .distance-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default DistanceFilterMenu;
