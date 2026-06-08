import type { Config } from 'tailwindcss';
import mslPreset from '@msl/ui/tailwind-preset';

/**
 * Web Tailwind config. Draws all tokens from the shared MSL design-system preset
 * so every screen uses one design language. Content globs include @msl/ui so its
 * utility classes are not purged.
 */
const config: Config = {
  presets: [mslPreset as Partial<Config>],
  content: [
    './src/**/*.{ts,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
