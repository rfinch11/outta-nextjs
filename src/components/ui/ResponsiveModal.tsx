'use client';

import { Drawer } from 'vaul';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { LuX } from 'react-icons/lu';
import { ReactNode } from 'react';

export interface ResponsiveModalProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal content */
  children: ReactNode;
  /** Optional title displayed in header */
  title?: string;
  /** Optional description for accessibility */
  description?: string;
  /** Snap points for mobile bottom sheet (e.g., [0.5, 1] for 50% and 100%) */
  snapPoints?: (number | string)[];
  /** Optional footer content (e.g., action buttons) */
  footer?: ReactNode;
  /** Whether the modal can be dismissed by clicking outside or dragging */
  dismissible?: boolean;
  /** Maximum width for desktop modal (default: max-w-lg) */
  maxWidth?: string;
}

/**
 * ResponsiveModal - A modal that renders as a centered dialog on desktop
 * and a bottom sheet drawer on mobile.
 *
 * Uses Vaul for the drawer functionality with proper gesture handling.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  snapPoints,
  footer,
  dismissible = true,
  maxWidth = 'max-w-lg',
}: ResponsiveModalProps) {
  const isDesktop = useIsDesktop();

  // Desktop: Centered modal
  if (isDesktop) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl outline-none w-full ${maxWidth} max-h-[85vh] flex flex-col shadow-xl z-50`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-black-100 shrink-0">
                <Drawer.Title className="text-xl font-semibold text-black-950">
                  {title}
                </Drawer.Title>
                <Drawer.Close asChild>
                  <button
                    className="p-2 hover:bg-black-50 rounded-md transition-colors"
                    aria-label="Close"
                  >
                    <LuX className="w-5 h-5 text-black-500" />
                  </button>
                </Drawer.Close>
              </div>
            )}
            {description && (
              <Drawer.Description className="sr-only">{description}</Drawer.Description>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className="p-4 border-t border-black-100 shrink-0">{footer}</div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Mobile: Bottom sheet
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissible={dismissible}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl outline-none max-h-[96vh] flex flex-col z-50">
          {/* Drag handle */}
          <div className="mx-auto mt-4 mb-2 w-12 h-1.5 rounded-full bg-black-200 shrink-0" />

          {title && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-black-100 shrink-0">
              <Drawer.Title className="text-xl font-semibold text-black-950">
                {title}
              </Drawer.Title>
              <Drawer.Close asChild>
                <button
                  className="p-2 hover:bg-black-50 rounded-md transition-colors"
                  aria-label="Close"
                >
                  <LuX className="w-5 h-5 text-black-500" />
                </button>
              </Drawer.Close>
            </div>
          )}
          {description && (
            <Drawer.Description className="sr-only">{description}</Drawer.Description>
          )}

          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          {footer && (
            <div className="p-4 border-t border-black-100 shrink-0">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default ResponsiveModal;
