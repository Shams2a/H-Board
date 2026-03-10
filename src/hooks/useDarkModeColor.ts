/**
 * Hook to get dark mode adapted color
 */

import { useThemeStore, selectActualTheme } from '../store';
import { getDarkModeColor } from '../utils/colorUtils';

export function useDarkModeColor(color: string): string {
  const actualTheme = useThemeStore(selectActualTheme);
  const isDark = actualTheme === 'dark';
  return getDarkModeColor(color, isDark);
}
