/**
 * Color utilities for dark mode support
 */

/**
 * Converts a color to its dark mode equivalent
 * - Light colors (near white) become darker
 * - Already dark colors remain the same
 * - Colored backgrounds are slightly dimmed
 */
export function getDarkModeColor(color: string, isDark: boolean): string {
  if (!isDark) return color;

  // Common light colors that should become dark
  // Strategy: Canvas backgrounds (F5F5F5, F9FAFB) become DARK (gray-800/gray-900)
  //          Element backgrounds (FFFFFF white) become LIGHTER (gray-600) for contrast and text visibility
  const lightColorMap: Record<string, string> = {
    '#FFFFFF': '#4B5563', // white -> gray-600 (Elements - lighter for text visibility)
    '#F9FAFB': '#1F2937', // gray-50 -> gray-800 (Canvas - darker for contrast)
    '#F5F5F5': '#1F2937', // gray-50 variant -> gray-800 (Canvas)
    '#F3F4F6': '#1F2937', // gray-100 -> gray-800 (Canvas)
    '#E5E7EB': '#374151', // gray-200 -> gray-700
    '#D1D5DB': '#4B5563', // gray-300 -> gray-600
    '#DBEAFE': '#3B82F6', // blue-100 -> blue-500
    '#FEF3C7': '#EAB308', // yellow-100 -> yellow-500
    '#FED7AA': '#F97316', // orange-100 -> orange-500
    '#FECACA': '#EF4444', // red-100 -> red-500
    '#FBCFE8': '#EC4899', // pink-100 -> pink-500
    '#E9D5FF': '#A855F7', // purple-100 -> purple-500
    '#BBF7D0': '#22C55E', // green-100 -> green-500
  };

  // Check for exact match
  const upperColor = color.toUpperCase();
  if (lightColorMap[upperColor]) {
    return lightColorMap[upperColor];
  }

  // For other colors, try to detect if it's a light color
  // Convert hex to RGB and check brightness
  const rgb = hexToRgb(color);
  if (rgb) {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    // If color is very light (brightness > 230), make it gray-600 (elements)
    if (brightness > 230) {
      return '#4B5563'; // gray-600 (for element backgrounds)
    }

    // If color is light (brightness > 200), make it darker for canvas-like backgrounds
    if (brightness > 200) {
      return '#1F2937'; // gray-800 (for canvas backgrounds)
    }

    // If color is light-ish (brightness > 150), darken it moderately
    if (brightness > 150) {
      return rgbToHex(
        Math.floor(rgb.r * 0.4),
        Math.floor(rgb.g * 0.4),
        Math.floor(rgb.b * 0.4)
      );
    }
  }

  return color;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle short hex (e.g., #FFF)
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
 * Get text color based on background brightness
 * Returns white for dark backgrounds, dark for light backgrounds
 */
export function getTextColorForBackground(backgroundColor: string, isDark: boolean): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return isDark ? '#F3F4F6' : '#1F2937';

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // In dark mode, we need to check against the potentially darkened background
  if (isDark) {
    const darkBg = getDarkModeColor(backgroundColor, true);
    const darkRgb = hexToRgb(darkBg);
    if (darkRgb) {
      const darkBrightness = (darkRgb.r * 299 + darkRgb.g * 587 + darkRgb.b * 114) / 1000;
      return darkBrightness > 125 ? '#1F2937' : '#F3F4F6';
    }
  }

  return brightness > 125 ? '#1F2937' : '#F3F4F6';
}
