/**
 * Yrdly Stitch Design System Tokens
 * Single source of truth for all colors, fonts, and spacing constants.
 * Import from "@/lib/designTokens" to use in any component.
 */

// ── Colors ───────────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg: "#101418",
  surface: "#1d2025",
  surfaceLow: "#191c21",
  card: "#1E2126",
  elevated: "#272a2f",
  dark: "#15181D",

  // Green (primary brand)
  green: "#388E3C",
  greenLight: "#82DB7E",
  greenBright: "#6edf51",
  greenFaint: "rgba(56,142,60,0.15)",
  greenFaint2: "rgba(130,219,126,0.2)",

  // Blue (secondary)
  blue: "#006ec9",
  blueLight: "#a5c8ff",

  // Status
  error: "#E53935",
  errorFg: "#ffb4ab",
  errorBg: "#690005",

  // Text
  onSurface: "#e1e2e9",
  onSurfaceVariant: "#bfcab9",
  outline: "#899485",
  outlineVariant: "rgba(64,73,61,0.3)",

  // Misc
  overlay: "rgba(0,0,0,0.7)",
};

// ── Typography ────────────────────────────────────────────────────────────────
export const fonts = {
  body: "Work Sans, sans-serif",
  headline: "Plus Jakarta Sans, sans-serif",
  editorial: "Raleway, sans-serif",
  display: "Pacifico, cursive",
  brand: "Jersey 25, sans-serif",
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radius = {
  card: "11px",
  pill: "9999px",
  input: "9999px",
  modal: "20px",
  chip: "9999px",
  image: "8px",
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadows = {
  dropdown: "0 20px 40px rgba(0,0,0,0.6)",
  card: "0 4px 12px rgba(0,0,0,0.3)",
};

// ── Shorthand aliases (most commonly used) ────────────────────────────────────
export const C = colors;
export const F = fonts;
export const R = radius;
