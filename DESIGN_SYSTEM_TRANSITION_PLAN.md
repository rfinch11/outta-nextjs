# Design System v2 Transition Plan

**Created:** January 16, 2026
**Status:** Planning

This document outlines the step-by-step transition from the current design system to v2 with Geist typography, Vaul drawers, and updated components.

---

## Overview

### Approach: Incremental Migration

We'll migrate in **5 phases**, each independently deployable and testable. This minimizes risk and allows rollback at any point.

```
Phase 1: Foundation (no visual changes)
    ↓
Phase 2: Typography (visual change, low risk)
    ↓
Phase 3: Responsive Modal System (functional change)
    ↓
Phase 4: Component Updates (visual refinement)
    ↓
Phase 5: Cleanup & Polish
```

### Estimated Scope

| Phase | Files Changed | Risk Level | Rollback Difficulty |
|-------|---------------|------------|---------------------|
| 1. Foundation | 3-4 | Low | Easy |
| 2. Typography | 10-15 | Low | Easy |
| 3. Modal System | 5-6 | Medium | Medium |
| 4. Components | 8-10 | Low | Easy |
| 5. Cleanup | 5-10 | Low | Easy |

---

## Phase 1: Foundation

**Goal:** Install packages and set up infrastructure without any visual changes.

### Tasks

#### 1.1 Install Dependencies
```bash
npm install geist vaul
```

#### 1.2 Create useMediaQuery Hook
Create `src/hooks/useMediaQuery.ts`:
```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

#### 1.3 Create ResponsiveModal Component
Create `src/components/ui/ResponsiveModal.tsx` (new file, not replacing anything yet):
```typescript
'use client';

import { Drawer } from 'vaul';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LuX } from 'react-icons/lu';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: (number | string)[];
  footer?: React.ReactNode;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  snapPoints,
  footer,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Desktop: Centered modal
  if (isDesktop) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl outline-none w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl z-50">
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-black-100">
                <Drawer.Title className="text-xl font-semibold">{title}</Drawer.Title>
                <Drawer.Close asChild>
                  <button className="p-2 hover:bg-black-50 rounded-md" aria-label="Close">
                    <LuX className="w-5 h-5 text-black-500" />
                  </button>
                </Drawer.Close>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
            {footer && (
              <div className="p-4 border-t border-black-100">
                {footer}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Mobile: Bottom sheet
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl outline-none max-h-[96vh] flex flex-col z-50">
          <div className="mx-auto mt-4 mb-2 w-12 h-1.5 rounded-full bg-black-200" />
          {title && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-black-100">
              <Drawer.Title className="text-xl font-semibold">{title}</Drawer.Title>
              <Drawer.Close asChild>
                <button className="p-2 hover:bg-black-50 rounded-md" aria-label="Close">
                  <LuX className="w-5 h-5 text-black-500" />
                </button>
              </Drawer.Close>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
          {footer && (
            <div className="p-4 border-t border-black-100">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

#### 1.4 Add Path Alias for Hooks
Update `tsconfig.json` paths if needed:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Testing Checkpoint
- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] Site loads normally (no visual changes expected)
- [ ] New ResponsiveModal can be imported without errors

### Commit
```
feat: add foundation for design system v2

- Install geist and vaul packages
- Add useMediaQuery hook
- Add ResponsiveModal component (not yet in use)
```

---

## Phase 2: Typography

**Goal:** Switch from Bricolage Grotesque to Geist Sans/Mono.

### Tasks

#### 2.1 Update Layout
Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// Remove: import { Bricolage_Grotesque } from "next/font/google";
// Remove: const bricolageGrotesque = Bricolage_Grotesque({...});

export const metadata: Metadata = {
  title: "Outta - Kid-friendly adventures near you",
  description: "Discover fun kid-friendly events, activities, and camps in your area",
  // ... icons unchanged
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### 2.2 Update Global CSS
Update `src/app/globals.css`:
```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.font-mono {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}
```

Remove references to `--font-bricolage-grotesque`.

#### 2.3 Search and Replace Font References
Find and update any components using the old font variable:
```bash
# Find all references
grep -r "bricolage" src/
grep -r "font-bricolage" src/
```

### Testing Checkpoint
- [ ] Site renders with Geist font
- [ ] All text is readable and properly styled
- [ ] No font-related console errors
- [ ] Check key pages: Homepage, Event Detail, Filter Modal

### Commit
```
feat: migrate typography to Geist Sans

- Replace Bricolage Grotesque with Geist Sans/Mono
- Update layout.tsx font configuration
- Update globals.css font-family
```

---

## Phase 3: Modal System Migration

**Goal:** Convert existing modals to use ResponsiveModal with Vaul.

### Migration Order
1. SearchModal (simplest, full height)
2. LocationModal (simple form)
3. SubmitModal (form with validation)
4. FilterModal (most complex, multiple snap points)

### Tasks

#### 3.1 Migrate SearchModal
Update `src/components/SearchModal.tsx`:

**Before:** Custom implementation
**After:** Wrap content with ResponsiveModal

```typescript
'use client';

import { ResponsiveModal } from './ui/ResponsiveModal';
// ... other imports

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ... other props
}

export function SearchModal({ isOpen, onClose, ...props }: SearchModalProps) {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Search"
      snapPoints={[1]} // Full height for keyboard
    >
      {/* Existing search content - move from current modal body */}
    </ResponsiveModal>
  );
}
```

#### 3.2 Migrate LocationModal
Similar pattern, with snapPoints={[0.5, 1]}

#### 3.3 Migrate SubmitModal
Similar pattern, with snapPoints={[0.7, 1]}

#### 3.4 Migrate FilterModal
Most complex - extract content, use snapPoints={[0.6, 1]}

```typescript
<ResponsiveModal
  open={isOpen}
  onOpenChange={(open) => !open && onClose()}
  title="Filters"
  snapPoints={[0.6, 1]}
  footer={
    <div className="flex gap-3">
      <button onClick={handleReset} className="flex-1 px-4 py-3 border border-black-200 rounded-md">
        Reset
      </button>
      <button onClick={handleApply} className="flex-1 px-4 py-3 bg-broom-400 rounded-md">
        Apply Filters
      </button>
    </div>
  }
>
  {/* Filter content */}
</ResponsiveModal>
```

### Testing Checkpoint
- [ ] Each modal opens/closes correctly
- [ ] Mobile: Bottom sheet with drag gesture works
- [ ] Desktop: Centered modal with backdrop click works
- [ ] Snap points work correctly on mobile
- [ ] Form submissions still work
- [ ] No accessibility regressions (focus trap, escape key)

### Commits (one per modal)
```
refactor: migrate SearchModal to ResponsiveModal
refactor: migrate LocationModal to ResponsiveModal
refactor: migrate SubmitModal to ResponsiveModal
refactor: migrate FilterModal to ResponsiveModal
```

---

## Phase 4: Component Updates

**Goal:** Update buttons, badges, inputs, and cards with new styling.

### Tasks

#### 4.1 Update Chip Component
Update `src/components/Chip.tsx` with refined badge styles:
- Consistent padding and typography
- Updated color mappings
- Border radius standardization

#### 4.2 Standardize Button Styles
Create shared button style utilities or use Geist Button where appropriate.

Update these components:
- Homepage.tsx (filter buttons, load more)
- FilterModal content
- EventDetail.tsx (action buttons)
- TabBar.tsx (tab buttons)

#### 4.3 Apply Material Classes
Add surface treatments to:
- ClickableCard.tsx → `material-medium`
- BentoMenuPopover.tsx → `material-menu`
- Tooltips → `material-tooltip`

#### 4.4 Update Input Styling
Standardize input appearance across:
- SearchModal search input
- LocationModal zip code input
- Any other form inputs

### Testing Checkpoint
- [ ] Buttons have consistent hover/active states
- [ ] Badges/chips render correctly
- [ ] Cards have appropriate shadows and radii
- [ ] Inputs have focus states
- [ ] Visual consistency across all pages

### Commit
```
feat: update components with design system v2 styling

- Refine Chip badge styles
- Standardize button styles
- Apply material classes to surfaces
- Update input styling
```

---

## Phase 5: Cleanup & Polish

**Goal:** Remove old code, optimize, and document.

### Tasks

#### 5.1 Remove Dead Code
- Remove old modal animation CSS if unused
- Remove Bricolage Grotesque references
- Remove any deprecated style utilities

#### 5.2 Update Documentation
- Update CLAUDE.md with new design system info
- Update component documentation
- Add storybook stories if applicable

#### 5.3 Performance Check
```bash
# Check bundle size impact
npm run build
# Compare bundle sizes before/after
```

#### 5.4 Final Testing
- Full E2E test suite
- Manual testing on:
  - iOS Safari
  - Android Chrome
  - Desktop Chrome/Safari/Firefox
- Accessibility audit (keyboard navigation, screen reader)

#### 5.5 Remove Old Modal Components (if fully replaced)
Only if all modals successfully migrated and tested.

### Commit
```
chore: cleanup design system v1 artifacts

- Remove deprecated font references
- Remove unused CSS
- Update documentation
```

---

## Rollback Plan

### If Issues in Phase 2 (Typography)
```bash
# Revert layout.tsx and globals.css
git checkout HEAD~1 -- src/app/layout.tsx src/app/globals.css
```

### If Issues in Phase 3 (Modals)
Each modal is migrated independently. Revert specific modal file:
```bash
git checkout HEAD~1 -- src/components/[ModalName].tsx
```

### If Issues in Phase 4 (Components)
Component updates are isolated. Revert specific files as needed.

### Full Rollback
```bash
# Create rollback branch before starting
git checkout -b design-system-v2-backup

# If full rollback needed
git checkout main
git revert --no-commit HEAD~[n]..HEAD
```

---

## Timeline Suggestion

| Phase | Suggested Duration | Deploy After? |
|-------|-------------------|---------------|
| 1. Foundation | 1 session | Yes (no visible changes) |
| 2. Typography | 1 session | Yes |
| 3. Modals | 2-3 sessions | Yes (after each modal) |
| 4. Components | 1-2 sessions | Yes |
| 5. Cleanup | 1 session | Yes |

---

## Questions Before Starting

1. **Branch Strategy**: Work on `main` with small commits, or create a `design-system-v2` feature branch?

2. **Deployment Cadence**: Deploy after each phase, or batch phases together?

3. **Testing Priority**: Which pages/flows are most critical to test?

4. **Feature Flags**: Should we add a feature flag to toggle between old/new modals during transition?

---

## Ready to Begin?

Once you approve this plan, we can start with **Phase 1: Foundation** which has zero visual impact and sets up the infrastructure for the rest of the migration.
