'use client';

import React from 'react';
import { VscVerified } from 'react-icons/vsc';
import { LuTag } from 'react-icons/lu';
import { PiMegaphoneBold, PiTrophyBold } from 'react-icons/pi';

export type ChipVariant = 'scoutpick' | 'deal' | 'promoted' | 'new' | 'comingsoon' | 'toprated';

interface ChipProps {
  variant: ChipVariant;
  label?: string;
  className?: string;
}

/**
 * Chip component for displaying badges and labels
 *
 * Available variants:
 * - scoutpick: Purple badge with verified icon for editor picks
 * - deal: Green badge with tag icon for special deals
 * - promoted: Blue badge with megaphone icon for promoted content
 * - new: Yellow badge for new listings
 * - comingsoon: Gray badge for upcoming listings
 * - toprated: Orange badge with trophy icon for highly rated items
 *
 * @example
 * <Chip variant="scoutpick" label="Scout Pick" />
 * <Chip variant="deal" label="50% Off" />
 * <Chip variant="toprated" />
 */
const Chip: React.FC<ChipProps> = ({ variant, label, className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'scoutpick':
        return {
          container: 'border-lavender-magenta-900 bg-lavender-magenta-100',
          icon: <VscVerified size={12} className="text-lavender-magenta-900" />,
          defaultLabel: 'Scout Pick',
        };
      case 'deal':
        return {
          container: 'border-emerald-900 bg-emerald-100',
          icon: <LuTag size={12} className="text-emerald-900" />,
          defaultLabel: 'Deal',
        };
      case 'promoted':
        return {
          container: 'border-malibu-900 bg-malibu-100',
          icon: <PiMegaphoneBold size={12} className="text-malibu-900" />,
          defaultLabel: 'Promoted',
        };
      case 'new':
        return {
          container: 'border-broom-800 bg-broom-50',
          icon: null,
          defaultLabel: 'New',
        };
      case 'comingsoon':
        return {
          container: 'border-black-800 bg-black-100',
          icon: null,
          defaultLabel: 'Coming Soon',
        };
      case 'toprated':
        return {
          container: 'border-flamenco-900 bg-flamenco-100',
          icon: <PiTrophyBold size={12} className="text-flamenco-900" />,
          defaultLabel: 'Top Rated',
        };
    }
  };

  const styles = getVariantStyles();
  const displayLabel = label || styles.defaultLabel;

  return (
    <span
      className={`inline-flex items-center justify-center gap-0.5 px-[5px] py-[2px] rounded-lg border text-[11px] font-semibold leading-none ${styles.container} ${className}`}
    >
      {styles.icon}
      <span>{displayLabel}</span>
    </span>
  );
};

export default Chip;
