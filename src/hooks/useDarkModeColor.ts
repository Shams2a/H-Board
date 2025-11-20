/**
 * Hook to get dark mode adapted color
 */

import { useThemeStore } from '../store';
import { getDarkModeColor } from '../utils/colorUtils';

export function useDarkModeColor(color: string): string {
  const { actualTheme } = useThemeStore();
  const isDark = actualTheme === 'dark';
  return getDarkModeColor(color, isDark);
}
