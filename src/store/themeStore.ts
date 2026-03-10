/**
 * Theme Store
 * Manages dark/light theme state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // The actual applied theme (resolved from system)

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Helper to get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper to resolve actual theme
const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// Helper to apply theme to DOM
const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      actualTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const actualTheme = resolveTheme(theme);
        applyTheme(actualTheme);
        set({ theme, actualTheme });
      },

      toggleTheme: () => {
        const current = get().actualTheme;
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        set({ theme: newTheme, actualTheme: newTheme });
      }
    }),
    {
      name: 'h-board-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state) {
          const actualTheme = resolveTheme(state.theme);
          applyTheme(actualTheme);
          state.actualTheme = actualTheme;
        }
      }
    }
  )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      useThemeStore.setState({ actualTheme: newTheme });
    }
  });
}

// Selectors
type ThemeStoreState = ReturnType<typeof useThemeStore.getState>;
export const selectTheme = (state: ThemeStoreState) => state.theme;
export const selectActualTheme = (state: ThemeStoreState) => state.actualTheme;
