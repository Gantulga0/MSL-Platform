import type { Config } from 'tailwindcss';
import { colors, control, elevation, fontSize, radius } from './src/tokens';

/**
 * CSS-variable indirection. Every semantic colour resolves to a `--c-*` custom
 * property (defined per-theme in the web app's globals.css `:root` /
 * `[data-theme="night"]`), falling back to the static token hex so the palette
 * still resolves with no CSS loaded and outside the themed app (e.g. tests). The
 * Tailwind class names (`bg-bg`, `text-fg`, …) are unchanged — only the resolved
 * value becomes theme-aware. Tokens stay the single light-theme reference.
 */
const v = (name: string, fallback: string): string => `var(${name}, ${fallback})`;

/**
 * Shared Tailwind preset built from the design tokens. Apps consume it via
 * `presets: [mslPreset]` so every screen draws from one design language.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        // Body = Golos Text; display = Unbounded. Both wired to next/font CSS
        // vars (full Cyrillic incl. Өө/Үү). `sans` keeps its name so existing
        // `font-sans` usages just re-point to the new body family.
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        bg: v('--c-bg', colors.bg),
        surface: v('--c-surface', colors.surface),
        'surface-muted': v('--c-surface-muted', colors.surfaceMuted),
        overlay: v('--c-overlay', colors.overlay),
        fg: v('--c-fg', colors.fg),
        'fg-muted': v('--c-fg-muted', colors.fgMuted),
        'fg-subtle': v('--c-fg-subtle', colors.fgSubtle),
        'fg-on-primary': v('--c-fg-on-primary', colors.fgOnPrimary),
        border: v('--c-border', colors.border),
        'border-strong': v('--c-border-strong', colors.borderStrong),
        primary: {
          DEFAULT: v('--c-primary', colors.primary),
          hover: v('--c-primary-hover', colors.primaryHover),
          active: v('--c-primary-active', colors.primaryActive),
          subtle: v('--c-primary-subtle', colors.primarySubtle),
        },
        // Sage accent — tint/icon/text roles (see tokens.ts contrast notes).
        accent: {
          DEFAULT: v('--c-accent', colors.accent),
          ink: v('--c-accent-ink', colors.accentInk),
          strong: v('--c-accent-strong', colors.accentStrong),
          subtle: v('--c-accent-subtle', colors.accentSubtle),
        },
        // Pastel tint surfaces for Card variants.
        tint: {
          sage: v('--c-tint-sage', colors.tintSage),
          lav: v('--c-tint-lav', colors.tintLav),
          butter: v('--c-tint-butter', colors.tintButter),
        },
        // The single charcoal contrast surface (CTAs / dark card).
        dark: { DEFAULT: v('--c-dark', colors.primary), hover: v('--c-dark-hover', colors.primaryHover) },
        success: { DEFAULT: v('--c-success', colors.success), subtle: v('--c-success-subtle', colors.successSubtle) },
        warning: { DEFAULT: v('--c-warning', colors.warning), subtle: v('--c-warning-subtle', colors.warningSubtle) },
        danger: { DEFAULT: v('--c-danger', colors.danger), subtle: v('--c-danger-subtle', colors.dangerSubtle) },
        info: { DEFAULT: v('--c-info', colors.info), subtle: v('--c-info-subtle', colors.infoSubtle) },
        focus: v('--c-focus', colors.focus),
      },
      fontSize: fontSize as unknown as Config['theme'],
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        '2xl': radius['2xl'],
        full: radius.full,
      },
      boxShadow: {
        sm: elevation.sm,
        md: elevation.md,
        lg: elevation.lg,
      },
      minHeight: { touch: control.minTouch },
      minWidth: { touch: control.minTouch },
      height: {
        'control-sm': control.heightSm,
        'control-md': control.heightMd,
        'control-lg': control.heightLg,
      },
    },
  },
};

export default preset;
