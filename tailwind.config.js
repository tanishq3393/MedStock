/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A6E79',
          50: '#EDF9FA',
          100: '#D5F1F3',
          200: '#AFE2E7',
          300: '#7ACCD6',
          400: '#3BB0C0',
          500: '#0A6E79',
          600: '#085A63',
          700: '#06474E',
          800: '#05363B',
          900: '#032529',
        },
        secondary: {
          DEFAULT: '#1A3A4A',
          50: '#F0F5F8',
          100: '#D9E6ED',
          200: '#B5CEDC',
          300: '#8CB1C7',
          400: '#5F8FA9',
          500: '#1A3A4A',
          600: '#142E3B',
          700: '#0F222C',
          800: '#0A171E',
          900: '#050C0F',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FEF9EE',
          100: '#FDF2D7',
          200: '#FBE3AB',
          300: '#F8CE75',
          400: '#F6B73E',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        content: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
          light: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(10, 110, 121, 0.08), 0 8px 10px -6px rgba(10, 110, 121, 0.04)',
        'glow': '0 0 20px rgba(10, 110, 121, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
