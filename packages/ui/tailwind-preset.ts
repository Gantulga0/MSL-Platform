import type { Config } from 'tailwindcss';
import { colors, control, elevation, fontSize, radius } from './src/tokens';

/**
 * Shared Tailwind preset built from the design tokens. Apps consume it via
 * `presets: [mslPreset]` so every screen draws from one design language.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        surface: colors.surface,
        'surface-muted': colors.surfaceMuted,
        overlay: colors.overlay,
        fg: colors.fg,
        'fg-muted': colors.fgMuted,
        'fg-subtle': colors.fgSubtle,
        'fg-on-primary': colors.fgOnPrimary,
        border: colors.border,
        'border-strong': colors.borderStrong,
        primary: {
          DEFAULT: colors.primary,
          hover: colors.primaryHover,
          active: colors.primaryActive,
          subtle: colors.primarySubtle,
        },
        success: { DEFAULT: colors.success, subtle: colors.successSubtle },
        warning: { DEFAULT: colors.warning, subtle: colors.warningSubtle },
        danger: { DEFAULT: colors.danger, subtle: colors.dangerSubtle },
        info: { DEFAULT: colors.info, subtle: colors.infoSubtle },
        focus: colors.focus,
      },
      fontSize: fontSize as unknown as Config['theme'],
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
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
