/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // H-Board color palette
        background: {
          canvas: '#F4F7F9',      // Light mode canvas — cool gray, not flat white
          DEFAULT: '#FFFFFF',      // Light mode surfaces (cards, panels)
        },
        // Dark mode surface hierarchy (Level 0 → 3)
        surface: {
          0: '#101418',   // Canvas / deepest background — blue-gray ultra-deep
          1: '#1E252B',   // Cards & panels — elevated from canvas
          2: '#252B32',   // Nested panels, table headers, hover states
          3: '#2C333A',   // Active states, raised UI
        },
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5', // Main accent color
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        text: {
          // Light mode
          primary: '#1C1E21',     // Near-black, not pure black — professional
          secondary: '#6A737D',   // Muted gray for secondary content
          tertiary: '#9CA3AF',    // Placeholder / disabled
          // Dark mode (accessed via dark: prefix)
          'dark-primary': '#E0E6ED',     // Off-white — no haloing
          'dark-secondary': '#B1B9C4',   // Muted light gray
          'dark-tertiary': '#6B7280',    // Subtle
          'dark-heading': '#FFFFFF',     // Pure white for headings only
        },
        border: {
          DEFAULT: '#E1E4E8',     // Light mode — subtle
          light: '#F3F4F6',
          dark: '#D1D5DB',
          // Dark mode borders
          'dark-DEFAULT': '#30363D',  // Subtle delimiter for cards
          'dark-light': '#252B32',
          'dark-strong': '#3D444D',
        },
        // Element colors (for notes, shapes, etc.)
        element: {
          yellow: '#FEF3C7',
          orange: '#FED7AA',
          red: '#FECACA',
          pink: '#FBCFE8',
          purple: '#E9D5FF',
          blue: '#BFDBFE',
          green: '#BBF7D0',
          gray: '#E5E7EB',
        }
      },
      boxShadow: {
        // Light mode — soft floating shadows
        'element': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'element-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'element-selected': '0 0 0 2px #4F46E5',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
        // Dark mode — very subtle, mostly rely on surface color hierarchy
        'dark-element': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        'dark-card': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'dark-card-hover': '0 4px 16px rgba(0, 0, 0, 0.35)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        'sidebar': '40',
        'toolbar': '50',
        'modal': '100',
        'tooltip': '110',
      },
      transitionDuration: {
        '400': '400ms',
      }
    },
  },
  plugins: [],
}
