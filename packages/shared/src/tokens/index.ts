/**
 * Design tokens — single source of truth for web + mobile.
 *
 * Philosophy: calm, typography-led, warm neutrals, one restrained accent.
 * Dialect markers are earthy neutrals, not flag colors.
 */

export const color = {
  // Base surfaces
  bg: "#FAF8F4", // warm ivory
  surface: "#FFFFFF",
  surfaceMuted: "#F3EFE8",
  border: "#E6E1D7",
  borderStrong: "#D4CDC0",

  // Text
  ink: "#0F1115", // near-black, warm bias
  inkMuted: "#5A5F66",
  inkSubtle: "#8C8F96",
  inkInverse: "#FAF8F4",

  // Single accent — deep slate-blue, scholarly
  accent: "#2B4A5E",
  accentHover: "#22394A",
  accentSoft: "#E4EBF0",

  // Dialect markers — earthy, not flag-like
  uk: "#6B4B2B", // warm tea
  ukSoft: "#F0E7DB",
  us: "#2E4B6B", // cool navy
  usSoft: "#DFE6EF",

  // State
  success: "#3E6B4E",
  successSoft: "#E3EDE5",
  warning: "#A76C1A",
  warningSoft: "#F4E9D6",
  danger: "#8B2D3B",
  dangerSoft: "#F1DDE0",

  // Dark mode (optional, left simple)
  dark: {
    bg: "#0F1115",
    surface: "#15181E",
    surfaceMuted: "#1B1F26",
    border: "#262B33",
    ink: "#EFEBE3",
    inkMuted: "#A3A7B0",
    accent: "#8BB2C8",
  },
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  "2xl": 28,
  pill: 999,
} as const;

export const typography = {
  family: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
    display: "Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 17,
    lg: 20,
    xl: 24,
    "2xl": 30,
    "3xl": 38,
    "4xl": 48,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
  },
  tracking: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.04em",
  },
} as const;

export const elevation = {
  none: "none",
  sm: "0 1px 2px rgba(15, 17, 21, 0.04), 0 1px 3px rgba(15, 17, 21, 0.06)",
  md: "0 4px 12px rgba(15, 17, 21, 0.06), 0 2px 4px rgba(15, 17, 21, 0.04)",
  lg: "0 12px 32px rgba(15, 17, 21, 0.08), 0 4px 8px rgba(15, 17, 21, 0.04)",
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 380,
  ease: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

export const tokens = { color, space, radius, typography, elevation, motion } as const;
export type Tokens = typeof tokens;
