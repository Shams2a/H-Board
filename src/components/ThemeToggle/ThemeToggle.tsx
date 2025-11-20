/**
 * Theme Toggle Component
 * Allows switching between light and dark modes
 */

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store';

export const ThemeToggle: React.FC = () => {
  const { actualTheme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg transition-colors
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
      "
      title={actualTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      aria-label="Toggle theme"
    >
      {actualTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};
