/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        'bg-alt': 'var(--bg-alt)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-active': 'var(--surface-active)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-focus': 'var(--border-focus)',
        'border-subtle': 'var(--border-subtle)',
        fg: 'var(--fg)',
        'fg-prose': 'var(--fg-prose)',
        'fg-muted': 'var(--fg-muted)',
        'fg-faint': 'var(--fg-faint)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          border: 'var(--accent-border)',
        },
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        error: {
          DEFAULT: 'var(--error)',
          muted: 'var(--error-muted)',
        },
        chip: {
          bg: 'var(--chip-bg)',
          border: 'var(--chip-border)',
          fg: 'var(--chip-fg)',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm, 4px)',
        md: 'var(--r-md, 6px)',
        lg: 'var(--r-lg, 8px)',
        xl: 'var(--r-xl, 12px)',
        '2xl': 'var(--r-2xl, 16px)',
        full: '999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.25s cubic-bezier(0, 0, 0.2, 1)',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        wave: 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
