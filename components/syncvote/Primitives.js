import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';

// Design tokens lifted from the Sync-Vote Pro redesign canvas.
export const TOKENS = {
  bg:        '#0a0a0b',
  bg1:       '#0e0e10',
  bg2:       '#131316',
  surface:   '#151518',
  surface2:  '#1a1a1e',
  surface3:  '#202024',
  line:      'rgba(255,255,255,0.05)',
  line2:     'rgba(255,255,255,0.08)',
  line3:     'rgba(255,255,255,0.14)',
  ink:       '#f5f5f6',
  ink2:      '#c8c8cc',
  ink3:      '#8a8a91',
  ink4:      '#5b5b62',
  ink5:      '#2c2c32',
  gold:      '#ffd66b',
  goldDim:   '#b9933d',
  goldInk:   '#1a1402',
  pYellow:   '#ffd66b',
  pRed:      '#ef5757',
  pGreen:    '#4ade80',
  pCyan:     '#38bdf8',
};

const MONO = Platform.select({ web: 'JetBrains Mono, ui-monospace, monospace', default: 'monospace' });
export const FONT_MONO = MONO;

export const PROTOCOL_META = {
  yellow: { label: 'Standby',  color: TOKENS.pYellow, desc: 'Calm tension' },
  red:    { label: 'Pressure', color: TOKENS.pRed,    desc: 'Decide now'   },
  green:  { label: 'Pass',     color: TOKENS.pGreen,  desc: 'Safe answer'  },
  cyan:   { label: 'Terminal', color: TOKENS.pCyan,   desc: 'Locked in'    },
};

// ── Pill ────────────────────────────────────────────────────────────────────
const PILL_TONES = {
  neutral: { bg: TOKENS.surface2,            fg: TOKENS.ink2,  bd: TOKENS.line2 },
  green:   { bg: 'rgba(74,222,128,0.10)',    fg: TOKENS.pGreen, bd: 'rgba(74,222,128,0.25)' },
  gold:    { bg: 'rgba(255,214,107,0.10)',   fg: TOKENS.gold,   bd: 'rgba(255,214,107,0.25)' },
  red:     { bg: 'rgba(239,87,87,0.10)',     fg: TOKENS.pRed,   bd: 'rgba(239,87,87,0.25)' },
  cyan:    { bg: 'rgba(56,189,248,0.10)',    fg: TOKENS.pCyan,  bd: 'rgba(56,189,248,0.25)' },
};

export function Pill({ tone = 'neutral', dot = false, children, style }) {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.bd }, style]}>
      {dot ? <View style={[styles.pillDot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.pillText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

// ── RoomChip ────────────────────────────────────────────────────────────────
export function RoomChip({ code = '------', size = 'md' }) {
  const big = size === 'lg';
  return (
    <View style={[styles.roomChip, big && { paddingHorizontal: 12, paddingVertical: 6 }]}>
      <View style={styles.roomDot} />
      <Text style={[styles.roomCode, { fontSize: big ? 13 : 11 }]}>{code}</Text>
    </View>
  );
}

// ── Stat block ──────────────────────────────────────────────────────────────
export function Stat({ n, l, tint }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, tint && { color: tint }]} numberOfLines={1}>{n}</Text>
      <Text style={styles.statL}>{l}</Text>
    </View>
  );
}

// ── VAvatar (small persona chip) ────────────────────────────────────────────
function hashHue(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export function VAvatar({ name = '', imageUrl = '', size = 24, ring = false }) {
  const hue = hashHue(name);
  const ringStyle = ring ? { borderColor: TOKENS.gold, borderWidth: 2 } : null;
  const initials = (name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: TOKENS.surface2 },
          ringStyle,
        ]}
      />
    );
  }
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2,
        backgroundColor: `hsl(${hue},32%,24%)`,
        alignItems: 'center', justifyContent: 'center' },
      ringStyle,
    ]}>
      <Text style={{ color: `hsl(${hue},70%,80%)`, fontSize: Math.max(9, size * 0.32), fontFamily: MONO, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

// ── ConsensusBanner ─────────────────────────────────────────────────────────
const BANNER = {
  awaiting: { text: 'Awaiting signals',                sub: 'Players have not converged', color: TOKENS.ink3,   bd: TOKENS.line2,            bg: TOKENS.surface },
  achieved: { text: 'Consensus achieved',              sub: 'Submit to lock the floor',   color: TOKENS.pGreen, bd: 'rgba(74,222,128,0.30)', bg: 'rgba(74,222,128,0.06)' },
  terminal: { text: 'Terminal state · Protocol closed', sub: 'All signals locked',         color: TOKENS.pCyan,  bd: 'rgba(56,189,248,0.30)', bg: 'rgba(56,189,248,0.06)' },
};

export function ConsensusBanner({ state = 'awaiting' }) {
  const s = BANNER[state] || BANNER.awaiting;
  return (
    <View style={[styles.banner, { backgroundColor: s.bg, borderColor: s.bd }]}>
      <View style={styles.bannerLeft}>
        <View style={[styles.bannerDot, { backgroundColor: s.color }]} />
        <Text style={[styles.bannerText, { color: s.color }]}>{s.text}</Text>
      </View>
      <Text style={styles.bannerSub} numberOfLines={1}>{s.sub}</Text>
    </View>
  );
}

// ── SlotTile (broadcast multiview tile) ─────────────────────────────────────
export function SlotTile({ idx, name, imageUrl, choice, state, accent, height = 160 }) {
  const isFinal = state === 'final';
  const isLive = state === 'live';
  const tint = (isFinal || (isLive && choice)) ? accent : TOKENS.line2;
  const stateText = state === 'empty' ? 'EMPTY' : state === 'live' ? 'LIVE' : 'FINAL';
  return (
    <View style={[
      styles.tile,
      { height, borderColor: tint, backgroundColor: isFinal ? mixWithAccent(accent, 0.10) : TOKENS.surface },
    ]}>
      <View style={styles.tileHead}>
        <View style={styles.tileHeadLeft}>
          <VAvatar name={name} imageUrl={imageUrl} size={20} />
          <Text style={styles.tileName} numberOfLines={1}>{name}</Text>
        </View>
        <Text style={[
          styles.tileMeta,
          { color: isFinal ? accent : isLive ? TOKENS.ink2 : TOKENS.ink4 },
        ]}>
          {String(idx).padStart(2, '0')} · {stateText}
        </Text>
      </View>
      <View style={styles.tileBody}>
        {choice ? (
          <Text style={[styles.tileChoice, { color: isFinal ? accent : TOKENS.ink }]}>{choice}</Text>
        ) : (
          <Text style={styles.tileNoSignal}>NO SIGNAL</Text>
        )}
        {isFinal ? (
          <View style={[styles.tileLock, { borderColor: accent }]}>
            <Text style={[styles.tileLockText, { color: accent }]}>◼ LOCK</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── Card / Panel ────────────────────────────────────────────────────────────
export function Panel({ children, style, padding = 14 }) {
  return <View style={[styles.panel, { padding }, style]}>{children}</View>;
}

// Helper: rough RN equivalent of CSS color-mix(... var(--surface)).
// We just produce a translucent overlay on top of the surface color.
function mixWithAccent(hex, amount) {
  const m = hex.match(/^#([\da-f]{6})$/i);
  if (!m) return TOKENS.surface;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${amount})`;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '600' },

  roomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: TOKENS.surface2,
    borderWidth: 1, borderColor: TOKENS.line2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roomDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TOKENS.gold },
  roomCode: { fontFamily: MONO, color: TOKENS.ink, letterSpacing: 2, fontWeight: '600' },

  stat: {
    flex: 1, minWidth: 110,
    padding: 14, backgroundColor: TOKENS.surface,
    borderWidth: 1, borderColor: TOKENS.line2,
    borderRadius: 10,
  },
  statN: { color: TOKENS.ink, fontSize: 22, fontWeight: '700' },
  statL: { color: TOKENS.ink3, fontSize: 12, marginTop: 2 },

  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, gap: 12,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerDot: { width: 8, height: 8, borderRadius: 4 },
  bannerText: { fontSize: 14, fontWeight: '700' },
  bannerSub: { fontSize: 12, color: TOKENS.ink3, flexShrink: 1 },

  tile: {
    flex: 1, minWidth: 220,
    borderWidth: 1, borderRadius: 10, overflow: 'hidden',
  },
  tileHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: TOKENS.line,
  },
  tileHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  tileName: { color: TOKENS.ink, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  tileMeta: { fontFamily: MONO, fontSize: 10, letterSpacing: 1 },
  tileBody: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tileChoice: { fontSize: 72, lineHeight: 76, fontWeight: '800' },
  tileNoSignal: { fontFamily: MONO, fontSize: 11, color: TOKENS.ink4, letterSpacing: 3 },
  tileLock: {
    position: 'absolute', bottom: 10, right: 10,
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tileLockText: { fontFamily: MONO, fontSize: 10, fontWeight: '600' },

  panel: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1, borderColor: TOKENS.line2,
    borderRadius: 10,
  },
});
