'use client';

import React from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import type { Listing } from '@/lib/supabase';
import ClickableCard from './ClickableCard';

interface CollectionSectionProps {
  title: string;
  href: string;
  listings: Listing[];
}

const CollectionSection: React.FC<CollectionSectionProps> = ({
  title,
  href,
  listings,
}) => {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Collection Header */}
      <Link
        href={href}
        className="inline-flex items-center gap-1 mb-3 group"
      >
        <h2 className="text-xl font-bold text-malibu-950">{title}</h2>
        <LuChevronRight
          size={20}
          className="text-malibu-950 opacity-50 transition-transform group-hover:translate-x-1"
        />
      </Link>

      {/* Collection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {listings.slice(0, 6).map((listing, index) => (
          <div
            key={listing.airtable_id}
            className={index >= 4 ? 'hidden lg:block' : ''}
          >
            <ClickableCard
              airtable_id={listing.airtable_id}
              title={listing.title}
              type={listing.type}
              scout_pick={listing.scout_pick}
              deal={listing.deal}
              promoted={listing.promoted}
              city={listing.city}
              distance={listing.distance || 0}
              image={listing.image}
              place_id={listing.place_id}
              start_date={listing.start_date}
              place_type={listing.place_type}
              description={listing.description}
              organizer={listing.organizer}
              rating={listing.rating}
              price={listing.price}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CollectionSection;
