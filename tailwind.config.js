const c = (n) => `rgb(var(--${n}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), surface: c('surface'), subtle: c('subtle'), line: c('line'), ink: c('ink'), muted: c('muted'),
        primary: { DEFAULT: c('primary'), hover: c('primary-hover'), soft: c('primary-soft') },
        ok: { DEFAULT: c('ok'), soft: c('ok-soft') },
        danger: { DEFAULT: c('danger'), soft: c('danger-soft') },
        warn: { DEFAULT: c('warn'), soft: c('warn-soft') },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.05)', pop: '0 12px 32px rgb(16 24 40 / 0.14)' },
    },
  },
  plugins: [],
};
