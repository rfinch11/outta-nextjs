'use client';

import React from 'react';
import Chip from './Chip';

/**
 * ChipShowcase - Visual reference for all chip variants
 *
 * This component demonstrates all chip variants with examples of
 * default labels and custom labels. Use this for development and
 * design reference.
 */
const ChipShowcase: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Chip Components</h1>
        <p className="text-gray-600">
          Visual showcase of all chip variants with default and custom labels
        </p>
      </div>

      {/* Scout Pick */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-lavender-magenta-900">Scout Pick</h2>
        <p className="text-sm text-gray-600">Editor-curated recommendations and featured picks</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="scoutpick" />
          <Chip variant="scoutpick" label="Editor's Choice" />
          <Chip variant="scoutpick" label="Staff Favorite" />
          <Chip variant="scoutpick" label="Curated" />
        </div>
      </div>

      {/* Deal */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-emerald-900">Deal</h2>
        <p className="text-sm text-gray-600">Special offers, discounts, and promotional pricing</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="deal" />
          <Chip variant="deal" label="50% Off" />
          <Chip variant="deal" label="Free Entry" />
          <Chip variant="deal" label="Early Bird" />
          <Chip variant="deal" label="Limited Offer" />
        </div>
      </div>

      {/* Promoted */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-malibu-900">Promoted</h2>
        <p className="text-sm text-gray-600">Sponsored or promoted content</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="promoted" />
          <Chip variant="promoted" label="Sponsored" />
          <Chip variant="promoted" label="Featured" />
          <Chip variant="promoted" label="Ad" />
        </div>
      </div>

      {/* New */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-broom-800">New</h2>
        <p className="text-sm text-gray-600">Recently added listings</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="new" />
          <Chip variant="new" label="Just Added" />
          <Chip variant="new" label="Fresh" />
          <Chip variant="new" label="This Week" />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-black-800">Coming Soon</h2>
        <p className="text-sm text-gray-600">Future or upcoming listings not yet available</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="comingsoon" />
          <Chip variant="comingsoon" label="Opens Soon" />
          <Chip variant="comingsoon" label="Opens Next Month" />
          <Chip variant="comingsoon" label="Registration Opens Jan 1" />
        </div>
      </div>

      {/* Top Rated */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-flamenco-900">Top Rated</h2>
        <p className="text-sm text-gray-600">Highly-rated content based on user reviews</p>
        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-200 rounded-lg">
          <Chip variant="toprated" />
          <Chip variant="toprated" label="4.8★" />
          <Chip variant="toprated" label="Highly Rated" />
          <Chip variant="toprated" label="5★ Reviews" />
        </div>
      </div>

      {/* Multiple Chips Example */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Multiple Chips</h2>
        <p className="text-sm text-gray-600">Examples of multiple chips used together</p>
        <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium w-32">Event Card:</span>
            <div className="flex gap-1">
              <Chip variant="scoutpick" />
              <Chip variant="deal" label="Free" />
              <Chip variant="new" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-32">Activity:</span>
            <div className="flex gap-1">
              <Chip variant="toprated" label="4.9★" />
              <Chip variant="promoted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-32">Camp:</span>
            <div className="flex gap-1">
              <Chip variant="comingsoon" label="Opens Feb 1" />
              <Chip variant="deal" label="Early Bird 25% Off" />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specs */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Technical Specifications</h2>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Padding:</strong> 2px 5px
            </div>
            <div>
              <strong>Border Radius:</strong> 8px
            </div>
            <div>
              <strong>Border Width:</strong> 1px
            </div>
            <div>
              <strong>Icon Size:</strong> 12px
            </div>
            <div>
              <strong>Font Size:</strong> 11px
            </div>
            <div>
              <strong>Font Weight:</strong> 600 (semibold)
            </div>
            <div>
              <strong>Gap:</strong> 2px
            </div>
            <div>
              <strong>Display:</strong> inline-flex
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChipShowcase;
