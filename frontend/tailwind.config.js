/**
 * PC BENCHHUB — Tailwind Config v2.0 "Nebula Dark"
 * Extended design tokens: purple-dominant palette + category colors
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      /* ---- Font Families ---- */
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },

      /* ---- Color Palette ---- */
      colors: {
        void:    '#030711',
        base:    '#060c18',
        elev: {
          1: '#0a1020',
          2: '#0e1628',
          3: '#131e34',
        },
        accent: {
          DEFAULT: '#9b6dff',
          dim:     '#7c4dff',
          bright:  '#b387ff',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          dim:     '#0891b2',
        },
        emerald: {
          DEFAULT: '#10b981',
        },
        /* Category color tokens */
        cpu:     '#60a5fa',
        gpu:     '#fb923c',
        ram:     '#a78bfa',
        storage: '#34d399',
      },

      /* ---- Box Shadows ---- */
      boxShadow: {
        sm:    '0 2px 8px rgba(3, 7, 17, 0.4)',
        md:    '0 8px 24px rgba(3, 7, 17, 0.5)',
        lg:    '0 16px 48px rgba(3, 7, 17, 0.6)',
        glow:  '0 0 24px rgba(155, 109, 255, 0.22)',
        'glow-cyan':    '0 0 20px rgba(34, 211, 238, 0.28)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.25)',
        'neon-purple':  '0 0 12px rgba(124, 77, 255, 0.50), 0 0 28px rgba(124, 77, 255, 0.25)',
        'neon-cyan':    '0 0 12px rgba(34, 211, 238, 0.50), 0 0 28px rgba(34, 211, 238, 0.22)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },

      /* ---- Border Radius ---- */
      borderRadius: {
        xs:  '6px',
        sm:  '10px',
        md:  '14px',
        lg:  '20px',
        xl:  '28px',
        '2xl': '36px',
      },

      /* ---- Keyframes ---- */
      keyframes: {
        floatIn: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(155, 109, 255, 0.30)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(155, 109, 255, 0.55)' }
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px #10b981' },
          '50%':      { opacity: '0.6', boxShadow: '0 0 14px #10b981' }
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' }
        }
      },

      /* ---- Animations ---- */
      animation: {
        floatIn:       'floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        pulseGlow:     'pulseGlow 2.5s ease-in-out infinite',
        shimmer:       'shimmer 1.4s ease-in-out infinite',
        pulseDot:      'pulseDot 2s ease-in-out infinite',
        scanline:      'scanline 3s linear infinite',
        gradientShift: 'gradientShift 6s ease infinite',
      },

      /* ---- Background sizes for gradient animations ---- */
      backgroundSize: {
        '200%': '200% 200%',
        '300%': '300% 300%',
      },

      /* ---- Transition timing ---- */
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      /* ---- Blur values ---- */
      backdropBlur: {
        xs:  '4px',
        sm:  '8px',
        md:  '12px',
        lg:  '20px',
        xl:  '32px',
      }
    }
  },
  plugins: []
};
