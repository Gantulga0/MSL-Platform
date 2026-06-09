/**
 * MSL design tokens — single source of truth for the design language.
 *
 * Visual language (2026 redesign): light, airy, friendly EdTech. Warm cream
 * canvas, white cards floating on soft low shadows, pastel accent tints (sage /
 * lavender / butter) used sparingly, ONE charcoal accent for primary CTAs, very
 * rounded corners, pill buttons.
 *
 * Accessibility (NFR-01, WCAG 2.2 AA, deaf-first):
 * - Every text/background pair below is contrast-checked. The pastel look must
 *   NOT cost contrast: tints are only ever paired with dark ink (never white),
 *   and the sage accent is a *tint/icon* colour — solid white-on-sage fails AA
 *   (2.4:1), so the primary CTA is the charcoal `primary` (white on it ≈17:1).
 * - Status colours are NEVER the sole signal — primitives pair them with an
 *   icon + text label (errors are not colour-only).
 * - Touch targets ≥ 44px (`control.*` heights); focus ring always visible.
 */

/** Semantic colour palette. Contrast ratios are vs the relevant surface. */
export const colors = {
  // Surfaces
  bg: '#f7f7f1', // warm cream canvas
  surface: '#ffffff', // floating cards
  surfaceMuted: '#efefe7', // hover / inset on cream
  overlay: 'rgba(30, 36, 32, 0.50)', // dialog scrim

  // Text (ink scale) — all AA on both white and cream
  fg: '#1e2420', // near-black ink — ~14:1 cream, ~15:1 white
  fgMuted: '#5e655b', // secondary — 6.0:1 white, 5.6:1 cream
  fgSubtle: '#636a60', // tertiary — 5.6:1 white, 5.2:1 cream, 4.8:1 on surface-muted
  fgOnPrimary: '#ffffff', // text on charcoal / dark surfaces

  // Borders
  border: '#e4e3d9', // soft warm divider (decorative)
  borderStrong: '#84837a', // 3.5:1 on white — input/control edges (1.4.11)

  // Primary = charcoal (the dark pill CTA + the one dark contrast card)
  primary: '#20211f', // white on it ≈17:1
  primaryHover: '#34352f',
  primaryActive: '#161611',
  primarySubtle: '#ececE3', // neutral warm fill

  // Accent = sage green. NOTE: tint/icon/text only — not a white-text button bg.
  accent: '#8fb339', // sage — charts, tint, icon-on-dark
  accentInk: '#4f5e2e', // green text/links/icons on light — 7.1:1 white
  accentStrong: '#6e8a2c', // mid-green for borders/charts (≥3:1)
  accentSubtle: '#e6eedd', // sage tint surface

  // Pastel tint surfaces for Card variants (always with dark ink text)
  tintSage: '#e6eedd',
  tintLav: '#e8e7f1',
  tintButter: '#f1efc4',

  // Status (AA text weights; never colour-only — paired with icon + label)
  success: '#15803d', // 4.8:1
  successSubtle: '#eef7f0',
  warning: '#9a5b08', // amber-800 — 5.0:1 (warmer canvas needs a touch darker)
  warningSubtle: '#fbf3e3',
  danger: '#b91c1c', // 6.0:1
  dangerSubtle: '#fbeeee',
  info: '#0369a1', // 5.5:1
  infoSubtle: '#eef5fb',

  // Focus ring (FR-27 — always visible) — dark sage, 8.7:1 on white
  focus: '#3e5224',
} as const;

/**
 * Type scale (rem). Geometric/humanist sans (Inter, full Cyrillic incl. Өө/Үү).
 * display 32/40 · h1 28 · h2 22 · h3 18 · body 16 · small 14.
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12 — chips/meta
  sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14 — small
  base: ['1rem', { lineHeight: '1.625rem' }], // 16 — body
  lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18 — h3
  xl: ['1.375rem', { lineHeight: '1.75rem' }], // 22 — h2
  '2xl': ['1.75rem', { lineHeight: '2.125rem' }], // 28 — h1
  '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32/40 — display
  '4xl': ['2.5rem', { lineHeight: '2.875rem' }], // 40 — hero
} as const;

/** Border radii. Cards ~24px, controls pill. */
export const radius = {
  sm: '0.5rem', // 8
  md: '0.75rem', // 12 — inputs
  lg: '1rem', // 16
  xl: '1.5rem', // 24 — cards
  '2xl': '1.75rem', // 28 — large panels
  full: '9999px', // pills / circular icon buttons
} as const;

/** Elevation — soft, low, content-first (cards float on cream). */
export const elevation = {
  sm: '0 1px 2px 0 rgba(30, 36, 32, 0.05)',
  md: '0 8px 24px -10px rgba(30, 36, 32, 0.15)',
  lg: '0 20px 45px -15px rgba(30, 36, 32, 0.20)',
} as const;

/** Control sizing — every interactive control is ≥ 44px tall (touch target). */
export const control = {
  heightSm: '2.75rem', // 44px
  heightMd: '3rem', // 48px
  heightLg: '3.5rem', // 56px
  minTouch: '2.75rem', // 44px
} as const;
