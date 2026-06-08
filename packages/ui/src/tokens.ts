/**
 * MSL design tokens — single source of truth for the design language.
 *
 * Accessibility (NFR-01, WCAG 2.2 AA, deaf-first):
 * - All text/background pairs below meet ≥ 4.5:1 contrast (normal text) or
 *   ≥ 3:1 (large text / UI components). Verified against #ffffff surfaces.
 * - Status colors are NEVER the sole signal — primitives pair them with an
 *   icon + text label (errors are not color-only).
 * - Touch targets ≥ 44px (`control.*` heights).
 */

/** Semantic color palette. Contrast ratios vs white noted where relevant. */
export const colors = {
  // Surfaces
  bg: '#ffffff',
  surface: '#f8fafc', // slate-50
  surfaceMuted: '#f1f5f9', // slate-100
  overlay: 'rgba(15, 23, 42, 0.55)', // slate-900 @55% for dialogs

  // Text
  fg: '#0f172a', // slate-900 — 16.1:1 on white
  fgMuted: '#475569', // slate-600 — 7.5:1 on white
  fgSubtle: '#64748b', // slate-500 — 4.8:1 on white (large/secondary only)
  fgOnPrimary: '#ffffff',

  // Borders
  border: '#cbd5e1', // slate-300
  borderStrong: '#94a3b8', // slate-400

  // Brand / primary — blue-700, 6.3:1 on white
  primary: '#1d4ed8',
  primaryHover: '#1e40af', // blue-800
  primaryActive: '#1e3a8a', // blue-900
  primarySubtle: '#eff6ff', // blue-50

  // Status (700-weights for AA text contrast on white)
  success: '#15803d', // green-700 — 4.8:1
  successSubtle: '#f0fdf4',
  warning: '#b45309', // amber-700 — 4.6:1
  warningSubtle: '#fffbeb',
  danger: '#b91c1c', // red-700 — 6.0:1
  dangerSubtle: '#fef2f2',
  info: '#0369a1', // sky-700 — 5.5:1
  infoSubtle: '#f0f9ff',

  // Focus ring (FR-27 — always visible)
  focus: '#1d4ed8',
} as const;

/** Type scale (rem). Base 16px for readable, simple-language UI. */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1.125rem' }],
  sm: ['0.875rem', { lineHeight: '1.375rem' }],
  base: ['1rem', { lineHeight: '1.625rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.875rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
} as const;

/** Border radii. */
export const radius = {
  sm: '0.375rem',
  md: '0.625rem',
  lg: '0.875rem',
  xl: '1.25rem',
  full: '9999px',
} as const;

/** Elevation (shadows) — subtle, content-first. */
export const elevation = {
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
  md: '0 4px 12px -2px rgba(15, 23, 42, 0.10)',
  lg: '0 12px 28px -6px rgba(15, 23, 42, 0.16)',
} as const;

/** Control sizing — every interactive control is ≥ 44px tall (touch target). */
export const control = {
  heightSm: '2.75rem', // 44px
  heightMd: '3rem', // 48px
  heightLg: '3.5rem', // 56px
  minTouch: '2.75rem', // 44px
} as const;
