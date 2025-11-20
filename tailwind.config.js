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
          canvas: '#F5F5F5',
          DEFAULT: '#FFFFFF',
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
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
          dark: '#D1D5DB',
        },
        // Element colors (for notes, sections, etc.)
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
        'element': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'element-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'element-selected': '0 0 0 2px #4F46E5',
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
