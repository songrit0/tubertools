import { Platform } from 'react-native';

// Color tokens shared by host + player screens. Pulled from the original
// neon palette but kept close to tubertools' theme/colors.js where possible.
// Aligned with the Sync-Vote Pro design tokens.
export const NEON = {
  yellow: { hex: '#FFD66B', soft: 'rgba(255,214,107,0.10)', border: 'rgba(255,214,107,0.30)' },
  red:    { hex: '#EF5757', soft: 'rgba(239,87,87,0.10)',   border: 'rgba(239,87,87,0.30)'   },
  green:  { hex: '#4ADE80', soft: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.30)'  },
  cyan:   { hex: '#38BDF8', soft: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)'  },
};

// In the refreshed design, choice cards take the protocol accent instead of
// per-letter colors. Keep this map for fallbacks but most call sites should
// drive color from `themeColor`.
export const CHOICE_COLORS = {
  A: '#38BDF8',
  B: '#4ADE80',
  C: '#FFD66B',
};

export function themeBackground(color) {
  return NEON[color]?.soft || 'transparent';
}

export function themeBorder(color) {
  return NEON[color]?.border || 'rgba(255,255,255,0.2)';
}

export function themeFg(color) {
  return NEON[color]?.hex || '#F5F5F7';
}

// Build a glow style — text-shadow on mobile, box-shadow on web for crisper
// halo. Spread is moderate; callers can wrap in a larger View if they want
// more bloom.
export function neonTextGlow(color) {
  const hex = themeFg(color);
  if (Platform.OS === 'web') {
    return {
      textShadowColor: hex,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 14,
    };
  }
  return {
    textShadowColor: hex,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  };
}

export function neonBoxGlow(color) {
  const hex = themeFg(color);
  if (Platform.OS === 'web') {
    return {
      // RN-Web supports `boxShadow` directly when written as a regular style.
      boxShadow: `0 0 18px ${hex}, inset 0 0 12px ${hex}`,
    };
  }
  return {
    shadowColor: hex,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  };
}
