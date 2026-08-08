// lib/statusColors.js — single source of truth for admin status colours.
//
// Keeps the dashboard inside the brand palette (green #187106 / accent #FEE647
// / slate neutrals / red for destructive) instead of the old blue-purple-neon
// mix that was duplicated across three pages.

export const BRAND = {
  primary: "#187106",
  primaryDark: "#115005",
  primaryLight: "#e8f2e5",
  accent: "#fee647",
  accentDark: "#7a6500",
  accentLight: "#fffbe0",
  neutral: "#64748b",
  neutralLight: "#f1f5f9",
  slate: "#334155",
  danger: "#b91c1c",
  dangerLight: "#fef2f2",
};

/** Solid colour per demo/class status. */
export const STATUS_COLORS = {
  pending: BRAND.accentDark,
  assigned: BRAND.slate,
  accepted: BRAND.primary,
  rejected_by_tutor: BRAND.danger,
  reassigned: BRAND.primaryDark,
  dropped: BRAND.neutral,
  cancelled: BRAND.neutral,
};

/** Matching soft background per status. */
export const STATUS_BG = {
  pending: BRAND.accentLight,
  assigned: BRAND.neutralLight,
  accepted: BRAND.primaryLight,
  rejected_by_tutor: BRAND.dangerLight,
  reassigned: BRAND.primaryLight,
  dropped: BRAND.neutralLight,
  cancelled: BRAND.neutralLight,
};

export function statusColor(status) {
  return STATUS_COLORS[status] || BRAND.neutral;
}

export function statusBg(status) {
  return STATUS_BG[status] || BRAND.neutralLight;
}

/** Colour pair for a tutor success-rate pill. */
export function successRateStyle(rate) {
  const value = Number(rate) || 0;
  if (value >= 70) return { background: BRAND.primaryLight, color: BRAND.primary };
  if (value > 0) return { background: BRAND.accentLight, color: BRAND.accentDark };
  return { background: BRAND.neutralLight, color: BRAND.neutral };
}
