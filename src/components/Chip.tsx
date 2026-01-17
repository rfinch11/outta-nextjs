'use client';

import React from 'react';
import { LuBadgeCheck, LuTag, LuMegaphone, LuTrophy, LuSparkles, LuClock } from 'react-icons/lu';

export type ChipVariant = 'scoutpick' | 'deal' | 'promoted' | 'new' | 'comingsoon' | 'toprated';

interface ChipProps {
  variant: ChipVariant;
  label?: string;
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * Chip component for displaying badges and labels
 *
 * Design System v2 - Uses Outta color palette with subtle borders
 *
 * Available variants:
 * - scoutpick: Purple badge with verified icon for editor picks
 * - deal: Green badge with tag icon for special deals
 * - promoted: Blue badge with megaphone icon for promoted content
 * - new: Yellow badge with sparkle icon for new listings
 * - comingsoon: Gray badge with clock icon for upcoming listings
 * - toprated: Orange badge with trophy icon for highly rated items
 *
 * @example
 * <Chip variant="scoutpick" />
 * <Chip variant="deal" label="Free" />
 * <Chip variant="toprated" size="md" />
 */
const Chip: React.FC<ChipProps> = ({ variant, label, className = '', size = 'sm' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'scoutpick':
        return {
          container: 'bg-lavender-magenta-100 border-lavender-magenta-200',
          text: 'text-lavender-magenta-700',
          icon: <LuBadgeCheck className="text-lavender-magenta-600" />,
          defaultLabel: 'Scout Pick',
        };
      case 'deal':
        return {
          container: 'bg-emerald-100 border-emerald-200',
          text: 'text-emerald-700',
          icon: <LuTag className="text-emerald-600" />,
          defaultLabel: 'Deal',
        };
      case 'promoted':
        return {
          container: 'bg-malibu-100 border-malibu-200',
          text: 'text-malibu-700',
          icon: <LuMegaphone className="text-malibu-600" />,
          defaultLabel: 'Promoted',
        };
      case 'new':
        return {
          container: 'bg-broom-100 border-broom-200',
          text: 'text-broom-700',
          icon: <LuSparkles className="text-broom-600" />,
          defaultLabel: 'New',
        };
      case 'comingsoon':
        return {
          container: 'bg-black-100 border-black-200',
          text: 'text-black-600',
          icon: <LuClock className="text-black-500" />,
          defaultLabel: 'Coming Soon',
        };
      case 'toprated':
        return {
          container: 'bg-flamenco-100 border-flamenco-200',
          text: 'text-flamenco-700',
          icon: <LuTrophy className="text-flamenco-600" />,
          defaultLabel: 'Top Rated',
        };
    }
  };

  const sizeStyles = {
    sm: 'px-1.5 py-1 text-[11px] gap-1 [&_svg]:w-3 [&_svg]:h-3',
    md: 'px-2 py-1.5 text-xs gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5',
  };

  const styles = getVariantStyles();
  const displayLabel = label || styles.defaultLabel;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-semibold leading-none border ${styles.container} ${styles.text} ${sizeStyles[size]} ${className}`}
    >
      {styles.icon}
      <span>{displayLabel}</span>
    </span>
  );
};

export default Chip;
