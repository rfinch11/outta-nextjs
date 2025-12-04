# Design System Color Migration Guide

## Overview

This guide helps you migrate from the legacy single-value color system to the new design system color scales.

## What Changed?

### Old System (Legacy - Still Works!)
```tsx
// Single colors only
className="bg-outta-yellow text-outta-dark"
```

### New System (Recommended)
```tsx
// Full color scales with shades 50-950
className="bg-broom-400 text-black-800"
className="bg-flamenco-500 hover:bg-flamenco-600"
```

## Color Mappings

| Legacy Color | New Color Scale | Recommended Shade |
|--------------|-----------------|-------------------|
| `outta-yellow` | `broom` | `broom-400` |
| `outta-orange` | `flamenco` | `flamenco-500` |
| `outta-blue` | `malibu` | `malibu-100` (light) |
| `outta-green` | `emerald` | `emerald-500` |
| `outta-dark` | `black` | `black-800` |

## New Color Scales

### Broom (Yellow/Brown)
- **Use for**: Primary brand color, highlights, call-to-actions
- **Shades**: 50 (lightest) → 950 (darkest)
- **Key shades**:
  - `broom-400`: Main yellow (#fff407) - matches legacy yellow
  - `broom-700`: Dark accent
  - `broom-100`: Light background

### Flamenco (Orange)
- **Use for**: Secondary actions, warm accents
- **Key shades**:
  - `flamenco-500`: Main orange (#ff7e08) - matches legacy orange
  - `flamenco-600`: Hover states
  - `flamenco-100`: Light backgrounds

### Lavender Magenta (Purple)
- **Use for**: Special features, premium content, unique accents
- **NEW color** (no legacy equivalent)
- **Key shades**:
  - `lavender-magenta-500`: Main purple
  - `lavender-magenta-100`: Light backgrounds

### Emerald (Green)
- **Use for**: Success states, positive actions, growth
- **Key shades**:
  - `emerald-500`: Main green (#35cb75) - close to legacy green
  - `emerald-600`: Hover states
  - `emerald-100`: Light backgrounds

### Malibu (Blue)
- **Use for**: Info states, links, trust signals
- **Key shades**:
  - `malibu-100`: Light blue (#dff2ff) - close to legacy blue
  - `malibu-500`: Main blue
  - `malibu-700`: Dark accent

### Black (Grayscale)
- **Use for**: Text, borders, neutral elements
- **Key shades**:
  - `black-950`: Pure black (#000000)
  - `black-800`: Dark gray (#454545) - close to legacy dark
  - `black-500`: Mid gray
  - `black-100`: Light gray

## Migration Strategy

### Phase 1: Non-Breaking (Current)
✅ **Legacy colors still work!** All existing code continues to function.
```tsx
// This still works
<div className="bg-outta-yellow" />
```

### Phase 2: Gradual Migration (Recommended)
Migrate one component at a time to new scales:

```tsx
// Before
<button className="bg-outta-yellow hover:opacity-80">
  Click me
</button>

// After (with proper hover state)
<button className="bg-broom-400 hover:bg-broom-500">
  Click me
</button>
```

### Phase 3: Full Adoption
Once all components use new scales, legacy colors can be removed.

## Usage Examples

### TypeScript Usage
```typescript
import { getColor, colorScales } from '@/lib/design-system-colors';

// Get specific color
const mainYellow = getColor('broom', 400); // #fff407

// Use in components
const buttonColor = colorScales.flamenco[500];
```

### Tailwind Classes
```tsx
// Backgrounds
<div className="bg-broom-400" />
<div className="bg-flamenco-500 hover:bg-flamenco-600" />

// Text
<p className="text-black-800" />
<h1 className="text-broom-700" />

// Borders
<div className="border border-malibu-300" />

// Gradients
<div className="bg-gradient-to-r from-broom-400 to-flamenco-500" />
```

### CSS Variables
```css
/* Use in custom CSS */
.my-element {
  background: var(--color-broom-400);
  color: var(--color-black-800);
}

.my-element:hover {
  background: var(--color-broom-500);
}
```

## Benefits of New System

1. **Flexibility**: 11 shades per color (50-950) instead of 1
2. **Consistency**: Systematic approach to color usage
3. **Accessibility**: Easier to ensure proper contrast ratios
4. **Scalability**: New colors (lavender-magenta) can be added
5. **Developer Experience**: Better hover states, active states, disabled states

## Testing Your Migration

1. **Visual Regression**: Check all pages for visual differences
2. **Accessibility**: Run contrast checks on new color combinations
3. **Browser Testing**: Test in different browsers
4. **Dark Mode**: Consider dark mode variants if needed

## Rollback Plan

If issues arise, legacy colors remain functional:
1. Simply revert component changes
2. Legacy colors in `globals.css` are preserved
3. No database or API changes required

## Need Help?

- Check color values in `/src/lib/design-system-colors.ts`
- View all colors in `/src/app/globals.css`
- Test colors in Figma or design tools first
- Questions? Create an issue or PR

---

**Status**: ✅ Phase 1 complete - Both systems work side-by-side
**Next**: Begin gradual component migration to new scales
