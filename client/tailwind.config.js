/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // MongoDB-Inspired Identity & Theme Tokens
        cream: '#FAF9F5',
        creamMuted: '#F4F3EB',
        forest: '#001E2B',
        forestLight: '#023430',
        emeraldDark: '#00684A',
        emeraldHover: '#02523a',
        emeraldNeon: '#00ED64',
        emeraldSoft: '#E6F8ED',
        
        // Brand & Theme Identity
        brand: '#00684A',
        brandDark: '#023430',
        brandLight: '#E6F8ED',
        brandNavy: '#001E2B',
        accent: '#001E2B',
        accentLight: '#F4F3EB',
        accentOrange: '#F97316',
        surface: '#FFFFFF',
        background: '#FAF9F5',
        textPrimary: '#001E2B',
        textSecondary: '#4A5568',
        border: '#E2E1D9',
        
        // Backward-compatible aliases
        primary: '#00684A',
        primaryDark: '#023430',
        
        // Semantic Status Tokens
        statusSuccess: '#00684A',
        statusWarning: '#D97706',
        statusCritical: '#DC2626',
        statusNeutral: '#64748B',
      },
      borderColor: {
        DEFAULT: '#E2E8F0',
        border: '#E2E8F0',
      },
      boxShadow: {
        'soft': '0 2px 8px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 10px -1px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'brand': '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
      },
      borderRadius: {
        'card': '1.25rem',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
