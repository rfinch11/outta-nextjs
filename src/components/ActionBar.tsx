'use client';

import React from 'react';

/**
 * ActionBar Component
 *
 * @description
 * A fixed position action bar with a pill-shaped white container that holds
 * multiple action buttons. Used consistently across the app for quick access
 * to common actions.
 *
 * @layout
 * - Fixed positioning (top-right by default)
 * - White rounded pill container (rounded-[60px])
 * - Subtle shadow (shadow-sm)
 * - Compact padding (p-2)
 * - Buttons arranged horizontally with gap-2
 *
 * @buttons
 * - Size: w-11 h-11 (44px × 44px)
 * - Shape: rounded-full
 * - Background: bg-transparent with hover:bg-gray-100
 * - Icons: 17px size
 * - No text labels (icons only)
 *
 * @usage
 * ```tsx
 * <ActionBar position="top-right">
 *   <ActionBar.Button onClick={handleShare} aria-label="Share">
 *     <LuShare size={17} />
 *   </ActionBar.Button>
 *   <ActionBar.Button onClick={handleCalendar} aria-label="Add to calendar">
 *     <LuCalendar size={17} />
 *   </ActionBar.Button>
 * </ActionBar>
 * ```
 *
 * @see Homepage.tsx - Search, Location, Add listing actions
 * @see EventDetail.tsx - Share, Calendar, Website actions
 */

interface ActionBarProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right';
  className?: string;
}

interface ActionBarButtonProps {
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
  'aria-label': string;
  type?: 'button' | 'submit' | 'reset';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isActive?: boolean;
}

const ActionBar: React.FC<ActionBarProps> & { Button: React.FC<ActionBarButtonProps> } = ({
  children,
  position = 'top-right',
  className = '',
}) => {
  const positionClasses = {
    'top-left': 'top-5 left-5',
    'top-right': 'top-5 right-5',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="flex items-center gap-2 bg-white rounded-[60px] shadow-sm p-2">
        {children}
      </div>
    </div>
  );
};

const ActionBarButton: React.FC<ActionBarButtonProps> = ({
  onClick,
  href,
  target,
  rel,
  children,
  'aria-label': ariaLabel,
  type = 'button',
  onMouseEnter,
  onMouseLeave,
  isActive = false,
}) => {
  const baseClasses = `w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
    isActive ? 'bg-malibu-50' : 'bg-transparent hover:bg-gray-100'
  }`;

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`${baseClasses} no-underline`}
        aria-label={ariaLabel}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      type={type}
      className={baseClasses}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
};

ActionBar.Button = ActionBarButton;

export default ActionBar;
