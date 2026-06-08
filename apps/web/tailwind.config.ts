import type { Config } from 'tailwindcss';

/**
 * Tailwind config. Accessibility-first defaults (NFR-01):
 * - `minHeight`/`minWidth` touch tokens for ≥44px targets.
 * - High-contrast-friendly palette anchored on accessible primaries.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      colors: {
        // WCAG AA-contrast brand primary on white.
        primary: {
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
