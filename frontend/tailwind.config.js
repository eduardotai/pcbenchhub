/**
 * PC BENCHHUB - Tailwind Config v3.0 "Dark Editorial Industrial"
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },

      colors: {
        canvas: '#0a0908',
        ink: '#141210',
        coal: '#1c1918',
        steel: '#2c2725',
        accent: {
          DEFAULT: '#ff6a1a',
          dim: '#d65a18',
          bright: '#ff8751',
        },
        success: '#68c08a',
        warning: '#f6ad55',
        danger: '#ff6d62',
        cpu: '#7bb0ff',
        gpu: '#ff9a61',
        ram: '#bc9dff',
        storage: '#74d1a8',
      },

      boxShadow: {
        sm: '0 10px 30px rgba(0, 0, 0, 0.16)',
        md: '0 20px 45px rgba(0, 0, 0, 0.22)',
        lg: '0 30px 70px rgba(0, 0, 0, 0.28)',
        accent: '0 16px 40px rgba(255, 106, 26, 0.22)',
      },

      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },

      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px rgba(104, 192, 138, 0.65)' },
          '50%': { opacity: '0.58', boxShadow: '0 0 12px rgba(104, 192, 138, 0.95)' }
        }
      },

      animation: {
        floatIn: 'floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
      },

      backgroundSize: {
        '200%': '200% 200%',
        '300%': '300% 300%',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    }
  },
  plugins: []
};
