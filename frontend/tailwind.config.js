/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        civic: {
          primary: '#1E6F42',
          'primary-dark': '#144A2C',
          'primary-light': '#8CC63F',
          'primary-soft': '#F0FDF4',
          orange: '#F6A261',
          pink: '#DD47A1',
          blue: '#2563EB',
          critical: '#DC2626',
          'critical-bg': '#FEE2E2',
          medium: '#D97706',
          'medium-bg': '#FEF3C7',
          resolved: '#16A34A',
          'resolved-bg': '#DCFCE7',
          page: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          'text-main': '#1E293B',
          'text-body': '#475569',
          'text-muted': '#94A3B8',
        },
      },
      borderRadius: {
        'card': '16px',
        'modal': '20px',
      },
      boxShadow: {
        'civic-card': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'civic-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'civic-modal': '0 20px 40px rgba(0, 0, 0, 0.14)',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}

