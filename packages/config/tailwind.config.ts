import type { Config } from 'tailwindcss'

const config: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#bdd0ff',
          300: '#91afff',
          400: '#6085ff',
          500: '#3b5bff',
          600: '#1f35f5',
          700: '#1825e1',
          800: '#1a20b6',
          900: '#1b228f',
          950: '#111457',
        },
        brand: {
          DEFAULT: '#3b5bff',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
}

export default config
