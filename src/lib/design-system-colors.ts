/**
 * Design System Color Scales
 *
 * This file contains all color scales for the design system.
 * Each scale includes shades from 50 (lightest) to 950 (darkest).
 */

export const colorScales = {
  broom: {
    50: '#fdfee8',
    100: '#faffc2',
    200: '#f9ff87',
    300: '#feff43',
    400: '#fff407',
    500: '#efdb03',
    600: '#ceac00',
    700: '#a47c04',
    800: '#88610b',
    900: '#734e10',
    950: '#432a05',
  },
  flamenco: {
    50: '#fff8ed',
    100: '#fff0d4',
    200: '#ffdda8',
    300: '#ffc470',
    400: '#ff9f37',
    500: '#ff7e08',
    600: '#f06606',
    700: '#c74c07',
    800: '#9e3c0e',
    900: '#7f340f',
    950: '#451705',
  },
  lavenderMagenta: {
    50: '#fef4ff',
    100: '#fde7ff',
    200: '#fcceff',
    300: '#fd9bff',
    400: '#fd74fe',
    500: '#f540f5',
    600: '#d920d5',
    700: '#b417ae',
    800: '#93158c',
    900: '#781771',
    950: '#51014c',
  },
  emerald: {
    50: '#f1fcf5',
    100: '#dff9ea',
    200: '#c0f2d4',
    300: '#8fe6b3',
    400: '#56d28a',
    500: '#35cb75',
    600: '#219854',
    700: '#1e7744',
    800: '#1c5f3a',
    900: '#194e31',
    950: '#082b19',
  },
  malibu: {
    50: '#eff9ff',
    100: '#dff2ff',
    200: '#b8e8ff',
    300: '#78d6ff',
    400: '#40c6ff',
    500: '#06aaf1',
    600: '#0088ce',
    700: '#006ca7',
    800: '#025b8a',
    900: '#084c72',
    950: '#06304b',
  },
  black: {
    50: '#f6f6f6',
    100: '#e7e7e7',
    200: '#d1d1d1',
    300: '#b0b0b0',
    400: '#888888',
    500: '#6d6d6d',
    600: '#5d5d5d',
    700: '#4f4f4f',
    800: '#454545',
    900: '#3d3d3d',
    950: '#000000',
  },
} as const;

// Type for color scale keys
export type ColorScale = keyof typeof colorScales;

// Type for shade values
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * Helper function to get a specific color from the design system
 * @param scale - The color scale name
 * @param shade - The shade value (50-950)
 * @returns The hex color value
 */
export function getColor(scale: ColorScale, shade: ColorShade): string {
  return colorScales[scale][shade];
}

/**
 * Legacy color mappings for backward compatibility
 * Maps old single-value colors to new scale-based colors
 */
export const legacyColorMap = {
  'outta-yellow': colorScales.broom[400],    // #FFF407 -> #fff407 (matches!)
  'outta-orange': colorScales.flamenco[500], // #FF7E08 -> #ff7e08 (matches!)
  'outta-blue': colorScales.malibu[100],     // #E3F2FD -> #dff2ff (similar light blue)
  'outta-green': colorScales.emerald[500],   // #3DD68C -> #35cb75 (similar green)
  'outta-dark': colorScales.black[800],      // #37474F -> #454545 (similar dark gray)
} as const;

/**
 * Tailwind CSS color configuration
 * Use this in your tailwind.config.js or @theme directive
 */
export const tailwindColors = {
  broom: colorScales.broom,
  flamenco: colorScales.flamenco,
  'lavender-magenta': colorScales.lavenderMagenta,
  emerald: colorScales.emerald,
  malibu: colorScales.malibu,
  black: colorScales.black,

  // Legacy aliases for backward compatibility
  'outta-yellow': colorScales.broom[400],
  'outta-orange': colorScales.flamenco[500],
  'outta-blue': colorScales.malibu[100],
  'outta-green': colorScales.emerald[500],
  'outta-dark': colorScales.black[800],
};

export default colorScales;
