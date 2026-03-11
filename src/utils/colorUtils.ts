/**
 * Color utilities for dark mode support
 *
 * Dark mode surface hierarchy:
 *   Level 0  #101418  — Canvas / deepest background
 *   Level 1  #1E252B  — Cards, panels (elevated)
 *   Level 2  #252B32  — Nested panels, table headers, hover states
 *   Level 3  #2C333A  — Active states, raised UI
 *
 * Dark mode text:
 *   Primary   #E0E6ED  — Off-white body text
 *   Secondary #B1B9C4  — Muted labels
 *   Heading   #FFFFFF  — Pure white, titles only
 *
 * Dark mode borders:
 *   Default   #30363D  — Subtle card delimiter
 *   Strong    #3D444D  — Hover / focus
 */

/**
 * Converts a color to its dark mode equivalent.
 * Light backgrounds → surface levels; element tints → saturated variants.
 */
export function getDarkModeColor(color: string, isDark: boolean): string {
  if (!isDark) return color;

  const lightColorMap: Record<string, string> = {
    // Canvas / page backgrounds → Surface 0
    '#F9FAFB': '#101418',
    '#F5F5F5': '#101418',
    '#F4F7F9': '#101418',
    '#F3F4F6': '#101418',
    '#F0F2F5': '#1E252B',

    // Card / element backgrounds → Surface 1
    '#FFFFFF': '#1E252B',
    '#FAFAFA': '#1E252B',

    // Borders & dividers
    '#E5E7EB': '#30363D',
    '#E1E4E8': '#30363D',
    '#E1E8ED': '#252B32',
    '#D1D5DB': '#3D444D',

    // Element accent tints → dimmed saturated variants
    '#DBEAFE': '#1E3A5F', // blue-100 → dark blue
    '#FEF3C7': '#5C4813', // yellow-100 → dark amber
    '#FED7AA': '#5C3310', // orange-100 → dark orange
    '#FECACA': '#5C1A1A', // red-100 → dark red
    '#FBCFE8': '#5C1A3D', // pink-100 → dark pink
    '#E9D5FF': '#3B1A5C', // purple-100 → dark purple
    '#BBF7D0': '#1A4D2E', // green-100 → dark green
    '#D1FAE5': '#1A4D2E', // green-100 alt → dark green
  };

  const upperColor = color.toUpperCase();
  if (lightColorMap[upperColor]) {
    return lightColorMap[upperColor];
  }

  // Brightness-based fallback for unlisted colors
  const rgb = hexToRgb(color);
  if (rgb) {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    // Very light → Surface 1 (card level)
    if (brightness > 230) {
      return '#1E252B';
    }

    // Light → Surface 0 (canvas level)
    if (brightness > 200) {
      return '#101418';
    }

    // Light-ish → darken proportionally
    if (brightness > 150) {
      return rgbToHex(
        Math.floor(rgb.r * 0.35),
        Math.floor(rgb.g * 0.35),
        Math.floor(rgb.b * 0.35)
      );
    }
  }

  return color;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Get text color based on background brightness.
 * Dark mode uses off-white (#E0E6ED), not pure white.
 */
export function getTextColorForBackground(backgroundColor: string, isDark: boolean): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return isDark ? '#E0E6ED' : '#1C1E21';

  if (isDark) {
    const darkBg = getDarkModeColor(backgroundColor, true);
    const darkRgb = hexToRgb(darkBg);
    if (darkRgb) {
      const darkBrightness = (darkRgb.r * 299 + darkRgb.g * 587 + darkRgb.b * 114) / 1000;
      return darkBrightness > 125 ? '#1C1E21' : '#E0E6ED';
    }
  }

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 125 ? '#1C1E21' : '#E0E6ED';
}
